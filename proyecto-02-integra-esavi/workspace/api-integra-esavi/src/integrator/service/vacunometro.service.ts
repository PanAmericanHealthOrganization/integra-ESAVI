import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { withAuditOnCreate } from 'src/common/utils/audit.util';
import { Auditoria } from 'src/integrator/entity/auditoria.entity';
import { Identificator, IGetManyParams, IService } from 'src/utils/IController';
import { GetListParams, IPaginationResponse } from 'src/utils/interfaces/pagination';
import { Between, In, Repository } from 'typeorm';
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
  public async getOne(id: Identificator): Promise<VacunometroDto> {
    console.log('ID EN SERVICIO VACUNOMETRO:', id);
    return await this.vacunometroRepository.findOne({ where: { id: id as string } });
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
   * Optimized paginated query using QueryBuilder for better performance
   * @param paginated
   * @returns
   */
  public async getPaginated(paginated: GetListParams): Promise<IPaginationResponse<Vacunometro>> {
    const { pagination, sort, filter } = paginated;
    const { page, perPage } = pagination;
    const sortOrder = sort?.order === 'ASC' ? 'ASC' : 'DESC';
    const sortField = sort?.field || 'createdAt';

    // Validar campo de ordenamiento
    const validSortFields = [
      'id',
      'unicodigo',
      'nombreVacuna',
      'fechaAplicacion',
      'total',
      'totalHombres',
      'totalMujeres',
      'createdAt',
      'updatedAt',
      'enabled',
      'state',
    ];
    const finalSortField = validSortFields.includes(sortField) ? sortField : 'createdAt';

    // Usar QueryBuilder para mejor performance
    const queryBuilder = this.vacunometroRepository.createQueryBuilder('v');

    // Aplicar filtros de manera eficiente
    if (filter?.unicodigo && typeof filter.unicodigo === 'string') {
      queryBuilder.andWhere('v.unicodigo ILIKE :unicodigo', { unicodigo: `%${filter.unicodigo}%` });
    }

    if (filter?.nombreVacuna && typeof filter.nombreVacuna === 'string') {
      queryBuilder.andWhere('v.nombreVacuna ILIKE :nombreVacuna', { nombreVacuna: `%${filter.nombreVacuna}%` });
    }

    if (filter?.fechaAplicacion && typeof filter.fechaAplicacion === 'string') {
      const fechaInput = filter.fechaAplicacion.trim();

      try {
        if (/^\d{4}$/.test(fechaInput)) {
          // Solo año: 2021
          const year = parseInt(fechaInput);
          queryBuilder.andWhere('EXTRACT(YEAR FROM v.fechaAplicacion) = :year', { year });
        } else if (/^\d{4}-\d{2}$/.test(fechaInput)) {
          // Año y mes: 2021-01
          const [year, month] = fechaInput.split('-').map(Number);
          queryBuilder.andWhere('EXTRACT(YEAR FROM v.fechaAplicacion) = :year', { year });
          queryBuilder.andWhere('EXTRACT(MONTH FROM v.fechaAplicacion) = :month', { month });
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(fechaInput)) {
          // Fecha completa: 2021-01-15 (usar rango para aprovechar índice)
          const fecha = new Date(fechaInput);
          if (!isNaN(fecha.getTime())) {
            const nextDay = new Date(fecha);
            nextDay.setDate(nextDay.getDate() + 1);
            queryBuilder.andWhere('v.fechaAplicacion >= :fechaInicio AND v.fechaAplicacion < :fechaFin', {
              fechaInicio: fecha.toISOString(),
              fechaFin: nextDay.toISOString(),
            });
          }
        }
      } catch (error) {
        this.logger.warn(`Error al procesar filtro de fecha: ${fechaInput}`, error);
      }
    }

    // Ejecutar conteo y consulta en paralelo para mejor performance
    const dataQuery = queryBuilder
      .clone()
      .orderBy(`v.${finalSortField}`, sortOrder)
      .skip((page - 1) * perPage)
      .take(perPage);

    const [data, total] = await Promise.all([dataQuery.getMany(), queryBuilder.getCount()]);

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
          grupoEtario: v.GRUPO_ETARIO,
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
        result.push(this.vacunometroRepository.insert(chunk));
        this.logger.log(`Insertados registros ${i + 1} a ${i + chunk.length} de ${vacunometros.length}`);
      }
      Promise.all(result);

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
