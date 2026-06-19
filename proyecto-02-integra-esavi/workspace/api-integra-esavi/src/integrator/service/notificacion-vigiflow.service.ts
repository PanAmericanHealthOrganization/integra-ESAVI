import {Injectable,Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {plainToClass} from 'class-transformer';
import {Repository} from 'typeorm';
import {CreateNotificacionDto,UpdateNotificacionDto} from '../dto';
import {Notificacion} from '../entity/notificacion.entity';
import {Notificador} from '../entity/notificador.entity';
import {Paciente} from '../entity/paciente.entity';
import {SourceEnum} from '../enum/source-enum';
import {EntityNotFoundException} from '../exception/enntity-not-found.exception';
import {CatalogoService} from './catalogo.service';

@Injectable()
export class NotificacionVigiflowService {
  private readonly logger = new Logger(NotificacionVigiflowService.name);

  constructor(
    @InjectRepository(Notificacion, 'POSTGRES_INTEGRATOR_DS')
    private readonly notificacionRepository: Repository<Notificacion>,
    private readonly catalogoService: CatalogoService,
  ) {}

  async create(createDto: CreateNotificacionDto, pacienteUUID: Paciente): Promise<Notificacion> {
    if (pacienteUUID) {
      const notificacion = await this.findByCodigoOrigen(createDto.codigoVigiflow);
      if (notificacion) {
        return notificacion;
      } else {
        const notificacion = plainToClass(Notificacion, { ...createDto, codigoOrigenNotificacion: createDto.codigoVigiflow }) as Notificacion;
        notificacion.origen = SourceEnum.VIGIFLOW;
        notificacion.paciente = pacienteUUID;
        if (!this.isNullOrUndefinedOrEmpty(createDto.residenciaPaciente.provincia)) {
          try {
            notificacion.provinciaResidencia = await this.catalogoService.findByDescriptionToVigiflow(
              createDto.residenciaPaciente.provincia,
            );
          } catch (error) {
            console.log(`Provincia "${createDto.residenciaPaciente.provincia}" paciente vf no encontrada`);
          }
        }
        if (!this.isNullOrUndefinedOrEmpty(createDto.residenciaPaciente.canton)) {
          try {
            notificacion.cantonResidencia = await this.catalogoService.findByDescriptionToVigiflow(
              createDto.residenciaPaciente.canton,
            );
          } catch (error) {
            console.log('Canton no encontrada');
          }
        }
        if (!this.isNullOrUndefinedOrEmpty(createDto.residenciaPaciente.parroquia)) {
          try {
            notificacion.parroquiaResidencia = await this.catalogoService.findByDescriptionToVigiflow(
              createDto.residenciaPaciente.parroquia,
            );
          } catch (error) {
            console.log('Parroquia no encontrada');
          }
        }
        if (!this.isNullOrUndefinedOrEmpty(createDto.unidadEdadPaciente)) {
          try {
            notificacion.unidadEdad = await this.catalogoService.findByDescriptionToVigiflow(
              createDto.unidadEdadPaciente,
            );
          } catch (error) {
            console.log('Unidad Edad paciente no encontrada');
          }
        }
        /* calculo de la edad, unidad de edad */
        if( (createDto.fechaNotificacion && createDto.fechaNacimiento) && 
        (createDto.fechaNotificacion >= createDto.fechaNacimiento) ){
          try{          

            let resultadoUnidadYedad = this.calcularEdad(createDto.fechaNotificacion, createDto.fechaNacimiento);           
            notificacion.edad = resultadoUnidadYedad.edadCalculada;
            notificacion.unidadEdad = await this.catalogoService.findByDescriptionToVigiflow(resultadoUnidadYedad.unidadEdadCalculada);
            /**
             * Para el cálculo del grupo etario, según el catálogo del Ministerio de Salud Pública,
             * está bien utilizar la unidad de edad en años y meses solamente. Pero, para edades
             * inferiores a un mes, se debe almacenar en la tabla, la unidad en días.
             */
            if(resultadoUnidadYedad.edadCalculada === 0 && resultadoUnidadYedad.unidadEdadCalculada === 'MESES'){// El método calcularEdad devuelve  las unidades en PLURAL.
              notificacion.unidadEdad = await this.catalogoService.findByDescriptionToVigiflow('DÍAS'); //Aquí ya se homologa la unidad de dad, con los valores numéricos (FK) del catálogo.
              // como el grupo etario se calcula con meses y años, no es necesario recalcularlo,
              // ahora se calcula el valor numérico de la edad en días
              const msPorDia = 1000 * 60 * 60 * 24;
              const edadDias = Math.floor((notificacion.fechaNotificacion.getTime() - createDto.fechaNacimiento.getTime()) / msPorDia);
              notificacion.edad = edadDias;
            }

          }catch(error){
            console.log('No se puede calcular edad');
          }
        } else {
          
          /**Este proceso es exclusivamente para el cálculo del grupo etario.
           * La edad y la unidad de edad son asignadas sin mayores transformaciones,
           * en la clase vigiflow-integrator.service.ts
           */        
          if (createDto.edad && createDto.unidadEdadPaciente) {
            // se comprueba que no sean nulos
            try {
              // Aseguramos que la unidad de edad esté en mayúsculas
              let unidadEdad = createDto.unidadEdadPaciente.toUpperCase();
              let edadFinal = createDto.edad;

              // Si la unidad no es "AÑO" o "AÑOS", realizar la conversión
              if (unidadEdad !== 'AÑO' && unidadEdad !== 'AÑOS') {
                if (unidadEdad === 'DÉCADA') {
                  // Si la unidad es "DÉCADA", multiplicamos por 10 para obtener la edad real en años
                  edadFinal = ~~(createDto.edad * 10);
                  unidadEdad = 'AÑOS'; // Actualizamos la unidad a "AÑOS" después de la conversión
                } else if (unidadEdad === 'SEMANA') {
                  if (createDto.edad >= 0 && createDto.edad <= 52) {
                    edadFinal = ~~(createDto.edad / 4.3452); // cte sugerida: 4.34524// Convertimos semanas a meses (1 mes = 4.34524 semanas)
                    unidadEdad = 'MESES';
                  } else {
                    // Convertimos semanas a años (1 semana = 1/52 años)
                    edadFinal = ~~(createDto.edad / 52.1429);
                    unidadEdad = 'AÑOS';
                  }
                } else if (unidadEdad === 'DÍA' || unidadEdad === 'DÍAS') {
                  if (createDto.edad >= 0 && createDto.edad <= 364) {
                    // Se convierte días a meses (1 mes = 30.44 días)
                    edadFinal = ~~(createDto.edad / 30.44);
                    unidadEdad = 'MESES';
                  } else {
                    // Convertimos días a años (1 día = 1/365 años)
                    edadFinal = ~~(createDto.edad / 365);
                    unidadEdad = 'AÑOS';
                  }
                  
                } else if (unidadEdad === 'HORA') {
                  if (createDto.edad >= 0 && createDto.edad <= 8759) {
                    // Si la edad en horas es menor a 8760 (1 año), la convertimos a meses
                    edadFinal = ~~(createDto.edad / 730); // cte sugerida: 730.001// Convertimos horas a meses (1 mes = 730.001 horas)
                    unidadEdad = 'MESES';
                  } else {
                    // Convertimos horas a años (1 hora = 1/8760 años)
                    edadFinal = ~~(createDto.edad / 8760);
                    unidadEdad = 'AÑOS';
                  }                
                } else if (unidadEdad === 'MES' || unidadEdad === 'MESES') {
                  if (createDto.edad >= 0 && createDto.edad <= 11) {
                    // Si la edad en meses es menor a 12, la dejamos como meses
                    edadFinal = createDto.edad;
                    unidadEdad = 'MESES';
                  } else {
                    // Convertimos meses a años (1 mes = 1/12 años)
                    edadFinal = ~~(createDto.edad / 12);
                    unidadEdad = 'AÑOS';
                  }
                }
              } else {
                unidadEdad = 'AÑOS';
              }

            } catch (error) {
              console.error(
                `Error al calcular edad para "${createDto.edad}", unidad: "${createDto.unidadEdadPaciente}": ${error.message}`,
              );
            }
          }
        }

        notificacion.createdBy = process.env.USUARIO_INSERTA_REGISTRO;
        const not = await this.notificacionRepository.save(notificacion);
        this.logger.log(`Notificación Vigiflow creada con UUID: ${not.id}`);
        return not;
      }
    } else {
      throw new Error('pacienteUUID is a mandatory field to notification-vigiflow');
    }
  }
  calcularEdad(fechaNotificacion: Date, fechaNacimiento: Date): {edadCalculada: number, unidadEdadCalculada: string} {
      fechaNacimiento.setUTCHours(0, 0, 0, 0);
      fechaNotificacion.setUTCHours(0, 0, 0, 0);
    
      let edadAnios = fechaNotificacion.getFullYear() - fechaNacimiento.getFullYear();
    
      // Ajuste de cumpleaños
      if (
        fechaNotificacion <
        new Date(fechaNotificacion.getFullYear(), fechaNacimiento.getMonth(), fechaNacimiento.getDate())
      ) {
        edadAnios--;
      }
    
      // Si ya tiene al menos 1 año → devolver en años
      if (edadAnios > 0) {
        return { edadCalculada: edadAnios, unidadEdadCalculada: 'AÑOS' }; // 1 = años
      }
    
      // Calcular diferencia total en meses
      let meses = (fechaNotificacion.getFullYear() - fechaNacimiento.getFullYear()) * 12 +
                  (fechaNotificacion.getMonth() - fechaNacimiento.getMonth());
    
      // Ajustar si el día aún no ha llegado
      if (fechaNotificacion.getDate() < fechaNacimiento.getDate()) {
        meses--;
      }
    
      // Si meses > 0 → devolver en meses
      if (meses >= 0) {
        return { edadCalculada: meses, unidadEdadCalculada: 'MESES' }; // 2 = meses
      }
    
      // Si meses = 0 → calcular en días
      /*const msPorDia = 1000 * 60 * 60 * 24;
      const dias = Math.floor((fechaNotificacion.getTime() - fechaNacimiento.getTime()) / msPorDia);
      return { edadCalculada: dias, unidadEdadCalculada: 'DÍA' };*/ // 3 = días        
    
  }//;

  async update(notificacion: Notificacion, updateNotificacion: UpdateNotificacionDto, notificador?: Notificador) {
    try {
      if (updateNotificacion.profesionNotificadorParam) {
        try {
          const profesionNotificador = await this.catalogoService.findByDescriptionToVigiflow(
            updateNotificacion.profesionNotificadorParam,
          );
          notificacion.profesionNotificador = profesionNotificador;
        } catch (error) {
          console.log('Profesion no encontrada');
        }
      }

      notificacion.casoNarrativo = updateNotificacion.casoNarrativo;
      notificacion.tipoReporte = updateNotificacion.tipoReporte;
      notificacion.fechaNotificacion = updateNotificacion.fechaNotificacion;
      notificacion.fechaReporteNacional = updateNotificacion.fechaReporteNacional;
      notificacion.tipoEmisor = updateNotificacion.tipoEmisor;

      if (notificador) {
        notificacion.notificador = notificador;
      }

      await this.notificacionRepository.save(notificacion);
    } catch (error) {
      console.error('Error al actualizar la notificacion:', error);
      throw error;
    }
  }

  delete(uuid: string): Promise<Notificacion> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<Notificacion[]> {
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

  async findOne(uuid: string): Promise<Notificacion> {
    const notificacion = await this.notificacionRepository.findOne({
      where: { id: uuid },
    });
    if (notificacion) {
      return notificacion;
    }
    throw new EntityNotFoundException('Notificacion', uuid);
  }

  private isNullOrUndefinedOrEmpty(field: string): boolean {
    return typeof field === 'undefined' || field === null || field.length === 0;
  }

  async findByCodigoOrigen(code: string) {
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

  analizarCadenaFechaGuionMedio(dateStr: string): Date | null {
    // Validar formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.log(`Formato inválido, se espera YYYY-MM-DD: ${dateStr}`);
      return null;
    }
  
    const [yearStr, monthStr, dayStr] = dateStr.split("-"); //= dateStr.split("-").map(Number);
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
  
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      console.log(`Texto inválido, se espera este formato YYYY-MM-DD: ${dateStr}`);
      return null;
    }
  
    // 🚀 Crear directamente en UTC con hora 00:00:00
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    //return (new Date(year, month - 1, day)).setUTCHours(0,0,0,0), new Date(year, month - 1, day);
    //const fecha = new Date(year, month - 1, day);
    //return fecha.setUTCHours(0, 0, 0, 0), fecha;
    //fecha.setHours(0, 0, 0, 0);
    //return fecha;
    /**
     * Si la aplicación trabaja solo a nivel nacional, no es
     * necesario manejar las fechas en UTC, por lo que se
     * puede retornar la fecha directamente sin convertir a UTC. Se debe tener en cuenta
     * que al convertir a UTC, el desfase es innevitable, en comparación con los datos
     * que han sido capturados en formato local.
     */
  }
  
}
