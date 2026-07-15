import {Injectable,Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {plainToClass} from 'class-transformer';
import {In,Repository} from 'typeorm';
import {CreateNotificacionDto,UpdateNotificacionDto} from '../dto';
import {Establecimiento} from '../entity/establecimiento.entity';
import {Notificacion} from '../entity/notificacion.entity';
import {Notificador} from '../entity/notificador.entity';
import {Paciente} from '../entity/paciente.entity';
import {Parroquia} from '../entity/parroquia.entity';
import {SourceEnum} from '../enum/source-enum';
import {EntityNotFoundException} from '../exception/enntity-not-found.exception';
import {CatalogoPadreService} from './catalogo-padre.service';

@Injectable()
export class NotificacionVigiflowService {
  private readonly logger = new Logger(NotificacionVigiflowService.name);

  private establecimientosCache: { id: string; nombre: string }[] | null = null;

  constructor(
    @InjectRepository(Notificacion, 'POSTGRES_INTEGRATOR_DS')
    private readonly notificacionRepository: Repository<Notificacion>,
    @InjectRepository(Parroquia, 'POSTGRES_INTEGRATOR_DS')
    private readonly parroquiaRepository: Repository<Parroquia>,
    private readonly catalogoPadreService: CatalogoPadreService,
  ) {}

  async findAllByCodigosOrigen(codigos: string[]): Promise<Map<string, Notificacion[]>> {
    if (!codigos.length) return new Map();
    const notificaciones = await this.notificacionRepository.find({
      where: { codigoOrigenNotificacion: In(codigos) },
    });
    const map = new Map<string, Notificacion[]>();
    for (const n of notificaciones) {
      const key = n.codigoOrigenNotificacion?.trim();
      if (key) {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(n);
      }
    }
    return map;
  }

  async create(createDto: CreateNotificacionDto, pacienteUUID: Paciente, preloaded?: Notificacion): Promise<Notificacion> {
    if (pacienteUUID) {
      const notificacion = preloaded ?? await this.findByCodigoOrigen(createDto.codigoVigiflow);
      if (notificacion) {
        let changed = false;

        if (createDto.edad != null && createDto.edad !== notificacion.edad) {
          notificacion.edad = createDto.edad;
          changed = true;
        }

        if (createDto.unidadEdadPaciente) {
          const unidadEdad = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud('UNIDAD_EDAD', createDto.unidadEdadPaciente);
          if (unidadEdad) { notificacion.unidadEdad = unidadEdad; changed = true; }
        }

        if (!this.isNullOrUndefinedOrEmpty(createDto.residenciaPaciente?.parroquia)) {
          try {
            const parroquia = await this.findParroquiaByCodigo(createDto.residenciaPaciente.parroquia);
            if (parroquia) { notificacion.parroquiaResidencia = parroquia; changed = true; }
          } catch (_) { /* parroquia no encontrada, se ignora */ }
        }

        if (changed) {
          await this.notificacionRepository.save(notificacion);
        }

        return notificacion;
      } else {
        const notificacion = plainToClass(Notificacion, { ...createDto, codigoOrigenNotificacion: createDto.codigoVigiflow }) as Notificacion;
        notificacion.origen = SourceEnum.VIGIFLOW;
        notificacion.paciente = pacienteUUID;
        if (!this.isNullOrUndefinedOrEmpty(createDto.tipoReporte)) {
          notificacion.tipoReporte = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud('TIPO_REPORTE', createDto.tipoReporte);
        } else {
          notificacion.tipoReporte = null;
        }
        if (!this.isNullOrUndefinedOrEmpty(createDto.tipoEmisor)) {
          notificacion.tipoEmisor = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud('TIPO_EMISOR', createDto.tipoEmisor);
        } else {
          notificacion.tipoEmisor = null;
        }
        if (!this.isNullOrUndefinedOrEmpty(createDto.residenciaPaciente.parroquia)) {
          try {
            notificacion.parroquiaResidencia = await this.findParroquiaByCodigo(
              createDto.residenciaPaciente.parroquia,
            );
          } catch (error) {
            console.log('Parroquia no encontrada');
          }
        }
        if (!this.isNullOrUndefinedOrEmpty(createDto.unidadEdadPaciente)) {
          const unidadEdad = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud('UNIDAD_EDAD', createDto.unidadEdadPaciente);
          if (unidadEdad) notificacion.unidadEdad = unidadEdad;
        }
        /* calculo de la edad, unidad de edad */
        if( (createDto.fechaNotificacion && createDto.fechaNacimiento) && 
        (createDto.fechaNotificacion >= createDto.fechaNacimiento) ){
          try{          

            let resultadoUnidadYedad = this.calcularEdad(createDto.fechaNotificacion, createDto.fechaNacimiento);           
            notificacion.edad = resultadoUnidadYedad.edadCalculada;
            notificacion.unidadEdad = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud('UNIDAD_EDAD', resultadoUnidadYedad.unidadEdadCalculada);
            /**
             * Para el cálculo del grupo etario, según el catálogo del Ministerio de Salud Pública,
             * está bien utilizar la unidad de edad en años y meses solamente. Pero, para edades
             * inferiores a un mes, se debe almacenar en la tabla, la unidad en días.
             */
            if(resultadoUnidadYedad.edadCalculada === 0 && resultadoUnidadYedad.unidadEdadCalculada === 'MESES'){// El método calcularEdad devuelve  las unidades en PLURAL.
              notificacion.unidadEdad = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud('UNIDAD_EDAD', 'Dias'); //Aquí ya se homologa la unidad de edad con el catálogo UNIDAD_EDAD.
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

  async update(
    notificacion: Notificacion,
    updateNotificacion: UpdateNotificacionDto,
    notificador?: Notificador,
    establecimientoId?: string,
  ) {
    try {
      notificacion.casoNarrativo = updateNotificacion.casoNarrativo;
      notificacion.tipoReporte = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud('TIPO_REPORTE', updateNotificacion.tipoReporte);
      notificacion.fechaNotificacion = updateNotificacion.fechaNotificacion;
      notificacion.fechaReporteNacional = updateNotificacion.fechaReporteNacional;
      notificacion.tipoEmisor = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud('TIPO_EMISOR', updateNotificacion.tipoEmisor);
      if (updateNotificacion.peso != null) notificacion.peso = updateNotificacion.peso;
      if (updateNotificacion.altura != null) notificacion.altura = updateNotificacion.altura;
      if (updateNotificacion.fechaAtencion != null) notificacion.fechaAtencion = updateNotificacion.fechaAtencion;
      if (updateNotificacion.tituloReporte) notificacion.tituloReporte = updateNotificacion.tituloReporte;

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

  private async findParroquiaByCodigo(description: string): Promise<Parroquia | null> {
    const match = description.match(/\((\d{6})\)/);
    if (match) {
      return this.parroquiaRepository.findOne({ where: { codigo: match[1] } });
    }
    return this.parroquiaRepository.findOne({ where: { nombre: description.trim() } });
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

  async preloadBulk(): Promise<void> {
    await this.catalogoPadreService.preloadSubcategoriasMap();
    this.establecimientosCache = await this.notificacionRepository.manager.query(
      `SELECT "ID" as id, "UNI_NOMBRE" as nombre FROM "DHI_ESAVI"."TR_ESTABLECIMIENTO" WHERE "AUD_HABILITADO" = true`,
    );
    this.logger.log(`Establecimientos precargados: ${this.establecimientosCache.length}`);
  }

  async preloadEstablecimientos(): Promise<void> {
    this.establecimientosCache = await this.notificacionRepository.manager.query(
      `SELECT "ID" as id, "UNI_NOMBRE" as nombre FROM "DHI_ESAVI"."TR_ESTABLECIMIENTO" WHERE "AUD_HABILITADO" = true`,
    );
  }

  clearBulkCache(): void {
    this.catalogoPadreService.clearSubcategoriasCache();
    this.establecimientosCache = null;
  }

  clearEstablecimientosCache(): void {
    this.establecimientosCache = null;
  }

  async matchYGrabarEstablecimiento(notificacionId: string, orgEmisorExcel: string): Promise<void> {
    const norm = (s: string) =>
      (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();

    const rows: { id: string; nombre: string }[] = this.establecimientosCache
      ?? await this.notificacionRepository.manager.query(
          `SELECT "ID" as id, "UNI_NOMBRE" as nombre FROM "DHI_ESAVI"."TR_ESTABLECIMIENTO" WHERE "AUD_HABILITADO" = true`,
        );

    if (!orgEmisorExcel || rows.length === 0) return;

    const excelNorm = norm(orgEmisorExcel);
    const excelWords = excelNorm.split(/\s+/).filter(Boolean);

    let bestId: string | null = null;
    let bestScore = 0;
    let bestName = '';

    for (const row of rows) {
      const dbNorm = norm(row.nombre);
      if (dbNorm === excelNorm) { bestId = row.id; bestScore = 1; bestName = row.nombre; break; }
      const dbWords = dbNorm.split(/\s+/).filter(Boolean);
      const [smaller, largerArr] = excelWords.length <= dbWords.length ? [excelWords, dbWords] : [dbWords, excelWords];
      const largerSet = new Set(largerArr);
      let hits = 0;
      for (const w of smaller) if (largerSet.has(w)) hits++;
      const score = hits / smaller.length;
      if (score > bestScore) { bestScore = score; bestId = row.id; bestName = row.nombre; }
    }

    if (bestScore >= 0.9 && bestId) {
      await this.notificacionRepository.manager.query(
        `UPDATE "DHI_ESAVI"."TR_NOTIFICACION" SET "ESTABLECIMIENTO_ID" = $1 WHERE "ID" = $2`,
        [bestId, notificacionId],
      );
    }
  }

}
