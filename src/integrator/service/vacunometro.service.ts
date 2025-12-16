import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { withAuditOnCreate } from 'src/common/utils/audit.util';
import { Auditoria } from 'src/integrator/entity/auditoria.entity';
import { Identificator, IGetManyParams, IService } from 'src/utils/IController';
import { GetListParams, IPaginationResponse } from 'src/utils/interfaces/pagination';
import { Between, ILike, In, Raw, Repository } from 'typeorm';
import { Vacunometro, VacunometroCreateDto, VacunometroDto, VacunometroUpdateDto } from '../entity/vacunometro.entity';
import { getCreateAuditDto } from './utils';

@Injectable()
export class VacunometroService implements IService<VacunometroCreateDto, VacunometroDto, VacunometroUpdateDto> {
  /**
   * Logger  of vacunometro service
   */
  private readonly logger = new Logger(VacunometroService.name);

  /**
   *
   * @param vacunometroRepository
   */
  constructor(
    @InjectRepository(Vacunometro, 'POSTGRES_INTEGRATOR_DS')
    private readonly vacunometroRepository: Repository<Vacunometro>,
    private readonly configService: ConfigService,
  ) {}

  /**
   *
   * @param id
   * @returns
   */
  exist(id: number | string): Promise<boolean> {
    return this.vacunometroRepository.exist({ where: { id: id as string } });
  }

  /**
   *
   * @param id
   * @returns
   */
  public getOne(id: Identificator): Promise<VacunometroDto> {
    return this.vacunometroRepository.findOne({ where: { id: id as string } });
  }

  /**
   *
   * @param params
   * @returns
   */
  public getMany(params: IGetManyParams): Promise<Vacunometro[]> {
    return this.vacunometroRepository.find({
      where: { id: In(params.ids as string[]) },
    });
  }

  /**
   *
   * @param paginated
   * @returns
   */
  public async getPaginated(paginated: GetListParams): Promise<IPaginationResponse<Vacunometro>> {
    const { pagination, sort, filter } = paginated;

    let buildFilter = {};

    // Filtros seguros solo para campos de texto
    if (filter?.unicode && typeof filter.unicode === 'string') {
      buildFilter = { ...buildFilter, unicode: ILike(`%${filter.unicode}%`) };
    }
    if (filter?.nombreVacuna && typeof filter.nombreVacuna === 'string') {
      buildFilter = { ...buildFilter, nombreVacuna: ILike(`%${filter.nombreVacuna}%`) };
    }
    if (filter?.sexo && typeof filter.sexo === 'string') {
      buildFilter = { ...buildFilter, sexo: ILike(`%${filter.sexo}%`) };
    }
    if (filter?.fechaAplicacion && typeof filter.fechaAplicacion === 'string') {
      const fechaInput = filter.fechaAplicacion.trim();

      try {
        // Determinar el tipo de búsqueda basado en el formato del input
        if (/^\d{4}$/.test(fechaInput)) {
          // Solo año: 2021
          const year = parseInt(fechaInput);
          buildFilter = {
            ...buildFilter,
            fechaAplicacion: Raw((alias) => `EXTRACT(YEAR FROM ${alias}) = :year`, {
              year: year,
            }),
          };
        } else if (/^\d{4}-\d{2}$/.test(fechaInput)) {
          // Año y mes: 2021-01
          const [year, month] = fechaInput.split('-').map(Number);
          buildFilter = {
            ...buildFilter,
            fechaAplicacion: Raw(
              (alias) => `EXTRACT(YEAR FROM ${alias}) = :year AND EXTRACT(MONTH FROM ${alias}) = :month`,
              {
                year: year,
                month: month,
              },
            ),
          };
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(fechaInput)) {
          // Fecha completa: 2021-01-15
          const fecha = new Date(fechaInput);
          if (!isNaN(fecha.getTime())) {
            buildFilter = {
              ...buildFilter,
              fechaAplicacion: Raw((alias) => `DATE(${alias}) = :date`, {
                date: fechaInput, // Ya está en formato YYYY-MM-DD
              }),
            };
          }
        } else {
          // Intento de parseo flexible para otros formatos
          const fecha = new Date(fechaInput);
          if (!isNaN(fecha.getTime())) {
            buildFilter = {
              ...buildFilter,
              fechaAplicacion: Raw((alias) => `DATE(${alias}) = :date`, {
                date: fecha.toISOString().split('T')[0],
              }),
            };
          } else {
            console.warn('Formato de fecha no reconocido:', fechaInput);
          }
        }
      } catch (error) {
        console.warn('Error al procesar filtro de fecha:', fechaInput, error);
      }
    }

    const { page, perPage } = pagination;
    const sortOrder = sort?.order === 'ASC' ? 'ASC' : 'DESC';
    const sortField = sort?.field || 'createdAt';

    // Validar que el campo de ordenamiento existe en la entidad
    const validSortFields = [
      'id',
      'unicode',
      'nombreVacuna',
      'dosisAplicada',
      'diaAplicacion',
      'mesAplicacion',
      'anioAplicacion',
      'fechaAplicacion',
      'sexo',
      'total',
      'createdAt',
      'updatedAt',
      'enabled',
      'state',
    ];

    const finalSortField = validSortFields.includes(sortField) ? sortField : 'createdAt';
    const csort = {};
    csort[finalSortField] = sortOrder;

    const [data, total] = await this.vacunometroRepository.findAndCount({
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
  public async findAll(): Promise<Vacunometro[]> {
    return this.vacunometroRepository.find();
  }

  /**
   *
   * @returns
   */
  public async create(vacunometroCreateDto: VacunometroCreateDto): Promise<VacunometroDto> {
    return this.vacunometroRepository.save(withAuditOnCreate(vacunometroCreateDto));
  }

  /**
   *
   * @returns
   */
  public async update(id: Identificator, vacunometro: Vacunometro): Promise<VacunometroDto> {
    const exist = await this.getOne(id);
    if (!exist) {
      throw new Error(`El registro con id ${id} no existe.`);
    }
    await this.vacunometroRepository.update(id, vacunometro);
    return this.getOne(id);
  }

  /**
   *
   * @returns
   */
  public async delete(id: Identificator, auditoria: Auditoria): Promise<VacunometroDto> {
    await this.vacunometroRepository.update(id, {
      isActive: false,
      isEnabled: false,
      ...auditoria,
    });
    return this.vacunometroRepository.findOne({ where: { id: id as string } });
  }

  /**
   *
   * @param vacunometro
   * @returns
   */
  public async createMany(vacunometro: any[]): Promise<Vacunometro[]> {
    try {
      const vacunometros: Vacunometro[] = vacunometro.map((v) => {
        return {
          unicodigo: v.UNICODIGO,
          nombreVacuna: v.NOMBRE_VACUNA,
          fechaAplicacion: new Date(v.FECHA_APLICACION),
          totalHombres: v.TOTAL_HOMBRES,
          totalMujeres: v.TOTAL_MUJERES,
          total: v.TOTAL_REGISTROS,
          ...getCreateAuditDto(),
        } as Vacunometro;
      });

      // Eliminar registros existentes en el rango de fechas para evitar duplicados
      await this.eliminarRegistros(vacunometros);

      const CHUNK_SIZE = 1000;
      const result = [];
      for (let i = 0; i < vacunometros.length; i += CHUNK_SIZE) {
        const chunk = vacunometros.slice(i, i + CHUNK_SIZE);
        result.push(await this.vacunometroRepository.insert(chunk));
        this.logger.log(`Insertados registros ${i + 1} a ${i + chunk.length} de ${vacunometros.length}`);
      }

      // Retornar array vacío ya que INSERT no retorna los registros creados
      // Si necesitas los registros, deberías hacer un SELECT después
      return result;
    } catch (e) {
      this.logger.error(`Error al procesar los datos de vacuna: ${e.message}`);
      throw new Error('Hubo un problema al crear o actualizar los datos de vacuna');
    }
  }

  /**
   *
   * @param desde
   * @param hasta
   */
  private async eliminarRegistros(vacunometros: Vacunometro[]): Promise<void> {
    const fechaMinima = vacunometros.reduce(
      (min, v) => (v.fechaAplicacion < min ? v.fechaAplicacion : min),
      vacunometros[0].fechaAplicacion,
    );
    const fechaMaxima = vacunometros.reduce(
      (max, v) => (v.fechaAplicacion > max ? v.fechaAplicacion : max),
      vacunometros[0].fechaAplicacion,
    );
    const deleteResult = await this.vacunometroRepository.delete({
      fechaAplicacion: Between(fechaMinima, fechaMaxima),
    });
    this.logger.log(
      `Eliminados ${deleteResult.affected} registros de vacunometro entre ${
        fechaMinima.toISOString().split('T')[0]
      } y ${fechaMaxima.toISOString().split('T')[0]}`,
    );
  }
}
