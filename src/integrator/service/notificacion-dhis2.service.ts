import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { CreateNotificacionDto } from '../dto/create-notificacion.dto';
import { NotificacionDhis2 } from '../entity/notificacion-dhis2.entity';
import { PacienteDhis2Service } from './paciente-dhis2.service';
import { PacienteDhis2 } from '../entity/paciente-dhis2.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';
import { Paciente } from '../entity/paciente.entity';
import { CatalogoService } from './catalogo.service';
import { GrupoEtarioService } from './grupo-etario.service';
import { log } from 'console';
import { Notificacion } from '../entity/notificacion.entity';

@Injectable()
export class NotificacionDhis2Service {
  private readonly logger = new Logger(NotificacionDhis2Service.name);

  constructor(
    @InjectRepository(NotificacionDhis2)
    private readonly notificacionRepository: Repository<NotificacionDhis2>,
    private readonly pacienteService: PacienteDhis2Service,
    private readonly catalogoService: CatalogoService,
    private readonly grupoEtarioService: GrupoEtarioService
  ) { }

  // async create(
  //   createDto: CreateNotificacionDto,
  //   pacienteUUID: PacienteDhis2,
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
  //       } catch (error) {
  //         console.log("Parroquia no encontrada");

  //       }

  //     }

  //     if(createDto.edad){
  //       try {
  //         const grupoEtarioPaciente = await this.grupoEtarioService.findGrupoEtarioByAge(createDto.edad)
  //         notificacion.grupoEtario = grupoEtarioPaciente
  //       } catch (error) {
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


  async create(
    createDto: CreateNotificacionDto,
    pacienteUUID: PacienteDhis2,
  ): Promise<NotificacionDhis2> {
    console.log("NotificacionDatos:::", createDto);
    console.log("NotificacionDatosPaciente:::", pacienteUUID);

    try {
      // Verificamos si ya existe una notificación con el mismo códigoDhis2Evento
      const notificacionExistente = await this.findByCodeDhis2(createDto.codigoDhis2Evento);
      console.log("ExistePacienteNotificacion::", notificacionExistente);

      if (notificacionExistente) {
        try {
          return await this.update(notificacionExistente, createDto, pacienteUUID)
        } catch (error) {
          console.log("Error en actualización");

        }
      } else {
        // Si no existe, creamos una nueva notificación
        console.log("Notificación no existe, creando nueva...");

        const notificacion = plainToClass(NotificacionDhis2, createDto);

        // Asignamos las propiedades de la notificación
        if (createDto.unidadEdadPaciente) {
          try {
            notificacion.unidadEdad = await this.catalogoService.findByDescriptionToDhis2(createDto.unidadEdadPaciente);
          } catch (error) {
            console.error(`Error al buscar unidadEdadPaciente: ${error.message}`);
          }
        }

        if (createDto.residencia.provincia) {
          try {
            notificacion.provinciaResidencia = await this.catalogoService.findByDescriptionToDhis2(createDto.residencia.provincia);
          } catch (error) {
            console.error(`Error al buscar provincia: ${error.message}`);
          }
        }

        if (createDto.residencia.canton) {
          try {
            notificacion.cantonResidencia = await this.catalogoService.findByDescriptionToDhis2(createDto.residencia.canton);
          } catch (error) {
            console.error(`Error al buscar canton: ${error.message}`);
          }
        }

        if (createDto.residencia.parroquia) {
          try {
            notificacion.parroquiaResidencia = await this.catalogoService.findByDescriptionToDhis2(createDto.residencia.parroquia);
          } catch (error) {
            console.error(`Error al buscar parroquia: ${error.message}`);
          }
        }

        //TODO: CHECK GRUPO ETARIO 
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
            let edadFinal = this.calcularGrupoEtario(createDto.edad, createDto.unidadEdadPaciente)
            // Ahora que tenemos la edadFinal calculada, buscamos el grupo etario
            const grupoEtarioPaciente = await this.grupoEtarioService.findGrupoEtarioByAge(edadFinal);
            notificacion.grupoEtario = grupoEtarioPaciente;
            console.log("GrupoetarioExis::", grupoEtarioPaciente);

          } catch (error) {
            console.error(`Error al calcular grupo etario para la edad ${createDto.edad} ${createDto.unidadEdadPaciente}: ${error.message}`);
          }
        }else{
          try {
            if(createDto.fechaNotificacion && createDto.fechaNacimiento){
              console.log("EdadPacientesss::::" , createDto.fechaNotificacion , createDto.fechaNacimiento);
              const edad = await this.calcularEdad(createDto.fechaNotificacion , createDto.fechaNacimiento)
              const grupoEtarioPaciente = await this.grupoEtarioService.findGrupoEtarioByAge(edad);
              notificacion.grupoEtario = grupoEtarioPaciente;

              
            }
          } catch (error) {
            console.log("No se puede calcular edad");
            
          }
        }

        if (createDto.profesionNotificadorParam) {
          try {
            notificacion.profesionNotificador = await this.catalogoService.findByDescriptionToDhis2(createDto.profesionNotificadorParam);
          } catch (error) {
            console.error(`Error al buscar profesionNotificadorParam: ${error.message}`);
          }
        }


        // Asignamos el paciente y el creador de la notificación
        notificacion.paciente = pacienteUUID;
        notificacion.createdBy = 'system';

        this.logger.log(`NotificaciónDHIS2 ha sido creada: ${JSON.stringify(createDto)}`);

        // Guardamos la nueva notificación
        return this.notificacionRepository.save(notificacion);
      }
    } catch (error) {
      // Si ocurre un error, lo registramos
      console.error("Error en la creación o actualización de la notificación:", error);
      throw new Error('Hubo un problema al crear o actualizar la notificación');
    }
  }


  delete(uuid: string): Promise<NotificacionDhis2> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<NotificacionDhis2[]> {
    return this.notificacionRepository.find();
  }

  async findOne(uuid: string): Promise<NotificacionDhis2> {
    const notificacion = await this.notificacionRepository.findOne({
      where: { id: uuid },
    });
    if (notificacion) {
      return notificacion;
    }
    throw new EntityNotFoundException('NotificacionDhis2', uuid);
  }

  async findByCodeDhis2(code: string) {
    const notificacion = await this.notificacionRepository.findOne({
      where: {
        codigoDhis2Evento: code
      },
    });
    if (notificacion) {
      return notificacion;
    }
    return null;
  }

  async update(
    notificacionExistente: Notificacion,
    createDto: CreateNotificacionDto,
    pacienteUUID: PacienteDhis2,
  ) {

    // Si la notificación existe, la actualizamos con los nuevos datos
    console.log("Notificación ya existe, actualizando...");

    // Actualizamos los campos relevantes
    if (createDto.unidadEdadPaciente) {
      try {
        notificacionExistente.unidadEdad = await this.catalogoService.findByDescriptionToDhis2(createDto.unidadEdadPaciente);
      } catch (error) {
        console.error(`Error al buscar unidadEdadPaciente: ${error.message}`);
      }
    }

    if (createDto.residencia.provincia) {
      try {
        notificacionExistente.provinciaResidencia = await this.catalogoService.findByDescriptionToDhis2(createDto.residencia.provincia);
      } catch (error) {
        console.error(`Error al buscar provincia: ${error.message}`);
      }
    }

    if (createDto.residencia.canton) {
      try {
        notificacionExistente.cantonResidencia = await this.catalogoService.findByDescriptionToDhis2(createDto.residencia.canton);
      } catch (error) {
        console.error(`Error al buscar canton: ${error.message}`);
      }
    }

    if (createDto.residencia.parroquia) {
      try {
        notificacionExistente.parroquiaResidencia = await this.catalogoService.findByDescriptionToDhis2(createDto.residencia.parroquia);
      } catch (error) {
        console.error(`Error al buscar parroquia: ${error.message}`);
      }
    }

    // GRUPO ETARIO 
    // if (createDto.edad) {
    //   try {
    //     const grupoEtarioPaciente = await this.grupoEtarioService.findGrupoEtarioByAge(createDto.edad);
    //     notificacionExistente.grupoEtario = grupoEtarioPaciente;
    //   } catch (error) {
    //     console.error(`Error al buscar grupo etario para la edad ${createDto.edad}: ${error.message}`);
    //   }
    // }
    if (createDto.edad && createDto.unidadEdadPaciente) {
      try {
        let edadFinal = this.calcularGrupoEtario(createDto.edad, createDto.unidadEdadPaciente)
        // Ahora que tenemos la edadFinal calculada, buscamos el grupo etario
        const grupoEtarioPaciente = await this.grupoEtarioService.findGrupoEtarioByAge(edadFinal);
        notificacionExistente.grupoEtario = grupoEtarioPaciente;

      } catch (error) {
        console.error(`Error al calcular grupo etario para la edad ${createDto.edad} ${createDto.unidadEdadPaciente}: ${error.message}`);
      }
    }else{
      try {
        if(createDto.fechaNotificacion && createDto.fechaNacimiento){
          console.log("EdadPacientesss::::" , createDto.fechaNotificacion , createDto.fechaNacimiento);
          const edad = await this.calcularEdad(createDto.fechaNotificacion , createDto.fechaNacimiento)
          const grupoEtarioPaciente = await this.grupoEtarioService.findGrupoEtarioByAge(edad);
          notificacionExistente.grupoEtario = grupoEtarioPaciente;

          
        }
      } catch (error) {
        console.log("No se puede calcular edad");
        
      }
    }

    if (createDto.profesionNotificadorParam) {
      try {
        notificacionExistente.profesionNotificador = await this.catalogoService.findByDescriptionToDhis2(createDto.profesionNotificadorParam);
      } catch (error) {
        console.error(`Error al buscar profesionNotificadorParam: ${error.message}`);
      }
    }

    // Actualizamos el paciente y quién creó la notificación
    notificacionExistente.paciente = pacienteUUID;
    notificacionExistente.createdBy = 'system';
    notificacionExistente.antecedenteVacunal = createDto.antecedenteVacunal;
    notificacionExistente.antecedenteEventoPrevio = createDto.antecedenteEventoPrevio;
    notificacionExistente.fechaAtencion = createDto.fechaAtencion;
    notificacionExistente.fechaNotificacion = createDto.fechaNotificacion;
    notificacionExistente.fechaNacimiento = createDto.fechaNacimiento;
    notificacionExistente.edad = createDto.edad;
    notificacionExistente.organizacion = createDto.organizacion;
    notificacionExistente.casoNarrativo = createDto.casoNarrativo;
    notificacionExistente.fechaLlenadoFicha = createDto.fechaLlenadoFicha;
    notificacionExistente.beforeUpdate();

    // Guardamos la notificación actualizada
    this.logger.log(`NotificaciónDHIS2 ha sido actualizada: ${JSON.stringify(createDto)}`);
    // await this.notificacionRepository.update(notificacionExistente.id, notificacionExistente);
    // return notificacionExistente
    return this.notificacionRepository.save(notificacionExistente)

  }




  calcularGrupoEtario = (edad, unidadEdad) => {
    console.log("GrupoEtarioCalcular:::" , edad , unidadEdad);
    
    // Aseguramos que la unidad de edad esté en mayúsculas     
    let edadFinal = edad;

    // Si la unidad no es "AÑO" o "AÑOS", realizar la conversión     
    if (unidadEdad !== 'AÑO' && unidadEdad !== 'AÑOS') {
      if (unidadEdad === 'DÉCADA') {
        // Si la unidad es "DÉCADA", multiplicamos por 10 para obtener la edad real en años          
        edadFinal = Math.floor(edad * 10);
      } else if (unidadEdad === 'SEMANA') {
        // Convertimos semanas a años (1 semana = 1/52 años)         
        edadFinal = Math.floor(edad / 52);
      } else if (unidadEdad === 'DÍA' || unidadEdad === 'DÍAS') {
        // Convertimos días a años (1 día = 1/365 años)         
        edadFinal = Math.floor(edad / 365);
      } else if (unidadEdad === 'HORA') {
        // Convertimos horas a años (1 hora = 1/8760 años)         
        edadFinal = Math.floor(edad / 8760);
      } else if (unidadEdad === 'MES' || unidadEdad === 'MESES') {
        // Convertimos meses a años (1 mes = 1/12 años)         
        edadFinal = Math.floor(edad / 12);
      }
    }

    // Aseguramos que siempre se retorne la edadFinal
    return edadFinal;
  }

  /**
   * Permite calcular la edad cuando no se tenga la edad o la unidad de edad
   * @param fechaNacimiento 
   * @param fechaNotificacion 
   * @returns 
   */
  calcularEdad( fechaNotificacion , fechaNacimiento) {
    // Normalizar las fechas eliminando las horas y minutos
    fechaNacimiento.setUTCHours(0, 0, 0, 0);
    fechaNotificacion.setUTCHours(0, 0, 0, 0);
  
    // Calcular la edad inicial
    let edad = fechaNotificacion.getFullYear() - fechaNacimiento.getFullYear();
  
    // Ajustar si el cumpleaños no ha pasado aún este año
    if (fechaNotificacion < new Date(fechaNotificacion.getFullYear(), fechaNacimiento.getMonth(), fechaNacimiento.getDate())) {
      edad--;
    }
  
    return edad;
  }

}
