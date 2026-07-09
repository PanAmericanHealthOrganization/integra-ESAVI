import {HttpService} from '@nestjs/axios';
import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import {CausalidadEsavi} from 'src/integrator/entity';
import {IAuditoria} from 'src/integrator/entity/auditoria.entity';
import {MeddraLLTService} from 'src/meddra/services/meddra-lt.service';
import {MeddraPtService} from 'src/meddra/services/meddra-pt.service';
import {
  CreateAntecedenteEmbarazoDto,
  CreateAntecedenteEventoDto,
  CreateAntecedenteMedicoDto,
  CreateAntecedentePreexistenciaDto,
  CreateCausalidadEsaviDto,
  CreateCompleteDto,
  CreateDatoEsaviDto,
  CreateDatoVacunaDto,
  CreateDatoVacunacionDto,
  CreateDesenlaceEsaviDto,
  CreateGravedadEsaviDto,
  CreateNotificacionDto,
  CreatePacienteDhis2Dto,
  CreatePacienteEmbarazadaDto,
  InvestigacionCreateDto,
  UbicacionDto,
} from '../../integrator/dto';
import {SourceEnum} from '../../integrator/enum/source-enum';
import {IntegradorService} from '../../integrator/facade/integrador.service';
import {
  DuplicateAction,
  DuplicateHandlingConfigDto,
  IData,
  IHeader,
  ProcessingStatus
} from '../dto';
import {Dhis2DuplicateHandlerService} from './dhis2-duplicate-handler.service';
import {Dhis2EventsService} from './dhis2-events.service';
import {Dhis2ProcessingLogService} from './dhis2-processing-log.service';
import {Dhis2ProgramStageService} from './dhis2-program-stage.service';
import {Dhis2ProgramService} from './dhis2-program.service';
@Injectable()
export class Dhis2IntegratorService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly integradorService: IntegradorService,
    private readonly meddraLltService: MeddraLLTService,
    private readonly meddraPtService: MeddraPtService,
    private readonly dhis2ProgramService: Dhis2ProgramService,
    private readonly dhis2ProgramStageService: Dhis2ProgramStageService,
    private readonly dhis2EventsService: Dhis2EventsService,
    private readonly processingLogService: Dhis2ProcessingLogService,
    private readonly duplicateHandlerService: Dhis2DuplicateHandlerService,
  ) {}

  formatoFecha(valor: string): Date | null {
    if (valor && valor.length > 0 && valor !== '') {
      const year = parseInt(valor.substring(0, 4), 10);
      const month = parseInt(valor.substring(4, 6), 10);
      const day = parseInt(valor.substring(6, 8), 10);
      const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  formatoInteger = (valor: string) => {
    let resultado = 0;
    try {
      resultado = parseInt(valor);

      if (isNaN(resultado)) {
        resultado = 0;
      }
    } catch (error:any) {}
    return resultado;
  };

  formatoFloat = (valor: string) => {
    let resultado = 0;
    try {
      resultado = parseFloat(valor);
      if (isNaN(resultado)) {
        resultado = 0;
      }
    } catch (error:any) {}
    return resultado;
  };

  private transformarDosis(dosisTexto: string): number {
    // Diccionario de mapeo
    const mapaDosis: Record<string, number> = {      
      'DOSIS ÚNICA': 0,
      'PRIMERA DOSIS': 1,
      'SEGUNDA DOSIS': 2,
      'TERCERA DOSIS': 3,
      'CUARTA DOSIS': 4,
      'QUINTA DOSIS': 5,
      'PRIMER REFUERZO': 6,      
      'SEGUNDO REFUERZO': 7,
      'REFUERZO ANUAL': 8,
    };  

    if (dosisTexto) {
      // Normalizamos el texto
      const dosis = dosisTexto.trim().toUpperCase();
  
      // Retornamos el valor si existe en el diccionario
      if (mapaDosis[dosis] !== undefined) {
        return mapaDosis[dosis];
      } else {      
        //--------throw new Error(`Valor de dosis no reconocido: ${dosisTexto}`);
        //console.log(`Valor de dosis no reconocido: "${dosisTexto}". Se asignará null.`);
        return null; // return null si no se reconoce el valor
      }
    } else {
      //console.log(`Valor de dosis vacío: "${dosisTexto}". Se asignará null.`);
      return null; // return null si no se reconoce el valor
    }
    
  }
  

  async createInBulk(
    fechaInicio: Date,
    fechaFin: Date,
    codigoATC: string,
    duplicateConfig?: DuplicateHandlingConfigDto,
  ) {
    const loteId = `DHIS2_${Date.now()}_${codigoATC}`;

    try {
      // Log de inicio de importación
      this.processingLogService.logImportStart(
        loteId,
        fechaInicio,
        fechaFin,
        codigoATC,
        0, // Se actualizará cuando se obtengan los datos
        'SYSTEM',
      );

      const data = await this.dhis2EventsService.getEventsReports(
        'NrEU7cRCZd7',
        fechaInicio,
        fechaFin,
      );

      const transformedData = await this.transformDataFromApi(data);
      const totalRegistros = transformedData.rows.length;

      // Actualizar resumen con total de registros
      const summary = this.processingLogService.createProcessingSummary(
        loteId,
        fechaInicio,
        fechaFin,
        codigoATC,
        totalRegistros,
      );

      // Escribir el archivo JSON en la carpeta de test
      const jsonString = JSON.stringify(transformedData, null, 2);
      const filePath = path.join(__dirname, '../test/transformedData-output.json');

      try {
        // Asegurar que el directorio existe
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, jsonString, 'utf8');
      } catch (writeError) {
        console.error('Error writing JSON to file:', writeError);
      }

      // Procesar registros con manejo de duplicados
      await this.extractedFromDHIS2ToPersistWithDuplicateHandling(
        transformedData,
        loteId,
        duplicateConfig,
      );

      // Log de fin de importación
      const finalSummary = this.processingLogService.getProcessingSummary(loteId);
      if (finalSummary) {
        finalSummary.duracionProcesamiento = this.calculateProcessingDuration(summary.fechaInicio);
        this.processingLogService.logImportEnd(loteId, finalSummary, 'SYSTEM');
      }
    } catch (error:any) {
      this.processingLogService.logError(
        loteId,
        'Error durante la importación masiva',
        error.message,
      );
      console.log(error);
      throw error;
    }
  }

  async transformDataFromApi(data): Promise<IData> {
    // Verificar si los datos cumplen con la estructura esperada
    if (!Array.isArray(data.headers) || !Array.isArray(data.rows)) {
      throw new Error('Estructura de datos inesperada');
    }

    // Transformar los headers
    const headers: IHeader[] = data.headers.map((header: any) => ({
      name: header.name,
      column: header.column,
      valueType: header.valueType,
      type: header.type,
      hidden: header.hidden,
      meta: header.meta,
      optionSet: header.optionSet, // Puede ser undefined si no existe
    }));

    // Transformar las rows
    const rows: (string | null)[][] = data.rows.map((row: any[]) =>
      row.map((value) => (value !== '' ? String(value) : null)),
    );

    return { headers, rows };
  }

  revisarValorNulo(profesion: any): string {
    // Si el valor es nulo, indefinido o una cadena vacía, devolver 'DESCONOCIDO'
    if (profesion === null || profesion === undefined || profesion === '') {
      return 'DESCONOCIDO';
    } else {
      return profesion;
    }
  }

  obtenerValorNumerico(valor: string): number {
    // Normalizamos el valor a minúsculas para no depender de mayúsculas/minúsculas
    const normalizedValue = valor ? valor.toLowerCase().trim() : '';

    switch (normalizedValue) {
      case 'si':
        return 1; // Si es 'SI'
      case 'no':
        return 0; // Si es 'NO'
      case 'no sabe':
      case 'ignorando':
      case 'desconoce':
        return 2; // Si es 'NO SABE', 'IGNORADO' o 'DESCONOCE'
      default:
        return 2; // Si no se encuentra en los valores conocidos, consideramos '3' (como un valor por defecto)
    }
  }

  /*obtenerValorBooleano(valor: string): boolean {
    const normalizedValue = valor ? valor.toLowerCase().trim() : '';
    return normalizedValue === 'si';
  }*/ //antecedenteDiagnosticoCovid19 No puede ser booleano porque en el origen hay 3 valores: SI, NO, SIN DATO

  //Este método se utiliza para separar el código de CIE-10 y la descripción
  // Ejemplo: "A00 Cólera" => { codigo: "A00", descripcion: "Cólera" }
  // El valor en el elemento de datos es una cadena de texto que contiene un código seguido de una descripción.
  separarCodigoYDescripcion(texto: string | null | undefined): {
    codigo: string;
    descripcion: string;
  } {
    try {
      // Verificamos si el texto es null o undefined antes de proceder
      if (!texto) {
        return { codigo: '', descripcion: '' }; // Si es null, undefined o vacío, no hacemos nada y devolvemos vacío.
      }

      const regex = /^([A-Za-z0-9]+)\s*(.*)$/; // Expresión regular para detectar el código y el resto del texto
      const match = texto.trim().match(regex);

      if (match) {
        return {
          codigo: match[1], // Primer grupo: el código (letras, números o ambos)
          descripcion: match[2].trim(), // Segundo grupo: la descripción (el resto del texto)
        };
      } else {
        return {
          codigo: '', // Si no hay coincidencia, devolvemos vacío
          descripcion: texto.trim(), // El texto completo como descripción
        };
      }
    } catch (error:any) {
      console.error('Error al procesar el texto:', error);
      return { codigo: '', descripcion: '' }; // En caso de error, devolvemos valores vacíos
    }
  }

  esValorAfirmativo(valor: string): boolean {
    return valor === '1';
  }

  transformarTipoSoloSiDhis2(tipoTexto: string): string {
    return ( tipoTexto === '1' )? '1' : '0' ;
  }

  transformarBooleanoSiNoDhis2(valor: string): string | null{
    return ( valor ) ? valor.toString() :  null ;
  }

  ajustarFecha = (fecha, dias) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    return nuevaFecha;
  };

  obtenerClasificacion(
    clasificacionFinalCaso: string,
    clasificacionFinalSubcategoria?: string
  ): string {
    switch (clasificacionFinalCaso) {
      case "A. Con asociación causal congruente con la vacuna o con el proceso de vacunación":
        switch (clasificacionFinalSubcategoria) {
          case "A1. Evento relacionado con la vacuna o cualquiera de sus componentes":
            return "A1 -- Evento relacionado con la vacuna o cualquiera de sus componentes";
          case "A2. Evento relacionado con una desviación de calidad de la vacuna":
            return "A2 -- Evento relacionado con una desviación de calidad del producto biológico o la vacuna";
          case "A3. Evento relacionado con un error programático":
            return "A3 -- Evento relacionado con un error programático";
          case "A4 -- Evento por estrés que tuvo lugar inmediatamente antes, durante o inmediatamente después del proceso de vacunación":
            return "A4 -- Evento por estrés que tuvo lugar inmediatamente antes, durante o inmediatamente después del proceso de vacunación";
          default:
            return "Clasificación A -- Subcategoría no reconocida";
        }
  
      case "B. Indeterminado":
        switch (clasificacionFinalSubcategoria) {
          case "B1. La relación temporal es congruente, pero no hay suficiente evidencia definitiva para asignar la causalidad a la vacuna":
            return "B1 -- La relación temporal es congruente, pero no hay evidencia definitiva suficiente sobre una relación causal con la vacuna (posible señal)";
          case "B2. Factores determinantes para la clasificación muestran tendencias conflictivas a favor y en contra de una asociación causal con la vacunación":
            return "B2 -- Factores determinantes muestran tendencias conflictivas a favor y en contra de una asociación causal con la vacunación";
          default:
            return "Clasificación B -- Subcategoría no reconocida";
        }
  
      case "C. Sin asociación causal congruente con la vacuna o la vacunación (evento coincidente)":
        return "C -- Causa coincidente";
  
      case "D. No clasificable":
        return "D -- No clasificable";
  
      default:
        return "Clasificación no reconocida";
    }
  }
  

  /**
   * Procesa registros con manejo de duplicados
   */
  extractedFromDHIS2ToPersistWithDuplicateHandling = async (
    data: IData,
    loteId: string,
    duplicateConfig?: DuplicateHandlingConfigDto,
  ) => {
    const config = duplicateConfig || {
      accionPorDefecto: DuplicateAction.ASK_CONFIRMATION,
      confirmarAntesDeProcesar: true,
      logDetallado: true,
    };

    let registrosProcesados = 0;
    let registrosDuplicados = 0;
    let registrosActualizados = 0;
    let registrosOmitidos = 0;
    let registrosConError = 0;

    for (const row of data.rows) {
      try {
        const create = await this.buildCreateCompleteDto(row, data.headers);

        if (!create.notificacion.codigoDhis2Evento) {
          this.processingLogService.logRecordProcessing(
            loteId,
            'SIN_CODIGO',
            create.pacienteDhis2?.identificacion || 'DESCONOCIDO',
            ProcessingStatus.ERROR,
            'Registro sin código DHIS2, omitiendo',
            'Código DHIS2 requerido para procesamiento',
          );
          registrosConError++;
          continue;
        }

        // Detectar duplicados
        const duplicateCheck = await this.duplicateHandlerService.detectDuplicate(
          create.notificacion.codigoDhis2Evento,
          create.pacienteDhis2.identificacion,
          loteId,
        );

        if (duplicateCheck.isDuplicate) {
          registrosDuplicados++;

          const duplicateRecord = {
            codigoDhis2Evento: create.notificacion.codigoDhis2Evento,
            identificacionPaciente: create.pacienteDhis2.identificacion,
            fechaNotificacion: create.notificacion.fechaNotificacion?.toISOString() || '',
            motivoDuplicado: duplicateCheck.reason,
            datosExistentes: JSON.stringify(duplicateCheck.existingRecord),
            datosNuevos: JSON.stringify(create),
          };

          const duplicateResult = await this.duplicateHandlerService.handleDuplicate(
            duplicateRecord,
            create,
            loteId,
            config,
          );

          if (duplicateResult.procesado) {
            if (
              duplicateResult.accionTomada === DuplicateAction.UPDATE_INDIVIDUAL ||
              duplicateResult.accionTomada === DuplicateAction.UPDATE_ALL
            ) {
              registrosActualizados++;
            } else {
              registrosOmitidos++;
            }
          } else {
            registrosConError++;
          }
        } else {
          // Procesar registro nuevo
          await this.integradorService.create(create);
          registrosProcesados++;

          this.processingLogService.logRecordProcessing(
            loteId,
            create.notificacion.codigoDhis2Evento,
            create.pacienteDhis2.identificacion,
            ProcessingStatus.SUCCESS,
            'Registro procesado exitosamente',
          );
        }
      } catch (error:any) {
        registrosConError++;
        this.processingLogService.logError(
          loteId,
          `Error procesando registro: ${error.message}`,
          error.message,
          'DESCONOCIDO',
          'DESCONOCIDO',
        );
      }
    }

    // Actualizar resumen
    this.processingLogService.updateProcessingSummary(loteId, {
      registrosProcesados,
      registrosDuplicados,
      registrosActualizados,
      registrosOmitidos,
      registrosConError,
    });
  };

  /**
   * Construye el DTO completo para un registro
   */
  private async buildCreateCompleteDto(row: any[], headers: any[]): Promise<CreateCompleteDto> {
    // Create Paciente
    const semanasEmbarazo = 43;//= 42; //entre 1 y 43: cambio solicitado por el personal funcional.
    const paciente = new CreatePacienteDhis2Dto();
    paciente.identificacion =
      row[headers.findIndex((header) => header.column === 'Nro. de identificación')];
    paciente.sexoPaciente = row[headers.findIndex((header) => header.column === 'Sexo')];
    paciente.codigoDhis2 =
      row[headers.findIndex((header) => header.column === 'Nro. de identificación')];
    paciente.autoIdentificacionPaciente =
      row[headers.findIndex((header) => header.column === 'Autoidentificación')];
    const nombre = row[headers.findIndex((header) => header.column === 'Nombres')];
    const apellido = row[headers.findIndex((header) => header.column === 'Apellidos')];
    paciente.nombre = `${nombre} ${apellido}`;

    // Create Notificacion
    const notificacion = new CreateNotificacionDto();
    notificacion.medioNotificacion = 'Medio electrónico DHIS2';	
    notificacion.fechaNacimiento = this.formatoFecha(
      row[headers.findIndex((header) => header.column === 'Fecha de nacimiento')],
    );
    // Para no repetir la extracción de fechaNacimiento, solo se asigna el valor de notificacion a paciente.
    paciente.fechaNacimiento = notificacion.fechaNacimiento;

    // La edad ya es otra variable independiente en la extracción.
    const edad = this.formatoInteger(
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Edad')],
    );
    const unidadEdad =
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Tipo edad')];

    if( (edad > 0 && edad < 121) && (edad && unidadEdad) ){
      notificacion.edad= edad;
      notificacion.unidadEdadPaciente= unidadEdad;
    } else { // si ocurre esto, se intenta calcular en base a la fecha de nacimiento y la fecha de notificación, pero, en "notificacion-dhis2.service.ts"
      notificacion.edad = null;
      notificacion.unidadEdadPaciente = null;
    }

    notificacion.organizacionNotificador =
      row[headers.findIndex((header) => header.column === 'Organisation unit name')];
    notificacion.organizacionUnitCode =
      row[headers.findIndex((header) => header.column === 'Organisation unit code')];
    notificacion.organizacionUnit =
      row[headers.findIndex((header) => header.column === 'Organisation unit')];
    notificacion.codigoDhis2Evento =
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Código del caso')];
    notificacion.fechaNotificacion = this.formatoFecha(
      row[headers.findIndex((header) => header.column === 'Fecha de notificación')],
    );
    notificacion.fechaReporteNacional = this.formatoFecha(
      row[headers.findIndex((header) => header.column === 'Fecha de notificación')],
    );// Se acoge la recomendción del personal funcional, pero, los valores quedan duplicados con el campo FECHA_NOTIFICACION.
    notificacion.tipoEmisor = 'Profesional de la salud';
    
    notificacion.fechaAtencion = this.formatoFecha(
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Fecha de atención')],
    );
    notificacion.fechaLlenadoFicha = this.formatoFecha(
      row[headers.findIndex((header) => header.column === 'Incident date')],
    );

    // Ubicacion residencia paciente
    const ubicacionResidencia = new UbicacionDto();
    ubicacionResidencia.provincia =
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Provincia residencia')];
    ubicacionResidencia.canton =
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Canton residencia')];
    ubicacionResidencia.parroquia =
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Parroquia residencia')];
    notificacion.residenciaPaciente = ubicacionResidencia;


    notificacion.nombreNotificador = 
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Nombre de quien notifica',
        )
      ],
    // Profesion quien notifica. Si es nulo, asignar 'DESCONOCIDO'
    notificacion.profesionNotificadorParam = this.revisarValorNulo(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Profesión de quien notifica',
        )
      ],
    );

    // Presenta eventos adversos
    const antecedenteEventoPrevio = this.obtenerValorNumerico(
      row[
        headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Evento adverso anterior')
      ],
    );
    notificacion.antecedenteEventoPrevio = antecedenteEventoPrevio;

    // Tiene antecedente vacunal
    const antecedenteVacunal = this.obtenerValorNumerico(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Tiene antecedente vacunal',
        )
      ],
    );

    // Establecimiento de salud
    notificacion.codigoUnidadSalud =
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Unicódigo')];
    notificacion.monitorioEstablecimientoSalud = this.obtenerValorNumerico(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Monitoreo del establecimiento de salud',
        )
      ],
    );
    notificacion.antecedenteVacunal = antecedenteVacunal;

    // Caso Narrativo - Observaciones
    notificacion.casoNarrativo =
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Observaciones')];

    // Create Antecedente Medico: TR_ANTECEDENTES_MEDICO
    const antecedenteMedico = new CreateAntecedenteMedicoDto();
    antecedenteMedico.ensayoClinicoCovid19 = 
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - ¿Estaba participando o participa la persona vacunada en un ensayo clínico de vacunas contra la COVID-19?',
        )
      ]
    ;// En el origen es tipo BOOLEANO, dhis2 ya entrega de forma preestablecida true=1, false=0 (valores numéricos en tipo texto). Si no está marcada ninguna opción entrega NULL.
    const comorbilidadPrincipal = this.separarCodigoYDescripcion(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Especificar la comorbilidad 1',
        )
      ],
    );
    antecedenteMedico.comorbilidadPrincipalCIE10 = comorbilidadPrincipal.codigo;
    antecedenteMedico.descripcionPrincipal = comorbilidadPrincipal.descripcion;
    const comorbilidadDos = this.separarCodigoYDescripcion(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Especificar la comorbilidad 2',
        )
      ],
    );
    antecedenteMedico.comorbilidadDosCIE10 = comorbilidadDos.codigo;
    antecedenteMedico.descripcionDos = comorbilidadDos.descripcion;
    const comorbilidadTres = this.separarCodigoYDescripcion(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Especificar la comorbilidad 3',
        )
      ],
    );
    antecedenteMedico.comorbilidadTresCIE10 = comorbilidadTres.codigo;
    antecedenteMedico.descripcionTres = comorbilidadTres.descripcion;
    //DNVE ESAVI TRK - ¿Tiene antecedentes de diagnóstico de infección por SARS-CoV-2 antes de la vacunación?
    const tieneAntecedenteDxInfeccSarsCov2AntesVacuna =
      row[
        headers.findIndex(
          (header) =>
            header.column ===
            'DNVE ESAVI TRK - ¿Tiene antecedentes de diagnóstico de infección por SARS-CoV-2 antes de la vacunación?',
        )
      ];
    antecedenteMedico.antecedenteDiagnosticoCovid19 = tieneAntecedenteDxInfeccSarsCov2AntesVacuna;

    // Create Antecedente evento adverso
    const antecedenteEventoAdverso = new CreateAntecedenteEventoDto();
    antecedenteEventoAdverso.antecedente = this.obtenerValorNumerico(
      row[
        headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Evento adverso anterior')
      ],
    ); // En notificacion ya está este campo como antecedenteEventoPrevio. Pero, se conserva hasta pedir confirmación.
    antecedenteEventoAdverso.alergiaMedicamento = this.esValorAfirmativo(
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Alergia Medicamentos')],
    );

    antecedenteEventoAdverso.alergiaAlimentos = this.esValorAfirmativo(
      row[
        headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Alergia Alimentos')
      ],
    );
    antecedenteEventoAdverso.alergiaInsectos = this.esValorAfirmativo(
      row[
        headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Alergia Insectos')
      ],
    );// dhis2 entrega 1 si el cuadro de check está marcado, y null si no lo está.
    antecedenteEventoAdverso.alergiaPolvo = this.esValorAfirmativo(
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Alergia Polvo')],
    );
    antecedenteEventoAdverso.otrasAlergias =
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Otro Alergias')];

    // Create AntecedenteEnfermedadesPrevias //tabla: 'TR_ANTECEDENTES_ENFERMEDADES_PREVIAS'
    const antecedentePreexistencia = new CreateAntecedentePreexistenciaDto();
    const antecedentePrevio = this.separarCodigoYDescripcion(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Antecedente patológico personal 1',
        )
      ],
    );
    antecedentePreexistencia.codigoEsaviCIE10 = antecedentePrevio.codigo;
    antecedentePreexistencia.descripcion = antecedentePrevio.descripcion;
    if (antecedentePrevio.descripcion) {
      const lltEncontrado = await this.meddraLltService.buscarPorSimilitud(antecedentePrevio.descripcion);
      antecedentePreexistencia.ctLltMeddraId = lltEncontrado?.id ?? null;
    }

    // Create Causalidad Esavi
    const causalidadEsavi = new CreateCausalidadEsaviDto();
    // Implementación temporal, mientras se revisa la Relación entre tablas.
    const cantDxFinales=3;
    for(let i=1; i<=cantDxFinales; i++){
      const diagnosticoFinal = this.separarCodigoYDescripcion(
        row[
          headers.findIndex(
            (header) =>
              header.column === `DNVE ESAVI TRK - Diagnostico final ${i}`, //`DNVE ESAVI TRK - Diagnostico final ${i}`
          )
        ],
      );
      /*if(i===1){
        causalidadEsavi.codigoCie10DxFinal1 = diagnosisFinal.codigo;
      } else if(i===2){
        causalidadEsavi.codigoCie10DxFinal2 = diagnosisFinal.codigo;
      } else if(i===3){
        causalidadEsavi.codigoCie10DxFinal3 = diagnosisFinal.codigo;
      }*/
     
     if(  diagnosticoFinal.codigo && diagnosticoFinal.descripcion ){//Si ambos valores están presentes, se asigna el código.){
      causalidadEsavi[`codigoCie10DxFinal${i}` as keyof CausalidadEsavi] = diagnosticoFinal.codigo; //Usando indexación de tipo para asignar dinámicamente. //El keyof no es "CreateCausalidadEsaviDto" pero, es para 
     }
    }

    //---fin de implementación temporal.
    causalidadEsavi.clasificacionCausaEsavi = 
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Caso analizado por comité ESAVI?',
        )
      ];
    //PROCESO para determinar una clasificación de causalidad WHO-AEFI, de todas las 8 posibles combinaciones.
    if(causalidadEsavi.clasificacionCausaEsavi){
      const clasificacionFinalCaso =
        row[
          headers.findIndex(
            (header) =>
              header.column ===
              'DNVE ESAVI TRK - Clasificación final del caso',
          )
        ];
      let clasificacionFinalSubcategoria ='';
      if (clasificacionFinalCaso === 'A. Con asociación causal congruente con la vacuna o con el proceso de vacunación' ){
        clasificacionFinalSubcategoria = 
          row[
            headers.findIndex(
              (header) =>
                header.column ===
                'DNVE ESAVI TRK - Clasificación final del caso A',
            )
          ];
      } else if(clasificacionFinalCaso === 'B. Indeterminado'){
        clasificacionFinalSubcategoria = 
          row[
            headers.findIndex(
              (header) =>
                header.column ===
                'DNVE ESAVI TRK - Clasificación final del caso B',
            )
          ];
      } else {
        clasificacionFinalSubcategoria = '';
      }
      causalidadEsavi.clasificacionCausalidadWHOAEFI = this.obtenerClasificacion(clasificacionFinalCaso, clasificacionFinalSubcategoria);
    }

    causalidadEsavi.fechaCausalidadEsavi = this.formatoFecha(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Fecha cierre del evento',
        )
      ],
      // 'YYYY-MM-DDTHH:mm:ss.sssZ'
    );


    // Create Gravedad
    const grave = new CreateGravedadEsaviDto();
    grave.tipo = '1';//'GRAVE';
    grave.riesgoVida = this.transformarTipoSoloSiDhis2(//this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) =>
            header.column === 'DNVE ESAVI TRK - Criterio de notificación - amenaza a la vida',
        )
      ],
    );
    grave.discapacidad = this.transformarTipoSoloSiDhis2(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Criterio de notificación - discapacidad',
        )
      ],
    );
    grave.hospitalizacion = this.transformarTipoSoloSiDhis2(
      row[
        headers.findIndex(
          (header) =>
            header.column === 'DNVE ESAVI TRK - Criterio de notificación - hospitalización',
        )
      ],
    ); //---después de esto va la CORRECCIÓN:
    grave.anomaliaCongenita = this.transformarTipoSoloSiDhis2(
      row[
        headers.findIndex(
          (header) =>
            header.column === 'DNVE ESAVI TRK - Criterio de notificación - anomalía congénita',
        )
      ],
    );
    grave.aborto = this.transformarTipoSoloSiDhis2(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Criterio de notificación - aborto',
        )
      ],
    );
    grave.muerteFetal = this.transformarTipoSoloSiDhis2(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Criterio de notificación - muerte fetal',
        )
      ],
    );
    grave.muerte = this.transformarTipoSoloSiDhis2(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Criterio de notificación - muerte',
        )
      ],
    );
    grave.parteEventosPreocupacion = this.transformarTipoSoloSiDhis2(
      row[
        headers.findIndex(
          (header) =>
            header.column ===
            'DNVE ESAVI TRK - Criterio de investigación - parte de eventos preocupación',
        )
      ],
    );
    grave.sonEventosNuevos = this.transformarTipoSoloSiDhis2(
      row[
        headers.findIndex(
          (header) =>
            header.column === 'DNVE ESAVI TRK - Criterio de investigación - nuevos eventos',
        )
      ],
    );
    if(grave.sonEventosNuevos){
      grave.descripcionEventoNuevo = 
        row[
          headers.findIndex(
            (header) =>
              header.column === 'DNVE ESAVI TRK - Evento nuevo - notificación',
          )
        ];
    }
    grave.condicionEgreso =
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Condición de egreso')];

    // Define Desenlace esavi
    const desenlaceEsavi = new CreateDesenlaceEsaviDto();
    desenlaceEsavi.autopsia = this.obtenerValorNumerico(
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Se realizó autopsia')],
    );
    desenlaceEsavi.fechaMuerte = this.formatoFecha(
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Fecha fallecimiento')],
    );
    if(grave.muerteFetal){
      desenlaceEsavi.fechaNotififacionMuerteFetal =
        notificacion.fechaNotificacion ? notificacion.fechaNotificacion : null; //'FECHANOTIFICAMUERTEFETAL';
    }
    desenlaceEsavi.fechaInicioInvestigacion = this.formatoFecha(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Fecha de investigación',
        )
      ],
    );
    desenlaceEsavi.clasificacionFinalCaso =
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Clasificación final del caso',
        )
      ];
    desenlaceEsavi.clasificacionFinalCasoA =
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Clasificación final del caso A',
        )
      ];
    desenlaceEsavi.clasificacionFinalCasoB =
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Clasificación final del caso B',
        )
      ];

    // DatoEsavi -- Diagnóstico inicial
    const numeroIncidencias = 3;
    const datoEsavis: CreateDatoEsaviDto[] = [];

    for (let i = 1; i <= numeroIncidencias; i++) {
      const dato = this.separarCodigoYDescripcion(
        row[
          headers.findIndex(
            (header) => header.column === `DNVE ESAVI TRK - Diagnóstico inicial ${i}`,
          )
        ],
      );
      const fechaInicio =
          row[
            headers.findIndex(
              (h) => h.column === 'DNVE ESAVI TRK - Fecha de inicio de síntomas del ESAVI',
            )
          ]?.split(' ')[0];
        const horaInicio =
          row[
            headers.findIndex(
              (h) => h.column === 'DNVE ESAVI TRK - Hora de Inicio de síntomas del ESAVI',
            )
          ];
        const fechaEsavi =
          fechaInicio && horaInicio ? new Date(`${fechaInicio}T${horaInicio}:00Z`) : null;

        // Verifica que nombre y código no estén vacíos
      if (dato.descripcion && dato.codigo) {
        const datoEsaviInicial = new CreateDatoEsaviDto();
        datoEsaviInicial.nombre = dato.descripcion;
        datoEsaviInicial.codigoEsaviCie10 = dato.codigo;
        datoEsaviInicial.fechaEsavi = fechaEsavi;
        datoEsaviInicial.descripcion = `Diagnóstico inicial DHIS2 ${i}`;
        datoEsaviInicial.codigoCaso = notificacion.codigoDhis2Evento;
        datoEsavis.push(datoEsaviInicial);
      }
    }

    // DatoEsavi -- Diagnóstico final
    for (let i = 1; i <= numeroIncidencias; i++) {
      const dato = this.separarCodigoYDescripcion(
        row[
          headers.findIndex(
            (header) => header.column === `DNVE ESAVI TRK - Diagnostico final ${i}`,
          )
        ],
      );
      const fechaInicio =
        row[
          headers.findIndex(
            (h) => h.column === 'DNVE ESAVI TRK - Fecha de inicio de síntomas del ESAVI',
          )
        ]?.split(' ')[0];
      const horaInicio =
        row[
          headers.findIndex(
            (h) => h.column === 'DNVE ESAVI TRK - Hora de Inicio de síntomas del ESAVI',
          )
        ];
      const fechaEsavi =
        fechaInicio && horaInicio ? new Date(`${fechaInicio}T${horaInicio}:00Z`) : null;

      // Verifica que nombre y código no estén vacíos      
        if (dato.descripcion && dato.codigo) {
          const datoEsaviFinal = new CreateDatoEsaviDto();
          datoEsaviFinal.nombre = dato.descripcion;
          datoEsaviFinal.codigoEsaviCie10 = dato.codigo;
          datoEsaviFinal.fechaEsavi = fechaEsavi;
          datoEsaviFinal.descripcion = `Diagnóstico final DHIS2 ${i}`;
          datoEsaviFinal.codigoCaso = notificacion.codigoDhis2Evento;
  
          datoEsavis.push(datoEsaviFinal);
        }
    }
    //console.log('DtaoooEsaviiiiii:::', datoEsavis);


    // DatoEsavi -- Sintomatología 1-5 ------------------------------------------------------
    const numeroSintomatologias = 5;
    //const datoEsavisSint: CreateDatoEsaviDto[] = [];

    for (let i = 1; i <= numeroSintomatologias; i++) {
      const setOpciones = 
        row[
          headers.findIndex(
            (header) => header.column === `DNVE ESAVI TRK - Sintomatología ${i}`,
          )
        ];
      if (setOpciones) {
        const datoEsaviSintomatologiai = new CreateDatoEsaviDto();
        datoEsaviSintomatologiai.nombreReportado = setOpciones;
        
        datoEsaviSintomatologiai.fechaEsavi = this.formatoFecha(
          row[
            headers.findIndex(
              (h) => h.column === 'DNVE ESAVI TRK - Fecha de inicio de síntomas del ESAVI',
            )
          ]?.split(' ')[0],
        );
        datoEsaviSintomatologiai.descripcion = `Sintomatología DHIS2 ${i}`;
        datoEsaviSintomatologiai.codigoCaso = notificacion.codigoDhis2Evento;

        datoEsavis.push(datoEsaviSintomatologiai); //agregar al array principal
      }
    }
    // DatoEsavi -- Sintomatología    O t r o   ---------
    const setOpcionesOtro = 
        row[
          headers.findIndex(
            (header) => header.column === `DNVE ESAVI TRK - Sintomatología Otro`,
          )
        ];
      if (setOpcionesOtro) {
        const datoEsaviSintomatologiaOtro = new CreateDatoEsaviDto();
        datoEsaviSintomatologiaOtro.nombreReportado = setOpcionesOtro;
        datoEsaviSintomatologiaOtro.fechaEsavi = this.formatoFecha(
          row[
            headers.findIndex(
              (h) => h.column === 'DNVE ESAVI TRK - Fecha de inicio de síntomas del ESAVI',
            )
          ]?.split(' ')[0],
        );
        datoEsaviSintomatologiaOtro.descripcion = `Sintomatología Otro DHIS2`;
        datoEsaviSintomatologiaOtro.codigoCaso = notificacion.codigoDhis2Evento;
        datoEsavis.push(datoEsaviSintomatologiaOtro);
      }

    // Dato V-a-c-u-n-a-c-i-ó-n------------------------------------------------------
    const numeroAntecedenteVacunal = 5;
    const datoVacunaciones: CreateDatoVacunacionDto[] = [];

    for (let i = 1; i <= numeroAntecedenteVacunal; i++) {
      // TODO: colocar auditoria correcta
            const auditoria: IAuditoria = {
              createdAt: new Date(),
              createdBy: 'System',
              updatedAt: undefined,
              updatedBy: 'System',
              deletedAt: undefined,
              deletedBy: 'System',
              isEnabled: true,
              isActive: true,
            };
      //const datoVacuna = new CreateDatoVacunaDto();
      // Datos Lugar vacunacion
      let datoVacunacion = new CreateDatoVacunacionDto();
      datoVacunacion = {...datoVacunacion, ...auditoria};
      datoVacunacion.nombreVacunatorio =
        row[
          headers.findIndex(
            (header) =>
              header.column ===
              `DNVE ESAVI TRK - Establecimiento de salud donde recibió la vacuna ${i}`,
          )
      ];
      datoVacunacion.fechaReconstitucion = this.formatoFecha(
        row[
           headers.findIndex(
            (header) =>
              header.column ===
              `DNVE ESAVI TRK - Fecha de la dilución vacuna ${i}`,
          )
        ],
      );
      datoVacunacion.fechaVacunacion = this.formatoFecha(
        row[
           headers.findIndex(
            (header) =>
              header.column ===
              `DNVE ESAVI TRK - Fecha de vacunación vacuna ${i}`,
          )
        ],
      );

      if(
        datoVacunacion.nombreVacunatorio ||
        datoVacunacion.fechaReconstitucion ||
        datoVacunacion.fechaVacunacion
      ){
        datoVacunaciones.push(datoVacunacion);
      }
    }    

    // Paciente embarazada
    const embarazada = new CreatePacienteEmbarazadaDto();
    const embarazadaMomentoVacuna =
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Semanas gestación al recibir la vacuna',
        )
      ];
    embarazada.momentoVacuna = embarazadaMomentoVacuna ? '1' : '0';//true : false;
    embarazada.momentoEsavi = //this.esValorAfirmativo(
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Embarazada')]//,
    ;//).toString();

    // Antecedentes embarazo
    const antecedenteEmbarazada = new CreateAntecedenteEmbarazoDto();
    const semanaGestacion =
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Semanas gestación al recibir la vacuna',
        )
      ];
    antecedenteEmbarazada.edadGestacional = semanaGestacion ? Number(semanaGestacion) : null;
    if (antecedenteEmbarazada.edadGestacional && notificacion.fechaAtencion) {
      antecedenteEmbarazada.fechaUltimaMenstruacion = this.ajustarFecha(
        notificacion.fechaAtencion,
        -antecedenteEmbarazada.edadGestacional * 7,
      ); // La constante 7 es número de días en una semana.
      antecedenteEmbarazada.fechaParto = this.ajustarFecha(
        antecedenteEmbarazada.fechaUltimaMenstruacion,
        semanasEmbarazo * 7,
      );
    }

    // Dato Vacuna
    const numeroVacunas = 5;
    const datoVacunas: CreateDatoVacunaDto[] = [];

    for (let i = 1; i <= numeroVacunas; i++) {
      const datoVacuna = new CreateDatoVacunaDto();
      datoVacuna.drugName =
        row[
          headers.findIndex(
            (header) => header.column === `DNVE ESAVI TRK - Antecedente vacuna ${i}`,
          )
        ];        
      datoVacuna.numeroDosisVacuna = this.transformarDosis(
        row[
          headers.findIndex(
            (header) => header.column === `DNVE ESAVI TRK - Dosis de la vacuna ${i}`,
          )
        ],
      );
      datoVacuna.nombreFabricante =
        row[
          headers.findIndex(
            (header) => header.column === `DNVE ESAVI TRK - Casa comercial vacuna ${i}`,
          )
        ];
      datoVacuna.numeroLote =
        row[
          headers.findIndex((header) => header.column === `DNVE ESAVI TRK - Lote de la vacuna ${i}`)
        ];
      datoVacuna.fechaVencimientoVacuna = this.formatoFecha(
        row[
          headers.findIndex(
            (header) => header.column === `DNVE ESAVI TRK - Fecha de caducidad de la vacuna ${i}`,
          )
        ],
      );
      datoVacuna.viaAdministracion =
        row[
          headers.findIndex(
            (header) => header.column === `DNVE ESAVI TRK - Vía de aplicación vacuna ${i}`,
          )
        ];
      datoVacuna.fechaVencimientoDiluyente = this.formatoFecha(
        row[
          headers.findIndex(
            (header) =>
              header.column === `DNVE ESAVI TRK - Fecha de expiración del diluyente vacuna ${i}`,
          )
        ],
      );
      datoVacuna.nombreDiluyenteVacuna =
        row[
          headers.findIndex(
            (header) =>
              header.column === `DNVE ESAVI TRK - Nombre del diluyente usado vacuna ${i}`,
          )
        ];
      datoVacuna.rolVacuna =
        row[
          headers.findIndex(
            (header) => header.column === `DNVE ESAVI TRK - Es sospechosa vacuna ${i}`,
          )
        ];
      // inicioAdministracion se gestiona desde DatoVacunacion (movido del DTO de vacuna)

      if (
        datoVacuna.drugName ||
        datoVacuna.nombreFabricante ||
        datoVacuna.numeroLote ||
        datoVacuna.fechaVencimientoVacuna ||
        datoVacuna.viaAdministracion ||
        datoVacuna.fechaVencimientoDiluyente ||
        datoVacuna.nombreDiluyenteVacuna
      ) {
        datoVacunas.push(datoVacuna);
      }
    }

    //-------TR_INVESTIGACION
    const investigacion = new InvestigacionCreateDto();
    investigacion.fechaInvestigacion = this.formatoFecha(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Fecha en que se termina la investigación',
        )
      ],
    );
    //column: DNVE ESAVI TRK - El vacunatorio cumple con los estándares de calidad. Utilizar el método this.esAfirmativo
    investigacion.vacunatorioCalidad = this.transformarBooleanoSiNoDhis2(
      row[
        headers.findIndex(
          (header) =>
            header.column ===
            'DNVE ESAVI TRK - El vacunatorio cumple con los estándares de calidad',
        )
      ],
    );// En DHIS2 para los tipos booleanos la API Anlytics devuelve '1' o '0' como string. Pero, recordar que toString no funciona con null o undefined.
     
    //column: DNVE ESAVI TRK - El personal de salud está capacitado en inmunizaciones. Utilizar el método this.esAfirmativo
    investigacion.personalCapacitado = this.transformarBooleanoSiNoDhis2( 
      row[
        headers.findIndex(
          (header) =>
            header.column ===
            'DNVE ESAVI TRK - El personal de salud está capacitado en inmunizaciones',
        )
      ],
    );// En DHIS2 para los tipos booleanos la API Anlytics devuelve '1' o '0' como string. Pero, recordar que toString no funciona con null o undefined.
     
    //column: DNVE ESAVI TRK - Evidenció algún problema en el biológico. Utilizar el método this.esAfirmativo
    investigacion.problemaBiologico = this.transformarBooleanoSiNoDhis2(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Evidenció algún problema en el biológico',
        )
      ],
    );// En DHIS2 para los tipos booleanos la API Anlytics devuelve '1' o '0' como string. Pero, recordar que toString no funciona con null o undefined.
    
    //column: DNVE ESAVI TRK - Se realizó búsqueda de casos con similar sintomatología y que recibió la vacuna. Utilizar el método this.esAfirmativo
    investigacion.busquedaCasosSintomatologiaConVacuna = this.transformarBooleanoSiNoDhis2(
      row[
        headers.findIndex(
          (header) =>
            header.column ===
            'DNVE ESAVI TRK - Se realizó búsqueda de casos con similar sintomatología y que recibió la vacuna',
        )
      ],
    );// En DHIS2 para los tipos booleanos la API Anlytics devuelve '1' o '0' como string. Pero, recordar que toString no funciona con null o undefined.

    //column: DNVE ESAVI TRK - Se realizó búsqueda de casos con similar sintomatología sin antecedente de la vacuna. Utilizar el método this.esAfirmativo
    investigacion.busquedaCasosSintomatologiaSinVacuna = this.transformarBooleanoSiNoDhis2(
      row[
        headers.findIndex(
          (header) =>
            header.column ===
            'DNVE ESAVI TRK - Se realizó búsqueda de casos con similar sintomatología sin antecedente de la vacuna',
        )
      ],
    );// En DHIS2 para los tipos booleanos la API Anlytics devuelve '1' o '0' como string. Pero, recordar que toString no funciona con null o undefined.
    
    //column: DNVE ESAVI TRK - Muestra de Laboratorio. Utilizar el método this.esAfirmativo
    investigacion.muestraLaboratorio = this.transformarBooleanoSiNoDhis2(
      row[
        headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Muestra de Laboratorio')
      ],
    );// En DHIS2 para los tipos booleanos la API Anlytics devuelve '1' o '0' como string. Pero, recordar que toString no funciona con null o undefined.

    // Complete the dto
    const create = new CreateCompleteDto();
    create.source = SourceEnum.DHIS2;
    create.pacienteDhis2 = paciente;
    create.notificacion = notificacion;
    create.datoEsavi = datoEsavis;
    create.datoVacunacion = datoVacunaciones;
    create.datoVacuna = datoVacunas;
    create.gravedadEsavi = grave;
    create.desenlaceEsavi = desenlaceEsavi;
    if (antecedentePreexistencia.descripcion) {
      create.antecedentePreexistencia = antecedentePreexistencia;
    }

    //investigacion.datoEsaviId= datoEsavis.id;
    create.investigacion = investigacion;

    //Validar para crear
    if (embarazada.momentoEsavi) {
      create.pacienteEmbarazada = embarazada;
      create.antecedenteEmbarazo = antecedenteEmbarazada;
    }

    if (
      antecedenteMedico.descripcionPrincipal &&
      antecedenteMedico.descripcionPrincipal.length > 0
    ) {
      create.antecedenteMedico = antecedenteMedico;
    }
    create.antecedenteEvento = antecedenteEventoAdverso;
    
    if (causalidadEsavi) {
      create.causalidadEsavi = causalidadEsavi;
    }

    return create;
  }

  /**
   * Calcula la duración del procesamiento
   */
  private calculateProcessingDuration(startTime: string): string {
    const start = new Date(startTime);
    const end = new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);
    return `${diffMinutes}m ${diffSeconds}s`;
  }
}
