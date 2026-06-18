import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateParametroDto, UpdateParametroDto } from '../dto';
import { Parametro } from '../entity/parametro.entity';

import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';

const FALLBACK_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

@Injectable()
export class ParametroService {
  private readonly logger = new Logger(ParametroService.name);

  constructor(
    @InjectRepository(Parametro, 'POSTGRES_INTEGRATOR_DS')
    private readonly parametroRepository: Repository<Parametro>,
  ) {}

  async create(createDto: CreateParametroDto, currentUser: string = FALLBACK_USER): Promise<Parametro> {
    try {
      const existing = await this.findByKey(createDto.clave);
      if (existing) {
        throw new Error(`Ya existe un parámetro con la clave: ${createDto.clave}`);
      }
      const parametro = plainToClass(Parametro, createDto);
      parametro.createdBy = currentUser;
      parametro.updatedBy = currentUser;
      return this.parametroRepository.save(parametro);
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
    return this.parametroRepository.save(parametro);
  }

  findAll(): Promise<Parametro[]> {
    return this.parametroRepository.find({ where: { isEnabled: true } });
  }

  findOne(uuid: string): Promise<Parametro> {
    const parametro = this.parametroRepository.findOne({ where: { id: uuid, isEnabled: true } });
    if (parametro) {
      return parametro;
    }
    throw Error('Parámetro no encontrado');
  }

  async update(uuid: string, updateParametroDto: UpdateParametroDto, currentUser: string = FALLBACK_USER): Promise<Parametro> {
    const parametro = await this.findOne(uuid);
    if (parametro) {
      this.parametroRepository.merge(parametro, updateParametroDto);
      parametro.updatedBy = currentUser;
      parametro.updatedAt = new Date();
      return this.parametroRepository.save(parametro);
    }
  }

  async findByKey(key: string) {
    return this.parametroRepository.findOne({
      where: { clave: key },
    });
  }
}
