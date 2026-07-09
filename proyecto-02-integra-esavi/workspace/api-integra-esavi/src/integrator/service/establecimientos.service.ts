import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEstablecimientoDto, UpdateEstablecimientoDto } from '../dto/establecimiento.dto';
import { CatalogoPadre } from '../entity/catalogo-padre.entity';
import { Establecimiento } from '../entity/establecimiento.entity';
import { Parroquia } from '../entity/parroquia.entity';

const FALLBACK_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

const toSentenceCase = (text: string): string => {
  if (!text) return text;
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const padUniCodigo = (codigo: string): string =>
  /^[0-9]+$/.test(codigo) ? codigo.padStart(6, '0') : codigo;

@Injectable()
export class EstablecimientosService {
  private readonly logger = new Logger(EstablecimientosService.name);

  constructor(
    @InjectRepository(Establecimiento, 'POSTGRES_INTEGRATOR_DS')
    private readonly establecimientoRepository: Repository<Establecimiento>,
    @InjectRepository(Parroquia, 'POSTGRES_INTEGRATOR_DS')
    private readonly parroquiaRepository: Repository<Parroquia>,
    @InjectRepository(CatalogoPadre, 'POSTGRES_INTEGRATOR_DS')
    private readonly catalogoPadreRepository: Repository<CatalogoPadre>,
  ) {}

  async create(dto: CreateEstablecimientoDto, currentUser = FALLBACK_USER): Promise<Establecimiento> {
    const uniCodigo = padUniCodigo(dto.uniCodigo);

    const existing = await this.establecimientoRepository.findOne({
      where: { uniCodigo, isEnabled: true },
    });
    if (existing) {
      throw new BadRequestException(`Ya existe un establecimiento activo con el código: ${uniCodigo}`);
    }

    const establecimiento = this.establecimientoRepository.create({
      uniCodigo,
      uniNombre: toSentenceCase(dto.uniNombre),
      direccion: dto.direccion,
      telefono: dto.telefono,
      longitudGps: dto.longitudGps,
      latitudGps: dto.latitudGps,
      mail: dto.mail,
      createdBy: currentUser,
      updatedBy: currentUser,
      isActive: true,
      isEnabled: true,
    });

    if (dto.parroquiaCodigo) {
      const parroquia = await this.parroquiaRepository.findOne({ where: { codigo: dto.parroquiaCodigo } });
      if (!parroquia) {
        throw new NotFoundException(`Parroquia con código ${dto.parroquiaCodigo} no encontrada`);
      }
      establecimiento.parroquiaResidencia = parroquia;
    }

    if (dto.tipoEntidadId) {
      const tipoEntidad = await this.catalogoPadreRepository.findOne({ where: { id: dto.tipoEntidadId, isEnabled: true } });
      if (!tipoEntidad) throw new NotFoundException(`Tipo de entidad con id ${dto.tipoEntidadId} no encontrado`);
      establecimiento.tipoEntidad = tipoEntidad;
    }

    try {
      return await this.establecimientoRepository.save(establecimiento);
    } catch (err) {
      this.logger.error('Error al guardar establecimiento', err);
      throw err;
    }
  }

  private readonly RELATIONS = [
    'parroquiaResidencia',
    'parroquiaResidencia.canton',
    'parroquiaResidencia.canton.provincia',
    'tipoEntidad',
  ];

  findAll(): Promise<Establecimiento[]> {
    return this.establecimientoRepository.find({
      where: { isEnabled: true },
      relations: this.RELATIONS,
      order: { uniNombre: 'ASC' },
    });
  }

  async findAllPaginated(
    page: number,
    perPage: number,
    q?: string,
  ): Promise<{ data: Establecimiento[]; total: number }> {
    const qb = this.establecimientoRepository
      .createQueryBuilder('establecimiento')
      .leftJoinAndSelect('establecimiento.parroquiaResidencia', 'parroquia')
      .leftJoinAndSelect('parroquia.canton', 'canton')
      .leftJoinAndSelect('canton.provincia', 'provincia')
      .leftJoinAndSelect('establecimiento.tipoEntidad', 'tipoEntidad')
      .where('establecimiento.isEnabled = true');

    if (q?.trim()) {
      const term = `%${q.trim().toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(establecimiento.uniCodigo) LIKE :term
          OR LOWER(establecimiento.uniNombre) LIKE :term
          OR LOWER(establecimiento.mail) LIKE :term
          OR LOWER(tipoEntidad.nombre) LIKE :term
          OR LOWER(parroquia.nombre) LIKE :term
          OR LOWER(canton.nombre) LIKE :term
          OR LOWER(provincia.nombre) LIKE :term)`,
        { term },
      );
    }

    const [data, total] = await qb
      .orderBy('establecimiento.uniNombre', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { data, total };
  }

  findAllLight(): Promise<Pick<Establecimiento, 'id' | 'uniNombre'>[]> {
    return this.establecimientoRepository.find({
      where: { isEnabled: true },
      select: ['id', 'uniNombre'],
    });
  }

  async findOne(id: string): Promise<Establecimiento> {
    const est = await this.establecimientoRepository.findOne({
      where: { id, isEnabled: true },
      relations: this.RELATIONS,
    });
    if (!est) throw new NotFoundException(`Establecimiento con id ${id} no encontrado`);
    return est;
  }

  async findByUniCodigo(uniCodigo: string): Promise<Establecimiento> {
    const est = await this.establecimientoRepository.findOne({
      where: { uniCodigo, isEnabled: true },
      relations: this.RELATIONS,
    });
    if (!est) throw new NotFoundException(`Establecimiento con código ${uniCodigo} no encontrado`);
    return est;
  }

  async update(id: string, dto: UpdateEstablecimientoDto, currentUser = FALLBACK_USER): Promise<Establecimiento> {
    const est = await this.findOne(id);

    if (dto.parroquiaCodigo !== undefined) {
      if (dto.parroquiaCodigo) {
        const parroquia = await this.parroquiaRepository.findOne({ where: { codigo: dto.parroquiaCodigo } });
        if (!parroquia) throw new NotFoundException(`Parroquia con código ${dto.parroquiaCodigo} no encontrada`);
        est.parroquiaResidencia = parroquia;
      } else {
        est.parroquiaResidencia = null;
      }
    }

    if (dto.tipoEntidadId !== undefined) {
      if (dto.tipoEntidadId) {
        const tipoEntidad = await this.catalogoPadreRepository.findOne({ where: { id: dto.tipoEntidadId, isEnabled: true } });
        if (!tipoEntidad) throw new NotFoundException(`Tipo de entidad con id ${dto.tipoEntidadId} no encontrado`);
        est.tipoEntidad = tipoEntidad;
      } else {
        est.tipoEntidad = null;
      }
    }

    this.establecimientoRepository.merge(est, {
      uniNombre: dto.uniNombre ? toSentenceCase(dto.uniNombre) : est.uniNombre,
      direccion: dto.direccion ?? est.direccion,
      telefono: dto.telefono ?? est.telefono,
      longitudGps: dto.longitudGps ?? est.longitudGps,
      latitudGps: dto.latitudGps ?? est.latitudGps,
      mail: dto.mail ?? est.mail,
      updatedBy: currentUser,
      updatedAt: new Date(),
    });

    return this.establecimientoRepository.save(est);
  }

  async delete(id: string, currentUser = FALLBACK_USER): Promise<Establecimiento> {
    const est = await this.findOne(id);
    est.isEnabled = false;
    est.deletedAt = new Date();
    est.deletedBy = currentUser;
    return this.establecimientoRepository.save(est);
  }
}
