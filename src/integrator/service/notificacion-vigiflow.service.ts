import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateNotificacionDto } from '../dto/create-notificacion.dto';
import { UpdateNotificacionDto } from '../dto/update-notificacion.dto';
import { NotificacionVigiflow } from '../entity/notificacion-vigiflow.entity';
import { PacienteVigiflow } from '../entity/paciente-vigiflow.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';
import { CatalogoService } from './catalogo.service';
import { GrupoEtarioService } from './grupo-etario.service';
import { PacienteVigiflowService } from './paciente-vigiflow.service';

@Injectable()
export class NotificacionVigiflowService {
  private readonly logger = new Logger(NotificacionVigiflowService.name);

  constructor(
    @InjectRepository(NotificacionVigiflow, 'POSTGRES_INTEGRATOR_DS')
    private readonly notificacionRepository: Repository<NotificacionVigiflow>,
    private readonly pacienteService: PacienteVigiflowService,
    private readonly catalogoService: CatalogoService,
    private readonly grupoEtarioService: GrupoEtarioService,
  ) {}

  async create(
    createDto: CreateNotificacionDto,
    pacienteUUID: PacienteVigiflow,
  ): Promise<NotificacionVigiflow> {
    console.log('DatosVerificarNotificacion', createDto);
    console.log('DatosVerificarNotificacionPaciente', pacienteUUID);

    if (pacienteUUID) {
      const notificacion = await this.findByVigiflowCode(
        createDto.codigoVigiflow,
      );
      if (notificacion) {
        return notificacion;
      } else {
        const notificacion = plainToClass(NotificacionVigiflow, createDto);
        notificacion.paciente = pacienteUUID;
        console.log(notificacion);
        if (!this.isNullOrUndefinedOrEmpty(createDto.residencia.provincia)) {
          try {
            notificacion.provinciaResidencia =
              await this.catalogoService.findByDescriptionToVigiflow(
                createDto.residencia.provincia,
              );
          } catch (error) {
            console.log('Provincia no encontrada');
          }
        }
        if (!this.isNullOrUndefinedOrEmpty(createDto.residencia.canton)) {
          try {
            notificacion.cantonResidencia =
              await this.catalogoService.findByDescriptionToVigiflow(
                createDto.residencia.canton,
              );
          } catch (error) {
            console.log('Canton no encontrada');
          }
        }
        if (!this.isNullOrUndefinedOrEmpty(createDto.residencia.parroquia)) {
          try {
            notificacion.parroquiaResidencia =
              await this.catalogoService.findByDescriptionToVigiflow(
                createDto.residencia.parroquia,
              );
          } catch (error) {
            console.log('Parroquia no encontrada');
          }
        }
        if (
          !this.isNullOrUndefinedOrEmpty(
            createDto.residenciaNotificador.provincia,
          )
        ) {
          try {
            notificacion.provinciaNotificador =
              await this.catalogoService.findByDescriptionToVigiflow(
                createDto.residenciaNotificador.provincia,
              );
          } catch (error) {
            console.log('Provincia notificador no encontrada');
          }
        }
        if (
          !this.isNullOrUndefinedOrEmpty(createDto.residenciaNotificador.canton)
        ) {
          try {
            notificacion.cantonNotificador =
              await this.catalogoService.findByDescriptionToVigiflow(
                createDto.residenciaNotificador.canton,
              );
          } catch (error) {
            console.log('Canton notificador no encontrado');
          }
        }
        if (
          !this.isNullOrUndefinedOrEmpty(
            createDto.residenciaNotificador.parroquia,
          )
        ) {
          try {
            notificacion.parroquiaNotificador =
              await this.catalogoService.findByDescriptionToVigiflow(
                createDto.residenciaNotificador.parroquia,
              );
          } catch (error) {
            console.log('Parroquia notificador no encontrado');
          }
        }

        if (!this.isNullOrUndefinedOrEmpty(createDto.unidadEdadPaciente)) {
          try {
            notificacion.unidadEdad =
              await this.catalogoService.findByDescriptionToVigiflow(
                createDto.unidadEdadPaciente,
              );
          } catch (error) {
            console.log('Unidad Edad paciente no encontrada');
          }
        }
        if (!this.isNullOrUndefinedOrEmpty(createDto.grupoEtarioPaciente)) {
          console.log('EsteGrupoEtario:::', createDto.grupoEtarioPaciente);

          try {
            notificacion.grupoEtario = await this.grupoEtarioService.findOne(
              createDto.grupoEtarioPaciente,
            );
          } catch (error) {
            console.log('Grupo etario no encontrado');
          }
        }
        //Grupo etario
        // if (createDto.edad) {
        //   try {
        //     const grupoEtarioPaciente = await this.grupoEtarioService.findGrupoEtarioByAge(createDto.edad);
        //     notificacion.grupoEtario = grupoEtarioPaciente;
        //   } catch (error) {
        //     console.error(`Error al buscar grupo etario para la edad ${createDto.edad}: ${error.message}`);
        //   }
        // }

        if (createDto.edad && createDto.unidadEdadPaciente) {
          try {
            // Aseguramos que la unidad de edad esté en mayúsculas
            let unidadEdad = createDto.unidadEdadPaciente.toUpperCase();
            let edadFinal = createDto.edad;

            // Si la unidad no es "AÑO" o "AÑOS", realizar la conversión
            if (unidadEdad !== 'AÑO' && unidadEdad !== 'AÑOS') {
              if (unidadEdad === 'DÉCADA') {
                // Si la unidad es "DÉCADA", multiplicamos por 10 para obtener la edad real en años
                edadFinal = ~~(createDto.edad * 10);
              } else if (unidadEdad === 'SEMANA') {
                // Convertimos semanas a años (1 semana = 1/52 años)
                edadFinal = ~~(createDto.edad / 52);
              } else if (unidadEdad === 'DÍA' || unidadEdad === 'DÍAS') {
                // Convertimos días a años (1 día = 1/365 años)
                edadFinal = ~~(createDto.edad / 365);
              } else if (unidadEdad === 'HORA') {
                // Convertimos horas a años (1 hora = 1/8760 años)
                edadFinal = ~~(createDto.edad / 8760);
              } else if (unidadEdad === 'MES' || unidadEdad === 'MESES') {
                // Convertimos meses a años (1 mes = 1/12 años)
                edadFinal = ~~(createDto.edad / 12);
              }
            }

            // Ahora que tenemos la edadFinal calculada, buscamos el grupo etario
            const grupoEtarioPaciente =
              await this.grupoEtarioService.findGrupoEtarioByAge(edadFinal);
            notificacion.grupoEtario = grupoEtarioPaciente;
          } catch (error) {
            console.error(
              `Error al calcular grupo etario para la edad ${createDto.edad} ${createDto.unidadEdadPaciente}: ${error.message}`,
            );
          }
        }

        notificacion.createdBy = process.env.USUARIO_INSERTA_REGISTRO;
        const not = await this.notificacionRepository.save(notificacion);
        this.logger.log(
          `NotificationVigiflow has been created: ${JSON.stringify(not)}`,
        );
        return not;
      }
    } else {
      throw new Error(
        'pacienteUUID is a mandatory field to notification-vigiflow',
      );
    }
  }

  async update(
    notificacion: NotificacionVigiflow,
    updateNotificacion: UpdateNotificacionDto,
  ) {
    try {
      if (updateNotificacion.profesionNotificadorParam) {
        try {
          const profesionNotificador =
            await this.catalogoService.findByDescriptionToVigiflow(
              updateNotificacion.profesionNotificadorParam,
            );
          notificacion.profesionNotificador = profesionNotificador;
        } catch (error) {
          console.log('Profesion no encontrada');
        }
      }

      notificacion.casoNarrativo = updateNotificacion.casoNarrativo;
      notificacion.comentario = updateNotificacion.comentario;
      notificacion.tipoReporte = updateNotificacion.tipoReporte;
      notificacion.identificacionNotificador =
        updateNotificacion.identificacionNotificador;
      notificacion.delegadoOrganizacion =
        updateNotificacion.delegadoOrganizacion;
      notificacion.ultimaEdicionRegistrada =
        updateNotificacion.ultimaEdicionRegistrada;
      notificacion.lactando = updateNotificacion.lactando;
      notificacion.fechaNotificacion = updateNotificacion.fechaNotificacion;

      await this.notificacionRepository.update(notificacion.id, notificacion);
    } catch (error) {
      console.error('Error al actualizar el paciente:', error);
      throw error;
    }
  }

  delete(uuid: string): Promise<NotificacionVigiflow> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<NotificacionVigiflow[]> {
    return this.notificacionRepository.find();
  }

  findByPacienteUUID(uuidPaciente: string) {
    return this.notificacionRepository.find({
      where: {
        paciente: {
          id: uuidPaciente,
        },
      },
    });
  }

  async findOne(uuid: string): Promise<NotificacionVigiflow> {
    const notificacion = await this.notificacionRepository.findOne({
      where: { id: uuid },
    });
    if (notificacion) {
      return notificacion;
    }
    throw new EntityNotFoundException('NotificacionVigiflow', uuid);
  }

  private isNullOrUndefinedOrEmpty(field: string): boolean {
    return typeof field === 'undefined' || field === null || field.length === 0;
  }

  async findByVigiflowCode(code: string) {
    const notificacion = await this.notificacionRepository.findOne({
      where: {
        codigoVigiflow: code,
      },
    });
    if (notificacion) {
      return notificacion;
    }
    return null;
  }
}
