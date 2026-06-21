import {Injectable,Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {plainToClass} from 'class-transformer';
import {Repository} from 'typeorm';
import {CreateNotificacionDto} from '../dto';
import {Notificacion} from '../entity/notificacion.entity';
import {Paciente} from '../entity/paciente.entity';
import {Parroquia} from '../entity/parroquia.entity';
import {SourceEnum} from '../enum/source-enum';
import {EntityNotFoundException} from '../exception/enntity-not-found.exception';
import {CatalogoService} from './catalogo.service';

@Injectable()
export class NotificacionDhis2Service {
  private readonly logger = new Logger(NotificacionDhis2Service.name);

  constructor(
    @InjectRepository(Notificacion, 'POSTGRES_INTEGRATOR_DS')
    private readonly notificacionRepository: Repository<Notificacion>,
    @InjectRepository(Parroquia, 'POSTGRES_INTEGRATOR_DS')
    private readonly parroquiaRepository: Repository<Parroquia>,
    private readonly catalogoService: CatalogoService,
  ) {}

  // async create(
  //   createDto: CreateNotificacionDto,
  //   pacienteUUID: Paciente,
  // ): Promise<NotificacionDhis2> {
  //   console.log("NotificacionDatos:::" , createDto);
  //   console.log("NotificacionDatosPaciente:::" , pacienteUUID);

  //   const notificacion = await this.findByCodeDhis2(createDto.codigoDhis2Evento)
  //   console.log("ExistePacienteNotificacion::" , notificacion);
  //   //TODO: Ya tengo la informacion de la notificacion si hay la actualizo
  //   // por que pueden haber cambios, si no la creo y continuo con la logica.
  //   //TODO: Tambien se debera hacer el update
  //   const updateNotificacion = await this.update(createDto.codigoDhis2Evento , notificacion)

  //   if (pacienteUUID) {
  //     const notificacion = plainToClass(NotificacionDhis2, createDto);
  //     console.log("PruebaNotificacion:::" , notificacion);

  //     // Asignamos la unidad de Edad si está presente en el DTO.
  //     if (createDto.unidadEdadPaciente) {
  //       const unidadEdad = await this.catalogoService.findByDescriptionToDhis2(createDto.unidadEdadPaciente);
  //       notificacion.unidadEdad = unidadEdad;
  //     }

  //      // Asignamos la Provincia de residencia si está presente en el DTO.
  //      if (createDto.residencia.provincia) {
  //       const provinciaResidencia = await this.catalogoService.findByDescriptionToDhis2(createDto.residencia.provincia);
  //       notificacion.provinciaResidencia = provinciaResidencia;
  //     }

  //      // Asignamos el Canton de residencia si está presente en el DTO.
  //      if (createDto.residencia.canton) {
  //       const cantonResidencia = await this.catalogoService.findByDescriptionToDhis2(createDto.residencia.canton);
  //       notificacion.cantonResidencia = cantonResidencia;
  //     }

  //     // Asignamos el Canton de residencia si está presente en el DTO.
  //     if (createDto.residencia.parroquia) {
  //       try {
  //         const parroquiaResidencia = await this.catalogoService.findByDescriptionToDhis2(createDto.residencia.parroquia);
  //         notificacion.parroquiaResidencia = parroquiaResidencia;
  //       } catch (error:any) {
  //         console.log("Parroquia no encontrada");

  //       }

  //     }

  //     if(createDto.edad){
  //       try {
  //         const grupoEtarioPaciente = await this.grupoEtarioService.findGrupoEtarioByAge(createDto.edad)
  //         notificacion.grupoEtario = grupoEtarioPaciente
  //       } catch (error:any) {
  //         console.log("No registra edad");

  //       }
  //     }

  //     // Asignamos la Profesión de quien notifica si está presente en el DTO.
  //     if (createDto.profesionNotificadorParam) {
  //       const profesionNotificador = await this.catalogoService.findByDescriptionToDhis2(createDto.profesionNotificadorParam);
  //       notificacion.profesionNotificador = profesionNotificador;
  //     }

  //     notificacion.paciente = pacienteUUID;
  //     notificacion.createdBy = 'system';
  //     this.logger.log(
  //       `NotificationDHIS2 has been created: ${JSON.stringify(createDto)}`,
  //     );
  //     return this.notificacionRepository.save(notificacion);
  //   }
  //   throw new Error('pacienteUUID is a mandatory field to notification-dhis2');
  // }

  async create(createDto: CreateNotificacionDto, pacienteUUID: Paciente): Promise<Notificacion> {
    try {
      // Verificamos si ya existe una notificación con el mismo códigoDhis2Evento
      const notificacionExistente = await this.findByCodeDhis2(createDto.codigoDhis2Evento);

      if (notificacionExistente) {
        try {
          return await this.update(notificacionExistente, createDto, pacienteUUID);
        } catch (error:any) {
          console.log('Error en actualización');
        }
      } else {
        // Si no existe, creamos una nueva notificación
        const notificacion = plainToClass(Notificacion, { ...createDto, codigoOrigenNotificacion: createDto.codigoDhis2Evento }) as Notificacion;
        notificacion.origen = SourceEnum.DHIS2;

        // Asignamos las propiedades de la notificación
        if (createDto.unidadEdadPaciente) {
          try {
            notificacion.unidadEdad = await this.catalogoService.findByDescriptionToDhis2(createDto.unidadEdadPaciente);
          } catch (error:any) {
            console.error(`Error al buscar unidadEdadPaciente: ${error.message}`);
          }
        }

        if (createDto.residenciaPaciente.parroquia) {
          try {
            notificacion.parroquiaResidencia = await this.findParroquiaByCodigo(
              createDto.residenciaPaciente.parroquia,
            );
          } catch (error:any) {
            console.error(`Error al buscar parroquia: ${error.message}`);
          }
        }

        //TODO: CHECK GRUPO ETARIO
        // if (createDto.edad) {
        //   try {
        //     const grupoEtarioPaciente = await this.grupoEtarioService.findGrupoEtarioByAge(createDto.edad);
        //     notificacion.grupoEtario = grupoEtarioPaciente;
        //   } catch (error:any) {
        //     console.error(`Error al buscar grupo etario para la edad ${createDto.edad}: ${error.message}`);
        //   }
        // }

        if (!(createDto.edad && createDto.unidadEdadPaciente)) {
          try {
            if (createDto.fechaNotificacion && createDto.fechaNacimiento) {
              const edad = this.calcularEdad(createDto.fechaNotificacion, createDto.fechaNacimiento);
              const unidad = 'AÑOS';
              notificacion.edad = edad;
              notificacion.unidadEdad = await this.catalogoService.findByDescriptionToDhis2(unidad);
            }
          } catch (error:any) {
            console.log('No se puede calcular edad');
          }
        }

        if (createDto.profesionNotificadorParam) {
          try {
            // TODO\
            /*
            notificacion.profe profesionNotificador = await this.catalogoService.findByDescriptionToDhis2(
              createDto.profesionNotificadorParam,
            );
            */
          } catch (error:any) {
            console.error(`Error al buscar profesionNotificadorParam: ${error.message}`);
          }
        }

        // Asignamos el paciente y el creador de la notificación
        notificacion.paciente = pacienteUUID;
        notificacion.createdBy = 'system';

        this.logger.log(`NotificaciónDHIS2 ha sido creada`);

        // Guardamos la nueva notificación
        return this.notificacionRepository.save(notificacion);
      }
    } catch (error:any) {
      // Si ocurre un error, lo registramos
      console.error('Error en la creación o actualización de la notificación:', error);
      throw new Error('Hubo un problema al crear o actualizar la notificación');
    }
  }

  delete(uuid: string): Promise<Notificacion> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<Notificacion[]> {
    return this.notificacionRepository.find();
  }

  async findOne(uuid: string): Promise<Notificacion> {
    const notificacion = await this.notificacionRepository.findOne({
      where: { id: uuid },
    });
    if (notificacion) {
      return notificacion;
    }
    throw new EntityNotFoundException('Notificacion', uuid);
  }

  async findByCodeDhis2(code: string) {
    const notificacion = await this.notificacionRepository.findOne({
      where: {
        codigoOrigenNotificacion: code,
      },
    });
    if (notificacion) {
      return notificacion;
    }
    return null;
  }

  /**
   * Busca notificaciones por identificación de paciente y rango de fechas
   */
  async findByIdentificacionAndDateRange(identificacion: string, fechaInicio: Date, fechaFin: Date) {
    return this.notificacionRepository
      .createQueryBuilder('notificacion')
      .leftJoinAndSelect('notificacion.paciente', 'paciente')
      .where('paciente.identificacion = :identificacion', { identificacion })
      .andWhere('notificacion.fechaNotificacion >= :fechaInicio', { fechaInicio })
      .andWhere('notificacion.fechaNotificacion <= :fechaFin', { fechaFin })
      .getMany();
  }

  /**
   * Busca registros similares para actualización masiva
   */
  async findSimilarRecords(identificacion: string, fechaNotificacion: string) {
    const fecha = new Date(fechaNotificacion);
    const fechaInicio = new Date(fecha);
    fechaInicio.setDate(fechaInicio.getDate() - 7); // 7 días antes
    const fechaFin = new Date(fecha);
    fechaFin.setDate(fechaFin.getDate() + 7); // 7 días después

    return this.notificacionRepository
      .createQueryBuilder('notificacion')
      .leftJoinAndSelect('notificacion.paciente', 'paciente')
      .where('paciente.identificacion = :identificacion', { identificacion })
      .andWhere('notificacion.fechaNotificacion >= :fechaInicio', { fechaInicio })
      .andWhere('notificacion.fechaNotificacion <= :fechaFin', { fechaFin })
      .getMany();
  }

  /**
   * Actualiza una notificación por código DHIS2
   */
  async updateByCodigoDhis2Evento(codigoDhis2Evento: string, updateData: any) {
    const notificacionExistente = await this.findByCodeDhis2(codigoDhis2Evento);

    if (!notificacionExistente) {
      throw new Error(`Notificación con código DHIS2 ${codigoDhis2Evento} no encontrada`);
    }

    // Actualizar los campos de la notificación
    if (updateData.notificacion) {
      Object.assign(notificacionExistente, updateData.notificacion);
    }

    return this.notificacionRepository.save(notificacionExistente);
  }

  async update(notificacionExistente: Notificacion, createDto: CreateNotificacionDto, pacienteUUID: Paciente) {
    // Si la notificación existe, la actualizamos con los nuevos datos
    console.log('Notificación ya existe, actualizando...');

    // Actualizamos los campos relevantes
    if (createDto.unidadEdadPaciente) {
      try {
        notificacionExistente.unidadEdad = await this.catalogoService.findByDescriptionToDhis2(
          createDto.unidadEdadPaciente,
        );
      } catch (error:any) {
        console.error(`Error al buscar unidadEdadPaciente: ${error.message}`);
      }
    }

    if (createDto.residenciaPaciente.parroquia) {
      try {
        notificacionExistente.parroquiaResidencia = await this.findParroquiaByCodigo(
          createDto.residenciaPaciente.parroquia,
        );
      } catch (error:any) {
        console.error(`Error al buscar parroquia: ${error.message}`);
      }
    }

    // GRUPO ETARIO
    // if (createDto.edad) {
    //   try {
    //     const grupoEtarioPaciente = await this.grupoEtarioService.findGrupoEtarioByAge(createDto.edad);
    //     notificacionExistente.grupoEtario = grupoEtarioPaciente;
    //   } catch (error:any) {
    //     console.error(`Error al buscar grupo etario para la edad ${createDto.edad}: ${error.message}`);
    //   }
    // }
    if (!(createDto.edad && createDto.unidadEdadPaciente)) {
      try {
        if (createDto.fechaNotificacion && createDto.fechaNacimiento) {
          const edad = this.calcularEdad(createDto.fechaNotificacion, createDto.fechaNacimiento);
          const unidad = 'AÑOS';
          notificacionExistente.edad = edad;
          notificacionExistente.unidadEdad = await this.catalogoService.findByDescriptionToDhis2(unidad);
        }
      } catch (error:any) {
        console.log('No se puede calcular edad');
      }
    }

    if (createDto.profesionNotificadorParam) {
      try {
        notificacionExistente.notificador.profesion = await this.catalogoService.findByDescriptionToDhis2(
          createDto.profesionNotificadorParam,
        );
      } catch (error:any) {
        console.error(`Error al buscar profesionNotificadorParam: ${error.message}`);
      }
    }

    // Actualizamos el paciente y quién creó la notificación
    notificacionExistente.paciente = pacienteUUID;
    notificacionExistente.createdBy = 'system';
    notificacionExistente.origen = SourceEnum.DHIS2;
    notificacionExistente.fechaAtencion = createDto.fechaAtencion;
    notificacionExistente.fechaNotificacion = createDto.fechaNotificacion;
    notificacionExistente.edad = createDto.edad;
    notificacionExistente.casoNarrativo = createDto.casoNarrativo;
    notificacionExistente.fechaLlenadoFicha = createDto.fechaLlenadoFicha;
    notificacionExistente.codigoOrigenNotificacion = createDto.codigoDhis2Evento;

    // Guardamos la notificación actualizada
    this.logger.log(`NotificaciónDHIS2 ha sido actualizada: ${JSON.stringify(createDto)}`);
    // await this.notificacionRepository.update(notificacionExistente.id, notificacionExistente);
    // return notificacionExistente
    return this.notificacionRepository.save(notificacionExistente);
  }

  private async findParroquiaByCodigo(description: string): Promise<Parroquia | null> {
    const match = description.match(/\((\d{6})\)/);
    if (match) {
      return this.parroquiaRepository.findOne({ where: { codigo: match[1] } });
    }
    return this.parroquiaRepository.findOne({ where: { nombre: description.trim() } });
  }

  calcularEdadUnidadParaGrupoEtario = (edad, unidadEdad): { edadCalculada: number; unidadEdadCalculada: string } => {
    // Estos cálculos son únicamente para determinar el grupo etario correcto. NO SE ASIGNAN en edad y unidad de edad de la notificación.
    //let edadFinal = edad;
    let edadCalculada: number = edad;
    let unidadEdadCalculada: string = unidadEdad.toUpperCase(); // Aseguramos que la unidad de edad esté en mayúsculas

    // Si la unidad no es "AÑO", ni  "AÑOS", realizar la conversión
    if (unidadEdadCalculada !== 'AÑO' && unidadEdadCalculada !== 'AÑOS') {
      if (unidadEdadCalculada === 'DÉCADA') {
        // Si la unidad es "DÉCADA", multiplicamos por 10 para obtener la edad real en años
        edadCalculada = Math.floor(edad * 10);
        unidadEdadCalculada = 'AÑOS';
      } else if (unidadEdad === 'SEMANA') {
        //Tomar en cuenta que el grupo etario del Ministerio, solo tiene unidades de MESES y AÑOS.
        if (edadCalculada >= 0 && edadCalculada <= 52) {
          edadCalculada = Math.floor(edad / 4.3452); // Convertimos semanas a meses (1 semana = 1/4.345 meses)
          unidadEdadCalculada = 'MESES';
        } else {
          // Convertimos semanas a años (1 semana = 1/52 años)
          edadCalculada = Math.floor(edad / 52.1429);
          unidadEdadCalculada = 'AÑOS';
        }
      } else if (unidadEdad === 'DÍA' || unidadEdad === 'DÍAS') {
        if (edad >= 0 && edad <= 365) {
          edadCalculada = Math.floor(edad / 30.4167); // Convertimos días a meses (1 mes = 1/30.4167 días)
          unidadEdadCalculada = 'MESES';
        } else {
          // Convertimos días a años (1 día = 1/365 años)
          edadCalculada = Math.floor(edad / 365);
          unidadEdadCalculada = 'AÑOS';
        }
      } else if (unidadEdad === 'HORA') {
        // Convertimos horas a años (1 hora = 1/8760 años)
        edadCalculada = Math.floor(edad / 8760);
        unidadEdadCalculada = 'AÑOS';
      } else if (unidadEdad === 'MES' || unidadEdad === 'MESES') {
        if (edad >= 0 && edad <= 11) {
          edadCalculada = edad;
          unidadEdadCalculada = 'MESES';
        } else {
          // Convertimos meses a años (1 mes = 1/12 años)
          edadCalculada = Math.floor(edad / 12);
          unidadEdadCalculada = 'AÑOS';
        }
      }
    } else {
      // Si la unidad es "AÑO" o "AÑOS", no hacemos ninguna conversión
      edadCalculada = edad;
      unidadEdadCalculada = 'AÑOS';
    }

    // Aseguramos que siempre se retorne los valores calculados
    return { edadCalculada, unidadEdadCalculada };
  };

  /**
   * Permite calcular la edad cuando no se tenga la edad o la unidad de edad
   * @param fechaNacimiento
   * @param fechaNotificacion
   * @returns
   */
  calcularEdad(fechaNotificacion, fechaNacimiento) {
    // Normalizar las fechas eliminando las horas y minutos
    fechaNacimiento.setUTCHours(0, 0, 0, 0);
    fechaNotificacion.setUTCHours(0, 0, 0, 0);

    // Calcular la edad inicial
    let edad = fechaNotificacion.getFullYear() - fechaNacimiento.getFullYear();

    // Ajustar si el cumpleaños no ha pasado aún este año
    if (
      fechaNotificacion <
      new Date(fechaNotificacion.getFullYear(), fechaNacimiento.getMonth(), fechaNacimiento.getDate())
    ) {
      edad--;
    }

    return edad;
  }
}
