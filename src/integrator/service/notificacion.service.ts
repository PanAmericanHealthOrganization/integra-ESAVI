import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Notificacion } from '../entity/notificacion.entity';
import { CreateNotificacionDto } from '../dto/create-notificacion.dto';
import { Paciente } from '../entity/paciente.entity';
import { MedicamentoService } from './medicamento.service';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';
import { AntecedenteMedicoService } from './antecedente-medico.service';
import { AntecedenteEmbarazoService } from './antecedente-embarazo.service';
import { AntecedenteEventoService } from './antecedente-evento.service';
import { AntecedentePreexistenciaService } from './antecedente-preexistencia.service';

@Injectable()
export class NotificacionService {
  private readonly logger = new Logger(NotificacionService.name);

  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepository: Repository<Notificacion>,
    private readonly medicamentoService: MedicamentoService,
    private readonly antecedenteMedicoService: AntecedenteMedicoService,
    @Inject(forwardRef(() => AntecedenteEmbarazoService))
    private readonly antecedenteEmbarazoService: AntecedenteEmbarazoService,
    private readonly antecedenteEventoService: AntecedenteEventoService,
    private readonly antecedentePreexistenciaService: AntecedentePreexistenciaService,
  ) {}

  async create(
    createDto: CreateNotificacionDto,
    paciente: Paciente,
  ): Promise<Notificacion> {
    const notificacion = plainToClass(Notificacion, createDto);
    notificacion.paciente = paciente;
    this.logger.log(
      `Notification has been created: ${JSON.stringify(createDto)}`,
    );
    return this.notificacionRepository.save(notificacion);
  }

  delete(uuid: string): Promise<Notificacion> {
    return Promise.resolve(undefined);
  }

  // findAll(): Promise<Notificacion[]> {
  //   return this.notificacionRepository.find();
  // }

  findAll(): Promise<Notificacion[]> {
    return this.notificacionRepository.find({
      relations: ['paciente', 'paciente.sexo'], // Cargamos 'paciente' y su relación 'sexo'
    });
  }

  async findOne(uuid: string, relation?: string): Promise<Notificacion> {
    let relations: string[] = [];
    if (relation) {
      relations = relation.split(',');
    }
    const notificacion = await this.notificacionRepository.findOne({
      where: { id: uuid },
      relations: relations,
    });
    if (notificacion) {
      return notificacion;
    }
    throw new EntityNotFoundException(`Notificacion`, uuid);
  }

  async findMedicinaByNotificacionUUID(uuid) {
    return this.medicamentoService.findMedicinaByNotificacionUUID(uuid);
  }

  async findMedicinaByUUIDBelongingToNotificacion(
    uuidNotificacion: string,
    uuidMedicina: string,
  ) {
    return this.medicamentoService.findOneBelongingToNotificacion(
      uuidNotificacion,
      uuidMedicina,
    );
  }

  async findAntecedenteEmbarazoByNotificacionUUID(uuidNotificacion: string) {
    return this.antecedenteMedicoService.findAntecedenteMedicoByNotificacionUUID(
      uuidNotificacion,
    );
  }

  async findAntecedenteMedicoByNotificacionUUID(uuidNotificacion: string) {
    return this.antecedenteEmbarazoService.findAntecedenteEmbarazoByNotificacionUUID(
      uuidNotificacion,
    );
  }

  async findAntecedenteEventoByNotificacionUUID(uuidNotificacion: string) {
    return this.antecedenteEventoService.findAntecedenteEventoByNotificacionUUID(
      uuidNotificacion,
    );
  }

  async findAntecedentePreexistenciaByNotificacionUUID(
    uuidNotificacion: string,
  ) {
    return this.antecedentePreexistenciaService.findAntecedentePreexistenciaByNotificacionUUID(
      uuidNotificacion,
    );
  }

  /**
   * Obtiene las notificaciones de forma paginada utilizando QueryBuilder y filtros avanzados.
   * @param params Objeto con los siguientes campos:
   *  - page: número de página (opcional, por defecto 1)
   *  - rowsPerPage: cantidad de resultados por página (opcional, por defecto 10)
   *  - filters: objeto con los filtros dinámicos (opcional)
   *  - fields: array de campos a seleccionar (opcional)
   *  - sorterFields: array de objetos { field: string, order: 'ASC' | 'DESC' } para ordenamiento (opcional)
   */
  async findAllPaginated(params: {
    page?: number;
    rowsPerPage?: number;
    filters?: any;
    fields?: string[];
    sorterFields?: { field: string; order: 'ASC' | 'DESC' }[];
  }) {
    const page = params.page ? parseInt(params.page as any, 10) : 1;
    const limit = params.rowsPerPage
      ? parseInt(params.rowsPerPage as any, 10)
      : 10;
    const skip = (page - 1) * limit;

    const query =
      this.notificacionRepository.createQueryBuilder('notificacion');

    // Selección de campos específicos si se solicita
    if (
      params.fields &&
      Array.isArray(params.fields) &&
      params.fields.length > 0
    ) {
      const selectFields = params.fields.map(
        (field) => `notificacion.${field}`,
      );
      query.select(selectFields);
    }

    // Aplicar filtros dinámicos
    if (params.filters && typeof params.filters === 'object') {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Puedes personalizar aquí para filtros especiales como rangos de fechas, etc.
          if (key === 'fechaDesde') {
            query.andWhere('notificacion.fechaNotificacion >= :fechaDesde', {
              fechaDesde: value,
            });
          } else if (key === 'fechaHasta') {
            query.andWhere('notificacion.fechaNotificacion <= :fechaHasta', {
              fechaHasta: value,
            });
          } else {
            query.andWhere(`notificacion.${key} = :${key}`, { [key]: value });
          }
        }
      });
    }

    query.skip(skip).take(limit);

    // Ordenamiento avanzado
    if (
      params.sorterFields &&
      Array.isArray(params.sorterFields) &&
      params.sorterFields.length > 0
    ) {
      params.sorterFields.forEach((sorter, idx) => {
        if (idx === 0) {
          query.orderBy(`notificacion.${sorter.field}`, sorter.order);
        } else {
          query.addOrderBy(`notificacion.${sorter.field}`, sorter.order);
        }
      });
    } else {
      query.orderBy('notificacion.fechaNotificacion', 'DESC');
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
