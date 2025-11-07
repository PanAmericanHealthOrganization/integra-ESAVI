import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Identificator, IGetManyParams, IService } from 'src/utils/IController';
import { IBaseEntity } from 'src/utils/interfaces/baseEntity';
import { GetListParams, IPaginationResponse } from 'src/utils/interfaces/pagination';
import { Between, ILike, In, Raw, Repository } from 'typeorm';
import { CreateGacetaDto } from '../dto/create-gaceta.dto';
import { GacetaDto } from '../dto/gaceta.dto';
import { UpdateGacetaDto } from '../dto/update-gaceta.dto';
import { Gaceta } from '../entity/gaceta.entity';
import { ESTADO_GACETA } from '../entity/interfaces/gaceta.interface';

@Injectable()
export class GacetaService implements IService<CreateGacetaDto, GacetaDto, UpdateGacetaDto> {
  /**
   * Logger of gaceta service
   */
  private readonly logger = new Logger(GacetaService.name);

  /**
   *
   * @param gacetaRepository
   */
  constructor(
    @InjectRepository(Gaceta, 'POSTGRES_INTEGRATOR_DS')
    private readonly gacetaRepository: Repository<Gaceta>,
  ) {}

  /**
   * Valida si un string es un UUID válido
   * @param uuid - String a validar
   * @returns true si es un UUID válido, false en caso contrario
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Valida y limpia un ID UUID
   * @param id - ID a validar
   * @returns ID limpio y validado
   * @throws BadRequestException si el UUID es inválido
   */
  private validateAndCleanId(id: Identificator): string {
    const idStr = id as string;

    if (!idStr || typeof idStr !== 'string') {
      throw new BadRequestException('ID es requerido y debe ser un string');
    }

    // Limpiar el ID removiendo espacios y caracteres no válidos
    const cleanId = idStr.trim();

    if (!this.isValidUUID(cleanId)) {
      this.logger.error(`UUID inválido recibido: ${cleanId}`);
      throw new BadRequestException(
        `ID UUID inválido: ${cleanId}. Formato esperado: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`,
      );
    }

    return cleanId;
  }

  /**
   *
   * @param id
   * @returns
   */
  exist(id: number | string): Promise<boolean> {
    const cleanId = this.validateAndCleanId(id as Identificator);
    return this.gacetaRepository.exist({ where: { id: cleanId } });
  }

  /**
   *
   * @param id
   * @returns
   */
  public getOne(id: Identificator): Promise<GacetaDto> {
    const cleanId = this.validateAndCleanId(id);
    this.logger.log(`Buscando gaceta con ID: ${cleanId}`);
    return this.gacetaRepository.findOne({ where: { id: cleanId } });
  }

  /**
   *
   * @param params
   * @returns
   */
  public getMany(params: IGetManyParams): Promise<Gaceta[]> {
    // Validar todos los IDs en el array
    const cleanIds = (params.ids as string[]).map((id) => this.validateAndCleanId(id));
    return this.gacetaRepository.find({
      where: { id: In(cleanIds) },
    });
  }

  /**
   *
   * @param paginated
   * @returns
   */
  public async getPaginated(paginated: GetListParams): Promise<IPaginationResponse<GacetaDto>> {
    const { pagination, sort, filter } = paginated;

    let buildFilter = {};

    // Filtros seguros para campos de la gaceta
    if (filter?.numeroGaceta && typeof filter.numeroGaceta === 'number') {
      buildFilter = { ...buildFilter, numeroGaceta: filter.numeroGaceta };
    }

    if (filter?.anio && typeof filter.anio === 'number') {
      buildFilter = { ...buildFilter, anio: filter.anio };
    }

    if (filter?.mes && typeof filter.mes === 'number') {
      buildFilter = { ...buildFilter, mes: filter.mes };
    }

    if (filter?.estado && typeof filter.estado === 'string') {
      buildFilter = { ...buildFilter, estado: filter.estado };
    }

    if (filter?.autor && typeof filter.autor === 'string') {
      buildFilter = { ...buildFilter, autor: ILike(`%${filter.autor}%`) };
    }

    if (filter?.autorSecundario && typeof filter.autorSecundario === 'string') {
      buildFilter = { ...buildFilter, autorSecundario: ILike(`%${filter.autorSecundario}%`) };
    }

    if (filter?.volumen && typeof filter.volumen === 'number') {
      buildFilter = { ...buildFilter, volumen: filter.volumen };
    }

    // Filtro por rango de fechas de publicación
    if (filter?.fechaPublicacionDesde || filter?.fechaPublicacionHasta) {
      const fechaDesde = filter?.fechaPublicacionDesde
        ? new Date(filter.fechaPublicacionDesde)
        : new Date('1900-01-01');
      const fechaHasta = filter?.fechaPublicacionHasta
        ? new Date(filter.fechaPublicacionHasta)
        : new Date('2100-12-31');

      buildFilter = {
        ...buildFilter,
        fechaPublicacion: Between(fechaDesde, fechaHasta),
      };
    }

    // Filtro por fecha de publicación específica
    if (filter?.fechaPublicacion && typeof filter.fechaPublicacion === 'string') {
      const fechaInput = filter.fechaPublicacion.trim();

      try {
        if (/^\d{4}$/.test(fechaInput)) {
          // Solo año: 2024
          const year = parseInt(fechaInput);
          buildFilter = {
            ...buildFilter,
            fechaPublicacion: Raw((alias) => `EXTRACT(YEAR FROM ${alias}) = :year`, {
              year: year,
            }),
          };
        } else if (/^\d{4}-\d{2}$/.test(fechaInput)) {
          // Año y mes: 2024-01
          const [year, month] = fechaInput.split('-').map(Number);
          buildFilter = {
            ...buildFilter,
            fechaPublicacion: Raw(
              (alias) =>
                `EXTRACT(YEAR FROM ${alias}) = :year AND EXTRACT(MONTH FROM ${alias}) = :month`,
              {
                year: year,
                month: month,
              },
            ),
          };
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(fechaInput)) {
          // Fecha completa: 2024-01-15
          const fecha = new Date(fechaInput);
          if (!isNaN(fecha.getTime())) {
            buildFilter = {
              ...buildFilter,
              fechaPublicacion: Raw((alias) => `DATE(${alias}) = :date`, {
                date: fechaInput,
              }),
            };
          }
        }
      } catch (error) {
        this.logger.warn('Error al procesar filtro de fecha:', fechaInput, error);
      }
    }

    const { page, perPage } = pagination;
    const sortOrder = sort?.order === 'ASC' ? 'ASC' : 'DESC';
    const sortField = sort?.field || 'fechaPublicacion';

    // Validar que el campo de ordenamiento existe en la entidad
    const validSortFields = [
      'id',
      'fechaPublicacion',
      'numeroGaceta',
      'volumen',
      'anio',
      'mes',
      'estado',
      'autor',
      'autorSecundario',
    ];

    const finalSortField = validSortFields.includes(sortField) ? sortField : 'fechaPublicacion';
    const csort = {};
    csort[finalSortField] = sortOrder;

    const [data, total] = await this.gacetaRepository.findAndCount({
      where: Object.keys(buildFilter).length > 0 ? buildFilter : {},
      skip: (page - 1) * perPage,
      take: perPage,
      order: { ...csort },
    });

    return { data, total };
  }

  /**
   *
   * @returns
   */
  public async findAll(): Promise<Gaceta[]> {
    return this.gacetaRepository.find({
      order: {
        fechaPublicacion: 'DESC',
      },
    });
  }

  /**
   *
   * @param createGacetaDto
   * @returns
   */
  public async create(createGacetaDto: CreateGacetaDto): Promise<GacetaDto> {
    try {
      // Verificar si ya existe una gaceta con el mismo número, año y mes
      const existingGaceta = await this.gacetaRepository.findOne({
        where: {
          numeroGaceta: createGacetaDto.numeroGaceta,
          anio: createGacetaDto.anio,
          mes: createGacetaDto.mes,
        },
      });

      if (existingGaceta) {
        throw new Error(
          `Ya existe una gaceta con el número ${createGacetaDto.numeroGaceta} para ${createGacetaDto.mes}/${createGacetaDto.anio}`,
        );
      }

      const gaceta = this.gacetaRepository.create(createGacetaDto);
      return await this.gacetaRepository.save(gaceta);
    } catch (error) {
      this.logger.error(`Error al crear gaceta: ${error.message}`);
      throw error;
    } finally {
      this.logger.log(`Gaceta creada: ${JSON.stringify(createGacetaDto)}`);
    }
  }

  /**
   *
   * @param id
   * @param updateGacetaDto
   * @returns
   */
  public async update(id: Identificator, updateGacetaDto: UpdateGacetaDto): Promise<GacetaDto> {
    const cleanId = this.validateAndCleanId(id);
    const exist = await this.getOne(cleanId);
    if (!exist) {
      throw new Error(`La gaceta con id ${cleanId} no existe.`);
    }

    // Si se está actualizando el número, año o mes, verificar unicidad
    if (updateGacetaDto.numeroGaceta || updateGacetaDto.anio || updateGacetaDto.mes) {
      const numeroGaceta = updateGacetaDto.numeroGaceta || exist.numeroGaceta;
      const anio = updateGacetaDto.anio || exist.anio;
      const mes = updateGacetaDto.mes || exist.mes;

      const existingGaceta = await this.gacetaRepository.findOne({
        where: {
          numeroGaceta: numeroGaceta,
          anio: anio,
          mes: mes,
        },
      });

      if (existingGaceta && existingGaceta.id !== cleanId) {
        throw new Error(`Ya existe una gaceta con el número ${numeroGaceta} para ${mes}/${anio}`);
      }
    }

    await this.gacetaRepository.update(cleanId, updateGacetaDto);
    return this.getOne(cleanId);
  }

  /**
   *
   * @param id
   * @param auditoria
   * @returns
   */
  public async delete(id: Identificator, auditoria: IBaseEntity): Promise<GacetaDto> {
    const cleanId = this.validateAndCleanId(id);
    const exist = await this.getOne(cleanId);
    if (!exist) {
      throw new Error(`La gaceta con id ${cleanId} no existe.`);
    }

    // Soft delete: marcamos como deshabilitado en lugar de eliminar físicamente
    await this.gacetaRepository.update(cleanId, {
      estado: ESTADO_GACETA.CANCELADO,
      ...auditoria,
    });

    return this.gacetaRepository.findOne({ where: { id: cleanId } });
  }

  /**
   * Buscar gacetas por año y mes
   * @param anio
   * @param mes
   * @returns
   */
  public async findByPeriodo(anio: number, mes?: number): Promise<Gaceta[]> {
    const whereCondition: any = { anio };
    if (mes) {
      whereCondition.mes = mes;
    }

    return this.gacetaRepository.find({
      where: whereCondition,
      order: {
        numeroGaceta: 'ASC',
      },
    });
  }

  /**
   * Buscar gacetas por estado
   * @param estado
   * @returns
   */
  public async findByEstado(estado: ESTADO_GACETA): Promise<Gaceta[]> {
    return this.gacetaRepository.find({
      where: { estado },
      order: {
        fechaPublicacion: 'DESC',
      },
    });
  }
}
