import {Injectable,Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {plainToClass} from 'class-transformer';
import {In,IsNull,Repository} from 'typeorm';
import {CreateDatoVacunaDto,UpdateDatoVacunaDto} from '../dto';
import {DatoVacuna} from '../entity/dato-vacuna.entity';
import {Notificacion} from '../entity/notificacion.entity';
import {EntityNotFoundException} from '../exception/enntity-not-found.exception';
import {CatalogoService} from './catalogo.service';

@Injectable()
export class DatoVacunaService {
  private readonly logger = new Logger(DatoVacunaService.name);

  private datoVacunaMinimoCache: Map<string, DatoVacuna[]> | null = null;
  private datoVacunaCompletoCache: Map<string, Map<string, DatoVacuna>> | null = null;

  constructor(
    @InjectRepository(DatoVacuna, 'POSTGRES_INTEGRATOR_DS')
    private readonly datoVacunaRepository: Repository<DatoVacuna>,
    private readonly catalogoService: CatalogoService,
  ) {}

  async preloadByNotificacionIds(notificacionIds: string[]): Promise<void> {
    if (!notificacionIds.length) {
      this.datoVacunaMinimoCache = new Map();
      this.datoVacunaCompletoCache = new Map();
      return;
    }
    const all = await this.datoVacunaRepository.find({
      where: { notificacion: { id: In(notificacionIds) } },
      relations: ['notificacion', 'rolVacuna'],
    });
    this.datoVacunaMinimoCache = new Map();
    this.datoVacunaCompletoCache = new Map();
    for (const dv of all) {
      const nid = dv.notificacion?.id;
      if (!nid) continue;
      if (!dv.codigoAtc && !dv.rolVacuna && !dv.numeroLote && !dv.indicacionMeddra) {
        if (!this.datoVacunaMinimoCache.has(nid)) this.datoVacunaMinimoCache.set(nid, []);
        this.datoVacunaMinimoCache.get(nid).push(dv);
      } else if (dv.codigoAtc) {
        if (!this.datoVacunaCompletoCache.has(nid)) this.datoVacunaCompletoCache.set(nid, new Map());
        this.datoVacunaCompletoCache.get(nid).set(dv.codigoAtc, dv);
      }
    }
    this.logger.log(`DatoVacuna precargados: ${all.length} registros`);
  }

  invalidateMinimoEntry(notificacionId: string, datoVacunaId: string): void {
    if (!this.datoVacunaMinimoCache) return;
    const list = this.datoVacunaMinimoCache.get(notificacionId);
    if (!list) return;
    const filtered = list.filter(dv => dv.id !== datoVacunaId);
    if (filtered.length) this.datoVacunaMinimoCache.set(notificacionId, filtered);
    else this.datoVacunaMinimoCache.delete(notificacionId);
  }

  clearDatoVacunaCache(): void {
    this.datoVacunaMinimoCache = null;
    this.datoVacunaCompletoCache = null;
  }

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  async createVigiflow(
    notificacion: Notificacion,
    createDto: CreateDatoVacunaDto, // Ahora solo aceptamos un único objeto
  ): Promise<DatoVacuna> {
    // Retornamos un solo objeto
    try {
      // 1. Buscar si ya existe un DatoVacuna con los mismos valores (nombreVacuna, codigoAtc, numeroLote, notificacion)
      const existingDatoVacuna = await this.datoVacunaRepository.findOne({
        where: {
          codigoAtc: createDto.codigoAtc,
          numeroLote: createDto.numeroLote,
          notificacion: notificacion, // Asociamos la notificación al buscar
        },
      });

      if (existingDatoVacuna) {
        // Si existe, actualizamos los campos necesarios
        const { rolVacuna, ...otherFields } = createDto;
        
        if (rolVacuna) {
          existingDatoVacuna.rolVacuna = await this.catalogoService.findByDescriptionToVigiflow(rolVacuna);
        } //para no implementar más control de flujo en el servicio, se reutiliza el método de VigiFlow también para DHIS2.
        
        Object.assign(existingDatoVacuna, otherFields);
        return this.datoVacunaRepository.save(existingDatoVacuna);
      } else {
        // Si no existe, creamos un nuevo DatoVacuna
        const nuevoDatoVacuna = plainToClass(DatoVacuna, createDto);
        if (createDto.rolVacuna) {
          nuevoDatoVacuna.rolVacuna = await this.catalogoService.findByDescriptionToVigiflow(createDto.rolVacuna);
        }
        nuevoDatoVacuna.notificacion = notificacion; // Asociamos la notificación
        return this.datoVacunaRepository.save(nuevoDatoVacuna); // Guardamos el nuevo registro
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
   * @param notificacion
   * @param createDto
   * @returns
   */
  async create(
    notificacion: Notificacion,
    createDto: CreateDatoVacunaDto | CreateDatoVacunaDto[], // Puede ser un objeto o un arreglo de objetos
  ): Promise<DatoVacuna | DatoVacuna[]> {
    // Aseguramos que createDto sea siempre un arreglo, incluso si es un solo objeto
    const createDtos = Array.isArray(createDto) ? createDto : [createDto];

    try {
      const datoVacunaArray: DatoVacuna[] = [];

      // Procesar cada objeto en el arreglo (o el único objeto si es un solo elemento)
      for (const dto of createDtos) {
        const datoVacuna = plainToClass(DatoVacuna, {
          createdBy: process.env.USUARIO_INSERTA_REGISTRO,
          ...dto,
        });
        if (dto.rolVacuna) {
          datoVacuna.rolVacuna = await this.catalogoService.findByDescriptionToVigiflow(dto.rolVacuna);
        }
        datoVacuna.notificacion = notificacion;

        // Búsqueda del registro existente:
        // - Con codigoAtc: buscar por notificación + codigoAtc específico.
        // - Sin codigoAtc (registro mínimo del AEFI): buscar cualquier DatoVacuna
        //   de la notificación para evitar duplicados en segunda carga.
        let existingDatoVacuna: DatoVacuna | null;
        if (dto.codigoAtc) {
          existingDatoVacuna = this.datoVacunaCompletoCache !== null
            ? (this.datoVacunaCompletoCache.get(notificacion.id)?.get(dto.codigoAtc) ?? null)
            : await this.datoVacunaRepository.findOne({
                where: { notificacion: { id: notificacion.id }, codigoAtc: dto.codigoAtc },
              });
        } else {
          existingDatoVacuna = this.datoVacunaMinimoCache !== null
            ? (this.datoVacunaMinimoCache.get(notificacion.id)?.[0] ?? null)
            : await this.datoVacunaRepository.findOne({
                where: { notificacion: { id: notificacion.id } },
              });
        }

        if (existingDatoVacuna) {
          if (dto.codigoAtc) {
            // Actualización completa cuando viene con codigoAtc
            const { rolVacuna, ...otherFields } = dto;
            if (rolVacuna) {
              existingDatoVacuna.rolVacuna = await this.catalogoService.findByDescriptionToVigiflow(rolVacuna);
            }
            Object.assign(existingDatoVacuna, otherFields);
          } else {
            // Registro mínimo (AEFI): solo actualizar numeroDosisVacuna
            if (dto.numeroDosisVacuna != null) {
              existingDatoVacuna.numeroDosisVacuna = dto.numeroDosisVacuna;
            }
          }
          await this.datoVacunaRepository.save(existingDatoVacuna);
          datoVacunaArray.push(existingDatoVacuna);
        } else {
          // Si no existe ningún registro, crear uno nuevo
          await this.datoVacunaRepository.save(datoVacuna);
          datoVacunaArray.push(datoVacuna);
        }
      }

      // Retornamos un solo objeto o un arreglo según el caso
      return createDtos.length === 1 ? datoVacunaArray[0] : datoVacunaArray;
    } catch (e) {
      // En caso de error, mostramos un mensaje claro
      this.logger.error(`Error al procesar datos vacuna: ${e.message}`);
      throw new Error('Hubo un problema al crear o actualizar los datos de vacuna');
    } finally {
      // Registro de la operación
      // this.logger.log(`DatoVacuna(s) procesado(s): ${JSON.stringify(createDtos)}`); // Muy útil en ambiente de desarrollo, pero puede ser demasiado verboso en producción, considerar ajustar el nivel de log o el contenido registrado.
      this.logger.log(`Registro de DatoVacuna ha sido procesado`);
    }
  }

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  async findByNotificacionId(notificacionId: string): Promise<DatoVacuna[]> {
    return this.datoVacunaRepository.find({
      where: { notificacion: { id: notificacionId } },
      relations: ['rolVacuna'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByNotifIdDtoMinimo(uuidNotificacion: string): Promise<DatoVacuna[]> {
    if (this.datoVacunaMinimoCache !== null) {
      return this.datoVacunaMinimoCache.get(uuidNotificacion) ?? [];
    }
    try {
      return await this.datoVacunaRepository.find({
        where: {
          notificacion: { id: uuidNotificacion },
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
      datoVacuna.rolVacuna = await this.catalogoService.findByDescriptionToVigiflow(rolVacuna);
    }
    Object.assign(datoVacuna, otherFields);
    const savedDatoVacuna = await this.datoVacunaRepository.save(datoVacuna);
    return savedDatoVacuna;
  }
}
