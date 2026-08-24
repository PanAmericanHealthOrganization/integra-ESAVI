import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEstablecimientoDto, UpdateEstablecimientoDto } from '../dto/establecimiento.dto';
import { CatalogoPadre } from '../entity/catalogo-padre.entity';
import { Establecimiento } from '../entity/establecimiento.entity';
import { Parroquia } from '../entity/parroquia.entity';
import { CodigosTerritorialesUtils } from '../../utils/codigos-territoriales.util';

const FALLBACK_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

const toSentenceCase = (text: string): string => {
  if (!text) return text;
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const padUniCodigo = (codigo: string): string => CodigosTerritorialesUtils.unicodigo(codigo) ?? codigo;

/**
 * Normaliza un nombre de establecimiento para poder compararlo: sin tildes, sin puntuación
 * ni espacios repetidos, en minúsculas. DHIS2 entrega la unidad organizativa en mayúsculas
 * («DISPENSARIO POPULAR HUAQUEÑA») y TR_ESTABLECIMIENTO la guarda en sentence-case, así que
 * una igualdad literal entre ambas no acierta nunca.
 */
const normalizarNombre = (nombre: string): string =>
  nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

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
      this.invalidarIndicePorNombre();
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

  /**
   * Índice en memoria por nombre normalizado, para resolver la unidad organizativa de DHIS2
   * sin una consulta por notificación. Se llena la primera vez que hace falta y vive lo que
   * viva el proceso: TR_ESTABLECIMIENTO sólo cambia cuando alguien la edita a mano o se
   * vuelve a sembrar, y en ambos casos `invalidarIndicePorNombre()` lo descarta.
   *
   * Los nombres duplicados se guardan como colisión y no resuelven: hay establecimientos
   * distintos con el mismo nombre en cantones distintos —«Mariscal Sucre» aparece varias
   * veces—, y elegir uno al azar pondría al paciente en otra provincia.
   */
  private indicePorNombre: Map<string, Establecimiento | null> | null = null;

  /** Descarta el índice por nombre. Se llama al crear, actualizar o borrar un establecimiento. */
  invalidarIndicePorNombre(): void {
    this.indicePorNombre = null;
  }

  private async obtenerIndicePorNombre(): Promise<Map<string, Establecimiento | null>> {
    if (this.indicePorNombre) return this.indicePorNombre;

    const todos = await this.establecimientoRepository.find({
      where: { isEnabled: true },
      relations: this.RELATIONS,
    });

    const indice = new Map<string, Establecimiento | null>();
    for (const est of todos) {
      const clave = normalizarNombre(est.uniNombre ?? '');
      if (!clave) continue;
      // `null` marca un nombre ambiguo: existe más de un establecimiento que lo lleva.
      indice.set(clave, indice.has(clave) ? null : est);
    }
    this.indicePorNombre = indice;
    return indice;
  }

  /**
   * Resuelve un establecimiento a partir de lo que DHIS2 entrega de la unidad organizativa:
   * primero por código —normalizado a seis dígitos, porque el catálogo se sembró así y DHIS2
   * puede entregarlo sin los ceros iniciales— y, si no aparece, por nombre normalizado.
   *
   * Devuelve el establecimiento con la cadena parroquia → cantón → provincia ya cargada, que
   * es lo que necesita quien deriva de aquí la residencia del paciente.
   */
  async findByCodigoONombre(codigo?: string | null, nombre?: string | null): Promise<Establecimiento | null> {
    const uniCodigo = CodigosTerritorialesUtils.unicodigo(codigo);
    if (uniCodigo) {
      const porCodigo = await this.establecimientoRepository.findOne({
        where: { uniCodigo, isEnabled: true },
        relations: this.RELATIONS,
      });
      if (porCodigo) return porCodigo;
    }

    const clave = normalizarNombre(nombre ?? '');
    if (!clave) return null;

    const indice = await this.obtenerIndicePorNombre();
    return indice.get(clave) ?? null;
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

    this.invalidarIndicePorNombre();
    return this.establecimientoRepository.save(est);
  }

  async delete(id: string, currentUser = FALLBACK_USER): Promise<Establecimiento> {
    const est = await this.findOne(id);
    est.isEnabled = false;
    est.deletedAt = new Date();
    est.deletedBy = currentUser;
    this.invalidarIndicePorNombre();
    return this.establecimientoRepository.save(est);
  }
}
