import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateParametroDto, UpdateParametroDto } from '../dto';
import { Parametro } from '../entity/parametro.entity';
import { decryptValue, encryptValue } from '../utils/parametro-crypto.util';

import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';

const FALLBACK_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

// TTL corto: los módulos consumidores (DHIS2, VigiFlow, WHODrug, MedDRA) llaman
// getValor() en cada request/job; el caché evita ir a BD y desencriptar en cada llamada.
const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class ParametroService {
  private readonly logger = new Logger(ParametroService.name);
  private readonly valorCache = new Map<string, { valor: string; expiresAt: number }>();

  constructor(
    @InjectRepository(Parametro, 'POSTGRES_INTEGRATOR_DS')
    private readonly parametroRepository: Repository<Parametro>,
  ) {}

  /**
   * Punto de acceso centralizado para que otros módulos (DHIS2, VigiFlow,
   * WHODrug, MedDRA, etc.) obtengan sus credenciales/configuración desde
   * TC_PARAMETRO en vez de variables de entorno. Si es_encriptado=true,
   * desencripta el valor con la llave maestra (PROD_ENCRYPTION_KEY) antes
   * de retornarlo.
   */
  async getValor(modulo: string, clave: string): Promise<string> {
    const cacheKey = `${modulo}::${clave}`;
    const cached = this.valorCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.valor;
    }

    const parametro = await this.parametroRepository.findOne({
      where: { modulo, clave, isEnabled: true },
    });
    if (!parametro) {
      throw new Error(`No se encontró el parámetro "${clave}" del módulo "${modulo}"`);
    }

    const { valor } = this.decryptValor(parametro);
    this.valorCache.set(cacheKey, { valor, expiresAt: Date.now() + CACHE_TTL_MS });
    return valor;
  }

  async create(createDto: CreateParametroDto, currentUser: string = FALLBACK_USER): Promise<Parametro> {
    try {
      const existing = await this.findByKey(createDto.clave);
      if (existing) {
        throw new Error(`Ya existe un parámetro con la clave: ${createDto.clave}`);
      }
      const parametro = plainToClass(Parametro, createDto);
      parametro.createdBy = currentUser;
      parametro.updatedBy = currentUser;
      this.encryptValor(parametro);
      const saved = await this.parametroRepository.save(parametro);
      this.valorCache.clear();
      return this.decryptValor(saved);
    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      this.logger.log(`Parametro creado: ${JSON.stringify(createDto)} por ${currentUser}`);
    }
  }

  async delete(uuid: string, currentUser: string = FALLBACK_USER): Promise<Parametro> {
    const parametro = await this.findOne(uuid);
    parametro.isEnabled = false;
    parametro.deletedAt = new Date();
    parametro.deletedBy = currentUser;
    this.encryptValor(parametro);
    const saved = await this.parametroRepository.save(parametro);
    this.valorCache.clear();
    return this.decryptValor(saved);
  }

  async findAll(): Promise<Parametro[]> {
    const parametros = await this.parametroRepository.find({ where: { isEnabled: true } });
    return parametros.map((parametro) => this.decryptValor(parametro));
  }

  async findOne(uuid: string): Promise<Parametro> {
    const parametro = await this.parametroRepository.findOne({ where: { id: uuid, isEnabled: true } });
    if (parametro) {
      return this.decryptValor(parametro);
    }
    throw Error('Parámetro no encontrado');
  }

  async update(uuid: string, updateParametroDto: UpdateParametroDto, currentUser: string = FALLBACK_USER): Promise<Parametro> {
    const parametro = await this.findOne(uuid);
    if (parametro) {
      this.parametroRepository.merge(parametro, updateParametroDto);
      parametro.updatedBy = currentUser;
      parametro.updatedAt = new Date();
      this.encryptValor(parametro);
      const saved = await this.parametroRepository.save(parametro);
      this.valorCache.clear();
      return this.decryptValor(saved);
    }
  }

  async findByKey(key: string) {
    return this.parametroRepository.findOne({
      where: { clave: key },
    });
  }

  private encryptValor(parametro: Parametro): void {
    if (parametro.es_encriptado && parametro.valor) {
      parametro.valor = encryptValue(parametro.valor);
    }
  }

  private decryptValor(parametro: Parametro): Parametro {
    if (parametro?.es_encriptado && parametro.valor) {
      parametro.valor = decryptValue(parametro.valor);
    }
    return parametro;
  }
}
