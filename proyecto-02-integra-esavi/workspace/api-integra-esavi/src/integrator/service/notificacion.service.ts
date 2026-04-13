import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { Repository } from 'typeorm';
import { CreateNotificacionDto } from '../dto/create-notificacion.dto';
import { Notificacion } from '../entity/notificacion.entity';
import { Paciente } from '../entity/paciente.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';
import { AntecedenteEmbarazoService } from './antecedente-embarazo.service';
import { AntecedenteEventoService } from './antecedente-evento.service';
import { AntecedenteMedicoService } from './antecedente-medico.service';
import { AntecedentePreexistenciaService } from './antecedente-preexistencia.service';
import { MedicamentoService } from './medicamento.service';

@Injectable()
export class NotificacionService {
  private readonly logger = new Logger(NotificacionService.name);

  constructor(
    @InjectRepository(Notificacion, 'POSTGRES_INTEGRATOR_DS')
    private readonly notificacionRepository: Repository<Notificacion>,
    private readonly medicamentoService: MedicamentoService,
    private readonly antecedenteMedicoService: AntecedenteMedicoService,
    @Inject(forwardRef(() => AntecedenteEmbarazoService))
    private readonly antecedenteEmbarazoService: AntecedenteEmbarazoService,
    private readonly antecedenteEventoService: AntecedenteEventoService,
    private readonly antecedentePreexistenciaService: AntecedentePreexistenciaService,
  ) {}

  async create(createDto: CreateNotificacionDto, paciente: Paciente): Promise<Notificacion> {
    const notificacion = plainToClass(Notificacion, createDto);
    notificacion.paciente = paciente;
    this.logger.log(`Notification has been created: ${JSON.stringify(createDto)}`);
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

  async findMedicinaByUUIDBelongingToNotificacion(uuidNotificacion: string, uuidMedicina: string) {
    return this.medicamentoService.findOneBelongingToNotificacion(uuidNotificacion, uuidMedicina);
  }

  async findAntecedenteEmbarazoByNotificacionUUID(uuidNotificacion: string) {
    return this.antecedenteMedicoService.findAntecedenteMedicoByNotificacionUUID(uuidNotificacion);
  }

  async findAntecedenteMedicoByNotificacionUUID(uuidNotificacion: string) {
    return this.antecedenteEmbarazoService.findAntecedenteEmbarazoByNotificacionUUID(
      uuidNotificacion,
    );
  }

  async findAntecedenteEventoByNotificacionUUID(uuidNotificacion: string) {
    return this.antecedenteEventoService.findAntecedenteEventoByNotificacionUUID(uuidNotificacion);
  }

  async findAntecedentePreexistenciaByNotificacionUUID(uuidNotificacion: string) {
    return this.antecedentePreexistenciaService.findAntecedentePreexistenciaByNotificacionUUID(
      uuidNotificacion,
    );
  }

  /**
   *
   * @param params
   * @returns
   */
  async findAllPaginated(params: GetListParams) {
    const page = params.pagination.page ? parseInt(params.pagination.page as any, 10) : 1;
    const limit = params.pagination.perPage ? parseInt(params.pagination.perPage as any, 10) : 10;
    const skip = (page - 1) * limit;

    const query = this.notificacionRepository.createQueryBuilder('notificacion');

    // Selección de campos específicos si se solicita
    if (params.meta && Array.isArray(params.meta) && params.meta.length > 0) {
      const selectFields = params.meta?.fields?.map((field) => `notificacion.${field}`);
      query.select(selectFields);
    }

    // Aplicar filtros dinámicos
    if (params.filter && typeof params.filter === 'object') {
      Object.entries(params.filter).forEach(([key, value]) => {
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
    if (params.sort && Array.isArray(params.sort) && params.sort.length > 0) {
      params.sort.forEach((sorter, idx) => {
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
