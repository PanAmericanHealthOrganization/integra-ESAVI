import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { Repository } from 'typeorm';
import { CreateNotificacionDto } from '../dto';
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

  delete(_uuid: string): Promise<Notificacion> {
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
    // La residencia va en las relaciones por defecto, no a petición del cliente: la ficha
    // del ESAVI siempre la muestra, y sin la cadena parroquia → cantón → provincia sólo
    // podría pintar la parroquia. `origenResidencia` viaja con ella porque una residencia
    // derivada del establecimiento no significa lo mismo que una declarada por el paciente,
    // y quien la lea tiene que poder distinguirlas.
    const relations: string[] = [
      'establecimiento',
      'tipoReporte',
      'tipoEmisor',
      'parroquiaResidencia',
      'parroquiaResidencia.canton',
      'parroquiaResidencia.canton.provincia',
      'origenResidencia',
    ];
    if (relation) {
      for (const r of relation.split(',')) {
        if (!relations.includes(r)) relations.push(r);
      }
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
    return this.antecedenteEmbarazoService.findAntecedenteEmbarazoByNotificacionUUID(uuidNotificacion);
  }

  async findAntecedenteMedicoByNotificacionUUID(uuidNotificacion: string) {
    return this.antecedenteMedicoService.findAntecedenteMedicoByNotificacionUUID(
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

    const query = this.notificacionRepository.createQueryBuilder('notificacion')
      .leftJoinAndSelect('notificacion.paciente', 'paciente')
      .leftJoinAndSelect('paciente.sexo', 'sexoPaciente')
      .leftJoinAndSelect('notificacion.gravedadEsavi', 'gravedad');

    // Aplicar filtros dinámicos
    if (params.filter && typeof params.filter === 'object') {
      Object.entries(params.filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'fechaDesde') {
            query.andWhere('notificacion.fechaNotificacion >= :fechaDesde', { fechaDesde: value });
          } else if (key === 'fechaHasta') {
            query.andWhere('notificacion.fechaNotificacion <= :fechaHasta', { fechaHasta: value });
          } else if (key === 'identificacion') {
            query.andWhere('UPPER(paciente.identificacion) LIKE UPPER(:identificacion)', {
              identificacion: `%${value}%`,
            });
          } else if (key === 'codigoOrigenNotificacion') {
            query.andWhere('UPPER(notificacion.codigoOrigenNotificacion) LIKE UPPER(:codigoOrigenNotificacion)', {
              codigoOrigenNotificacion: `%${value}%`,
            });
          } else if (key === 'origen') {
            query.andWhere('notificacion.origen = :origen', { origen: value });
          } else if (key === 'gravedad') {
            query.andWhere('gravedad.tipo = :gravedad', { gravedad: value });
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
