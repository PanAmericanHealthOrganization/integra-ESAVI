import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificadorDto, UpdateNotificadorDto } from '../dto/notificador.dto';
import { CatalogoPadre } from '../entity/catalogo-padre.entity';
import { Notificador } from '../entity/notificador.entity';

const FALLBACK_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

@Injectable()
export class NotificadorService {
  private readonly logger = new Logger(NotificadorService.name);

  constructor(
    @InjectRepository(Notificador, 'POSTGRES_INTEGRATOR_DS')
    private readonly notificadorRepository: Repository<Notificador>,
    @InjectRepository(CatalogoPadre, 'POSTGRES_INTEGRATOR_DS')
    private readonly catalogoPadreRepository: Repository<CatalogoPadre>,
  ) {}

  async createOrUpdateFromVigiflow(
    identificacion: string,
    profesionDescripcion: string | null,
    nombres?: string,
  ): Promise<Notificador> {
    if (!identificacion?.trim()) return null;
    const id = identificacion.trim();

    let notificador = await this.notificadorRepository.findOne({
      where: { identificacion: id },
      relations: ['profesion'],
    });

    if (!notificador) {
      notificador = this.notificadorRepository.create({
        identificacion: id,
        createdBy: FALLBACK_USER,
        updatedBy: FALLBACK_USER,
        isActive: true,
        isEnabled: true,
      });
    }

    if (nombres?.trim()) {
      notificador.nombres = nombres.trim();
    }

    if (profesionDescripcion?.trim()) {
      try {
        const subcategorias = await this.catalogoPadreRepository.find({
          where: { padre: { codigo: 'OCUPACION' }, isEnabled: true },
          relations: ['padre'],
        });

        const profesionNorm = this.normalizar(profesionDescripcion.trim());
        let mejorMatch: CatalogoPadre | null = null;
        let mejorSimilitud = 0;

        for (const sub of subcategorias) {
          const similitud = this.calcularSimilitud(profesionNorm, this.normalizar(sub.nombre));
          if (similitud > mejorSimilitud) {
            mejorSimilitud = similitud;
            mejorMatch = sub;
          }
        }

        if (mejorMatch && mejorSimilitud >= 0.9) {
          notificador.profesion = mejorMatch;
          this.logger.log(`Profesión "${profesionDescripcion}" → "${mejorMatch.nombre}" (${(mejorSimilitud * 100).toFixed(1)}%)`);
        } else {
          this.logger.warn(`Profesión "${profesionDescripcion}" sin coincidencia ≥90% en OCUPACION (mejor: ${(mejorSimilitud * 100).toFixed(1)}%)`);
        }
      } catch (err) {
        this.logger.warn(`Error buscando profesión en catálogo OCUPACION: ${err.message}`);
      }
    }

    notificador.updatedBy = FALLBACK_USER;
    return this.notificadorRepository.save(notificador);
  }

  private normalizar(texto: string): string {
    return texto.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  private calcularSimilitud(a: string, b: string): number {
    if (a === b) return 1;
    const la = a.length;
    const lb = b.length;
    if (la === 0 || lb === 0) return 0;

    const matrix: number[][] = Array.from({ length: lb + 1 }, (_, i) =>
      Array.from({ length: la + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );

    for (let i = 1; i <= lb; i++) {
      for (let j = 1; j <= la; j++) {
        matrix[i][j] =
          b[i - 1] === a[j - 1]
            ? matrix[i - 1][j - 1]
            : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }

    return (Math.max(la, lb) - matrix[lb][la]) / Math.max(la, lb);
  }

  async create(dto: CreateNotificadorDto, currentUser: string = FALLBACK_USER): Promise<Notificador> {
    const existing = await this.notificadorRepository.findOne({
      where: { identificacion: dto.identificacion },
    });
    if (existing) {
      throw new Error(`Ya existe un notificador con identificación: ${dto.identificacion}`);
    }

    const notificador = this.notificadorRepository.create({
      identificacion: dto.identificacion,
      nombres: dto.nombres,
      createdBy: currentUser,
      updatedBy: currentUser,
      isActive: true,
      isEnabled: true,
    });

    if (dto.profesionId) {
      const profesion = await this.catalogoPadreRepository.findOne({ where: { id: dto.profesionId, isEnabled: true } });
      if (!profesion) throw new NotFoundException(`Subcategoría de profesión con id ${dto.profesionId} no encontrada`);
      notificador.profesion = profesion;
    }

    return this.notificadorRepository.save(notificador);
  }

  findAll(): Promise<Notificador[]> {
    return this.notificadorRepository.find({
      where: { isEnabled: true },
      relations: ['profesion'],
      order: { nombres: 'ASC' },
    });
  }

  async findOne(identificacion: string): Promise<Notificador> {
    const notificador = await this.notificadorRepository.findOne({
      where: { identificacion, isEnabled: true },
      relations: ['profesion'],
    });
    if (!notificador) {
      throw new NotFoundException(`Notificador con identificación ${identificacion} no encontrado`);
    }
    return notificador;
  }

  async update(identificacion: string, dto: UpdateNotificadorDto, currentUser: string = FALLBACK_USER): Promise<Notificador> {
    const notificador = await this.findOne(identificacion);

    this.notificadorRepository.merge(notificador, {
      nombres: dto.nombres ?? notificador.nombres,
      updatedBy: currentUser,
      updatedAt: new Date(),
    });

    if (dto.profesionId !== undefined) {
      if (dto.profesionId) {
        const profesion = await this.catalogoPadreRepository.findOne({ where: { id: dto.profesionId, isEnabled: true } });
        if (!profesion) throw new NotFoundException(`Subcategoría de profesión con id ${dto.profesionId} no encontrada`);
        notificador.profesion = profesion;
      } else {
        notificador.profesion = null;
      }
    }

    return this.notificadorRepository.save(notificador);
  }

  async buscarProfesionPorNombre(descripcion: string): Promise<CatalogoPadre | null> {
    if (!descripcion?.trim()) return null;
    const subcategorias = await this.catalogoPadreRepository.find({
      where: { padre: { codigo: 'OCUPACION' }, isEnabled: true },
      relations: ['padre'],
    });
    const norm = this.normalizar(descripcion.trim());
    let mejorMatch: CatalogoPadre | null = null;
    let mejorSimilitud = 0;
    for (const sub of subcategorias) {
      const sim = this.calcularSimilitud(norm, this.normalizar(sub.nombre));
      if (sim > mejorSimilitud) { mejorSimilitud = sim; mejorMatch = sub; }
    }
    return mejorMatch && mejorSimilitud >= 0.9 ? mejorMatch : null;
  }

  async delete(identificacion: string, currentUser: string = FALLBACK_USER): Promise<Notificador> {
    const notificador = await this.findOne(identificacion);
    notificador.isEnabled = false;
    notificador.deletedAt = new Date();
    notificador.deletedBy = currentUser;
    return this.notificadorRepository.save(notificador);
  }
}
