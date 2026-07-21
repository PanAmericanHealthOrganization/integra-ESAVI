import {Injectable,Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {plainToClass} from 'class-transformer';
import {IsNull,Repository} from 'typeorm';
import {CreateDatoVacunaDto,UpdateDatoVacunaDto} from '../dto';
import {DatoVacuna} from '../entity/dato-vacuna.entity';
import {DatoVacunacion} from '../entity/dato-vacunacion.entity';
import {Notificacion} from '../entity/notificacion.entity';
import {EntityNotFoundException} from '../exception/enntity-not-found.exception';
import {CatalogoPadreService} from './catalogo-padre.service';

const CODIGO_PADRE_ROL_VACUNA = 'CARACTERIZACION_VACUNA';

@Injectable()
export class DatoVacunaService {
  private readonly logger = new Logger(DatoVacunaService.name);

  private datoVacunaMinimoCache: Map<string, DatoVacuna[]> | null = null;
  private datoVacunaCompletoCache: Map<string, Map<string, DatoVacuna>> | null = null;

  constructor(
    @InjectRepository(DatoVacuna, 'POSTGRES_INTEGRATOR_DS')
    private readonly datoVacunaRepository: Repository<DatoVacuna>,
    @InjectRepository(DatoVacunacion, 'POSTGRES_INTEGRATOR_DS')
    private readonly datoVacunacionRepository: Repository<DatoVacunacion>,
    private readonly catalogoPadreService: CatalogoPadreService,
  ) {}

  async preloadByDatoVacunacionIds(datoVacunacionIds: string[]): Promise<void> {
    if (!datoVacunacionIds.length) {
      this.datoVacunaMinimoCache = new Map();
      this.datoVacunaCompletoCache = new Map();
      return;
    }
    const all = await this.datoVacunaRepository.find({
      where: datoVacunacionIds.map(id => ({ datoVacunacion: { id } })),
      relations: ['datoVacunacion', 'rolVacuna'],
    });
    this.datoVacunaMinimoCache = new Map();
    this.datoVacunaCompletoCache = new Map();
    for (const dv of all) {
      const dvid = dv.datoVacunacion?.id;
      if (!dvid) continue;
      if (!dv.codigoAtc && !dv.rolVacuna && !dv.numeroLote && !dv.indicacionMeddra) {
        if (!this.datoVacunaMinimoCache.has(dvid)) this.datoVacunaMinimoCache.set(dvid, []);
        this.datoVacunaMinimoCache.get(dvid).push(dv);
      } else if (dv.codigoAtc) {
        if (!this.datoVacunaCompletoCache.has(dvid)) this.datoVacunaCompletoCache.set(dvid, new Map());
        this.datoVacunaCompletoCache.get(dvid).set(dv.codigoAtc, dv);
      }
    }
    this.logger.log(`DatoVacuna precargados: ${all.length} registros`);
  }

  /** Carga caché indexado por notificacion.id (compatibilidad con flujo VigiFlow). */
  async preloadByNotificacionIds(notificacionIds: string[]): Promise<void> {
    if (!notificacionIds.length) {
      this.datoVacunaMinimoCache = new Map();
      this.datoVacunaCompletoCache = new Map();
      return;
    }
    const all = await this.datoVacunaRepository.find({
      where: notificacionIds.map(id => ({ datoVacunacion: { notificacion: { id } } })),
      relations: ['datoVacunacion', 'datoVacunacion.notificacion', 'rolVacuna'],
    });
    this.datoVacunaMinimoCache = new Map();
    this.datoVacunaCompletoCache = new Map();
    for (const dv of all) {
      const nid = dv.datoVacunacion?.notificacion?.id;
      if (!nid) continue;
      if (!dv.codigoAtc && !dv.rolVacuna && !dv.numeroLote && !dv.indicacionMeddra) {
        if (!this.datoVacunaMinimoCache.has(nid)) this.datoVacunaMinimoCache.set(nid, []);
        this.datoVacunaMinimoCache.get(nid).push(dv);
      } else if (dv.codigoAtc) {
        if (!this.datoVacunaCompletoCache.has(nid)) this.datoVacunaCompletoCache.set(nid, new Map());
        this.datoVacunaCompletoCache.get(nid).set(dv.codigoAtc, dv);
      }
    }
    this.logger.log(`DatoVacuna precargados (por notificacion): ${all.length} registros`);
  }

  invalidateMinimoEntry(cacheKey: string, datoVacunaId: string): void {
    if (!this.datoVacunaMinimoCache) return;
    const list = this.datoVacunaMinimoCache.get(cacheKey);
    if (!list) return;
    const filtered = list.filter(dv => dv.id !== datoVacunaId);
    if (filtered.length) this.datoVacunaMinimoCache.set(cacheKey, filtered);
    else this.datoVacunaMinimoCache.delete(cacheKey);
  }

  clearDatoVacunaCache(): void {
    this.datoVacunaMinimoCache = null;
    this.datoVacunaCompletoCache = null;
  }

  /**
   *
   * @param datoVacunacion
   * @param createDto
   * @returns
   */
  async createVigiflow(
    datoVacunacion: DatoVacunacion,
    createDto: CreateDatoVacunaDto,
  ): Promise<DatoVacuna> {
    try {
      const existingDatoVacuna = await this.datoVacunaRepository.findOne({
        where: {
          codigoAtc: createDto.codigoAtc,
          numeroLote: createDto.numeroLote,
          datoVacunacion: { id: datoVacunacion.id },
        },
      });

      if (existingDatoVacuna) {
        const { rolVacuna, ...otherFields } = createDto;
        if (rolVacuna) {
          existingDatoVacuna.rolVacuna = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(CODIGO_PADRE_ROL_VACUNA, rolVacuna);
        }
        Object.assign(existingDatoVacuna, otherFields);
        return this.datoVacunaRepository.save(existingDatoVacuna);
      } else {
        const nuevoDatoVacuna = plainToClass(DatoVacuna, createDto);
        if (createDto.rolVacuna) {
          nuevoDatoVacuna.rolVacuna = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(CODIGO_PADRE_ROL_VACUNA, createDto.rolVacuna);
        }
        nuevoDatoVacuna.datoVacunacion = datoVacunacion;
        return this.datoVacunaRepository.save(nuevoDatoVacuna);
      }
    } catch (e) {
      this.logger.error(`Error al procesar los datos de vacuna para Vigiflow: ${e.message}`);
      throw new Error('Hubo un problema al crear o actualizar los datos de vacuna para Vigiflow');
    } finally {
      this.logger.log(`DatoVacuna procesado para Vigiflow`);
    }
  }

  /**
   *
   * @param datoVacunacion
   * @param createDto
   * @returns
   */
  async create(
    datoVacunacion: DatoVacunacion,
    createDto: CreateDatoVacunaDto | CreateDatoVacunaDto[],
  ): Promise<DatoVacuna | DatoVacuna[]> {
    const createDtos = Array.isArray(createDto) ? createDto : [createDto];

    try {
      const datoVacunaArray: DatoVacuna[] = [];

      for (const dto of createDtos) {
        const datoVacuna = plainToClass(DatoVacuna, {
          createdBy: process.env.USUARIO_INSERTA_REGISTRO,
          ...dto,
        });
        if (dto.rolVacuna) {
          datoVacuna.rolVacuna = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(CODIGO_PADRE_ROL_VACUNA, dto.rolVacuna);
        }
        datoVacuna.datoVacunacion = datoVacunacion;

        let existingDatoVacuna: DatoVacuna | null;
        if (dto.codigoAtc) {
          existingDatoVacuna = this.datoVacunaCompletoCache !== null
            ? (this.datoVacunaCompletoCache.get(datoVacunacion.id)?.get(dto.codigoAtc) ?? null)
            : await this.datoVacunaRepository.findOne({
                where: { datoVacunacion: { id: datoVacunacion.id }, codigoAtc: dto.codigoAtc },
              });
        } else {
          existingDatoVacuna = this.datoVacunaMinimoCache !== null
            ? (this.datoVacunaMinimoCache.get(datoVacunacion.id)?.[0] ?? null)
            : await this.datoVacunaRepository.findOne({
                where: { datoVacunacion: { id: datoVacunacion.id } },
              });
        }

        if (existingDatoVacuna) {
          const { rolVacuna, ...otherFields } = dto;
          if (rolVacuna) {
            existingDatoVacuna.rolVacuna = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(CODIGO_PADRE_ROL_VACUNA, rolVacuna);
          }
          if (dto.codigoAtc) {
            // Origen VigiFlow (identificado por codigoAtc): se pisan todos los campos tal cual.
            Object.assign(existingDatoVacuna, otherFields);
          } else {
            // Origen DHIS2 (sin codigoAtc): antes solo se refrescaba numeroDosisVacuna
            // y el resto de campos (fabricante, lote, vía de administración, etc.)
            // quedaban congelados con el valor de la primera importación en
            // cualquier reimport posterior. Se actualiza cada campo presente en el
            // DTO, sin pisar con null/undefined lo que ya hay guardado.
            Object.keys(otherFields).forEach((key) => {
              if (otherFields[key] !== undefined && otherFields[key] !== null) {
                existingDatoVacuna[key] = otherFields[key];
              }
            });
          }
          await this.datoVacunaRepository.save(existingDatoVacuna);
          datoVacunaArray.push(existingDatoVacuna);
        } else {
          await this.datoVacunaRepository.save(datoVacuna);
          datoVacunaArray.push(datoVacuna);
        }
      }

      return createDtos.length === 1 ? datoVacunaArray[0] : datoVacunaArray;
    } catch (e) {
      this.logger.error(`Error al procesar datos vacuna: ${e.message}`);
      throw new Error('Hubo un problema al crear o actualizar los datos de vacuna');
    } finally {
      this.logger.log(`Registro de DatoVacuna ha sido procesado`);
    }
  }

  /**
   *
   * @param datoVacunacionId
   * @returns
   */
  async findByDatoVacunacionId(datoVacunacionId: string): Promise<DatoVacuna[]> {
    return this.datoVacunaRepository.find({
      where: { datoVacunacion: { id: datoVacunacionId } },
      relations: ['rolVacuna'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByNotificacionId(notificacionId: string): Promise<DatoVacuna[]> {
    return this.datoVacunaRepository.find({
      where: { datoVacunacion: { notificacion: { id: notificacionId } } },
      relations: ['rolVacuna', 'datoVacunacion'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByDatoVacunacionIdDtoMinimo(uuidDatoVacunacion: string): Promise<DatoVacuna[]> {
    if (this.datoVacunaMinimoCache !== null) {
      return this.datoVacunaMinimoCache.get(uuidDatoVacunacion) ?? [];
    }
    try {
      return await this.datoVacunaRepository.find({
        where: {
          datoVacunacion: { id: uuidDatoVacunacion },
          rolVacuna: IsNull(),
          numeroLote: IsNull(),
          codigoAtc: IsNull(),
          indicacionMeddra: IsNull(),
        },
      }) ?? [];
    } catch (error) {
      console.error('Error al buscar DatoVacuna por ID de DatoVacunacion:', error);
      return [];
    }
  }

  /** Busca por notificacion.id pasando a través de la relación (compatibilidad VigiFlow). */
  async findByNotifIdDtoMinimo(uuidNotificacion: string): Promise<DatoVacuna[]> {
    if (this.datoVacunaMinimoCache !== null) {
      return this.datoVacunaMinimoCache.get(uuidNotificacion) ?? [];
    }
    try {
      return await this.datoVacunaRepository.find({
        where: {
          datoVacunacion: { notificacion: { id: uuidNotificacion } },
          rolVacuna: IsNull(),
          numeroLote: IsNull(),
          codigoAtc: IsNull(),
          indicacionMeddra: IsNull(),
        },
      }) ?? [];
    } catch (error) {
      console.error('Error al buscar DatoVacuna por ID de Notificacion:', error);
      return [];
    }
  }

  /** Crea un DatoVacuna a partir de una Notificacion (busca/crea el DatoVacunacion intermedio). */
  async createByNotificacion(
    notificacion: Notificacion,
    createDto: CreateDatoVacunaDto | CreateDatoVacunaDto[],
  ): Promise<DatoVacuna | DatoVacuna[]> {
    let datoVacunacion = await this.datoVacunacionRepository.findOne({
      where: { notificacion: { id: notificacion.id } },
    });
    if (!datoVacunacion) {
      datoVacunacion = this.datoVacunacionRepository.create({
        notificacion,
        createdBy: process.env.USUARIO_INSERTA_REGISTRO,
      });
      datoVacunacion = await this.datoVacunacionRepository.save(datoVacunacion);
    }
    return this.create(datoVacunacion, createDto);
  }

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  async delete(uuid: string): Promise<DatoVacuna> {
    return Promise.resolve(undefined);
  }

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  async findAll(): Promise<DatoVacuna[]> {
    return this.datoVacunaRepository.find({
      where: {
        isActive: true,
      },
    });
  }

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  async findOne(uuid: string): Promise<DatoVacuna> {
    const datoVacuna = await this.datoVacunaRepository.findOne({
      /*where: {
        isActive: true,
        id: uuid,
        nombreVacuna: null,
        nombreVacPatenteWHODrug: null,
        numeroLote: null,
        codigoAtc: null,
        indicacionMeddra: null,
      },*/
      where: { 
        isActive: true, 
        id: uuid, 
        numeroLote: IsNull(), 
        codigoAtc: IsNull(), 
        indicacionMeddra: IsNull(), 
      },
    });
    if (datoVacuna) {
      return datoVacuna;
    }
    throw new EntityNotFoundException('DatoVacuna', uuid);
  }

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  async update(uuid: string, vacunaDto: UpdateDatoVacunaDto): Promise<DatoVacuna> {
    const datoVacuna = await this.findOne(uuid);
    const { rolVacuna, nombreVacPatenteWHODrug, ...otherFields } = vacunaDto;
    
    if (rolVacuna) {
      datoVacuna.rolVacuna = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(CODIGO_PADRE_ROL_VACUNA, rolVacuna);
    }
    Object.assign(datoVacuna, otherFields);
    const savedDatoVacuna = await this.datoVacunaRepository.save(datoVacuna);
    return savedDatoVacuna;
  }
}
