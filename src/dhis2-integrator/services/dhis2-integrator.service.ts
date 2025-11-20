import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worksheet } from 'exceljs';
import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';
import { CreateAntecedenteEmbarazoDto } from 'src/integrator/dto/create-antecedente-embarazo.dto';
import { CreateAntecedenteEventoDto } from 'src/integrator/dto/create-antecedente-evento.dto';
import { CreateAntecedenteMedicoDto } from 'src/integrator/dto/create-antecedente-medico.dto';
import { CreateAntecedentePreexistenciaDto } from 'src/integrator/dto/create-antecedente-preexistencia.dto';
import { CreateDatoEsaviDto } from 'src/integrator/dto/create-dato-esavi.dto';
import { CreateDatoVacunaDto } from 'src/integrator/dto/create-dato-vacuna.dto';
import { CreateDatoVacunacionDto } from 'src/integrator/dto/create-dato-vacunacion.dto';
import { CreatePacienteEmbarazadaDto } from 'src/integrator/dto/create-paciente-embarazada.dto';
import { InvestigacionCreateDto } from 'src/integrator/dto/investigacion.dto';
import { UbicacionDto } from 'src/integrator/dto/ubicacion.dto';
import { CreateCompleteDto } from '../../integrator/dto/create-complete.dto';
import { CreateDesenlaceEsaviDto } from '../../integrator/dto/create-desenlace-esavi.dto';
import { CreateGravedadEsaviDto } from '../../integrator/dto/create-gravedad-esavi.dto';
import { CreateNotificacionDto } from '../../integrator/dto/create-notificacion.dto';
import { CreatePacienteDhis2Dto } from '../../integrator/dto/create-paciente-dhis2.dto';
import { SourceEnum } from '../../integrator/enum/source-enum';
import { IntegradorService } from '../../integrator/facade/integrador.service';
import { ProcessingStatus } from '../dto/dhis2-processing-log.dto';
import { DuplicateAction, DuplicateHandlingConfigDto } from '../dto/duplicate-handling.dto';
import { ProgramStage } from '../dto/interfaceprogramStages';
import { ProgramTrackedEntityAttribute } from '../dto/programTrackedEntityAttribute.interface';
import { IData, IHeader } from '../dto/report.interface';
import { Dhis2AnalyticsService } from './dhis2-analytics.service';
import { Dhis2DuplicateHandlerService } from './dhis2-duplicate-handler.service';
import { Dhis2EventsService } from './dhis2-events.service';
import { Dhis2ProcessingLogService } from './dhis2-processing-log.service';
import { Dhis2ProgramStageService } from './dhis2-program-stage.service';
import { Dhis2ProgramService } from './dhis2-program.service';
@Injectable()
export class Dhis2IntegratorService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly integradorService: IntegradorService,
    private readonly dhis2ProgramService: Dhis2ProgramService,
    private readonly dhis2ProgramStageService: Dhis2ProgramStageService,
    private readonly dhis2EventsService: Dhis2EventsService,
    private readonly dhis2AnalyticsService: Dhis2AnalyticsService,
    private readonly processingLogService: Dhis2ProcessingLogService,
    private readonly duplicateHandlerService: Dhis2DuplicateHandlerService,
  ) {}

  formatoFecha(valor: string) {
    if (valor && valor.length > 0 && valor != '') {
      return moment(valor, 'YYYYMMDD)').toDate();
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
    } catch (error) {}
    return resultado;
  };

  formatoFloat = (valor: string) => {
    let resultado = 0;
    try {
      resultado = parseFloat(valor);
      if (isNaN(resultado)) {
        resultado = 0;
      }
    } catch (error) {}
    return resultado;
  };

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

      //const eventos = await this.dhis2EventsService.getEventos('NrEU7cRCZd7');
      const data = await this.dhis2AnalyticsService.getEventsReports(
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
    } catch (error) {
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
        return 2; // Si es 'NO'
      case 'no sabe':
      case 'ignorando':
      case 'desconoce':
        return 3; // Si es 'NO SABE', 'IGNORADO' o 'DESCONOCE'
      default:
        return 3; // Si no se encuentra en los valores conocidos, consideramos '3' (como un valor por defecto)
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
    } catch (error) {
      console.error('Error al procesar el texto:', error);
      return { codigo: '', descripcion: '' }; // En caso de error, devolvemos valores vacíos
    }
  }

  esValorAfirmativo(valor: string): boolean {
    return valor === '1';
  }

  ajustarFecha = (fecha, dias) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    return nuevaFecha;
  };

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
      } catch (error) {
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
    const semanasEmbarazo = 42;
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
    notificacion.fechaNacimiento = this.formatoFecha(
      row[headers.findIndex((header) => header.column === 'Fecha de nacimiento')],
    );
    // Para no repetir la extracción de fechaNacimiento, solo se asigna el valor de notificacion a paciente.
    paciente.fechaNacimiento = notificacion.fechaNacimiento;

    // La edad ya es otra variable independiente en la extracción.
    notificacion.edad = this.formatoInteger(
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Edad')],
    );
    notificacion.unidadEdadPaciente =
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Tipo edad')];
    notificacion.organizacion =
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

    // Create Gravedad
    const grave = new CreateGravedadEsaviDto();
    grave.tipo = 'GRAVE';
    grave.riesgoVida = this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) =>
            header.column === 'DNVE ESAVI TRK - Criterio de notificación - amenaza a la vida',
        )
      ],
    );
    grave.discapacidad = this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Criterio de notificación - discapacidad',
        )
      ],
    );
    grave.hospitalizacion = this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) =>
            header.column === 'DNVE ESAVI TRK - Criterio de notificación - hospitalización',
        )
      ],
    ); //---después de esto va la CORRECCIÓN:
    grave.anomaliaCongenita = this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) =>
            header.column === 'DNVE ESAVI TRK - Criterio de notificación - anomalía congénita',
        )
      ],
    );
    grave.aborto = this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Criterio de notificación - aborto',
        )
      ],
    );
    grave.muerteFetal = this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Criterio de notificación - muerte fetal',
        )
      ],
    );
    grave.muerte = this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Criterio de notificación - muerte',
        )
      ],
    );
    grave.parteEventosPreocupacion = this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) =>
            header.column ===
            'DNVE ESAVI TRK - Criterio de investigación - parte de eventos preocupación',
        )
      ],
    );
    grave.nuevoEventos = this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) =>
            header.column === 'DNVE ESAVI TRK - Criterio de investigación - nuevos eventos',
        )
      ],
    );
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

    // DatoEsavi
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
      if (dato.descripcion && dato.codigo) {
        const datoEsaviInicial = new CreateDatoEsaviDto();
        datoEsaviInicial.nombre = dato.descripcion;
        datoEsaviInicial.fechaEsavi = this.formatoFecha(
          row[
            headers.findIndex(
              (h) => h.column === 'DNVE ESAVI TRK - Fecha de inicio de síntomas del ESAVI',
            )
          ]?.split(' ')[0],
        );
        datoEsaviInicial.descripcion = `Diagnostico inicial ${i}`;
        datoEsaviInicial.codigoCaso = notificacion.codigoDhis2Evento;
        datoEsavis.push(datoEsaviInicial);
      }
    }

    // Datos Lugar vacunacion
    const datoLugarVacuna = new CreateDatoVacunacionDto();
    datoLugarVacuna.nombreVacunatorio =
      row[
        headers.findIndex(
          (header) =>
            header.column === 'DNVE ESAVI TRK - Establecimiento de salud donde recibió la vacuna 1',
        )
      ];

    // Paciente embarazada
    const embarazada = new CreatePacienteEmbarazadaDto();
    const embarazadaMomentoVacuna =
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Semanas gestación al recibir la vacuna',
        )
      ];
    embarazada.momentoVacuna = embarazadaMomentoVacuna ? true : false;
    embarazada.momentoEsavi = this.esValorAfirmativo(
      row[headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Embarazada')],
    );

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
      datoVacuna.nombreVacuna =
        row[
          headers.findIndex(
            (header) => header.column === `DNVE ESAVI TRK - Antecedente vacuna ${i}`,
          )
        ];
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
      datoVacuna.inicioAdministracion = this.formatoFecha(
        row[
          headers.findIndex(
            (header) => header.column === `DNVE ESAVI TRK - Fecha de vacunación vacuna ${i}`,
          )
        ],
      );

      if (
        datoVacuna.nombreVacuna ||
        datoVacuna.nombreFabricante ||
        datoVacuna.numeroLote ||
        datoVacuna.fechaVencimientoVacuna ||
        datoVacuna.viaAdministracion ||
        datoVacuna.inicioAdministracion
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
    investigacion.vacunatorioCalidad = this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) =>
            header.column ===
            'DNVE ESAVI TRK - El vacunatorio cumple con los estándares de calidad',
        )
      ],
    );
    //column: DNVE ESAVI TRK - El personal de salud está capacitado en inmunizaciones. Utilizar el método this.esAfirmativo
    investigacion.personalCapacitado = this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) =>
            header.column ===
            'DNVE ESAVI TRK - El personal de salud está capacitado en inmunizaciones',
        )
      ],
    );
    //column: DNVE ESAVI TRK - Evidenció algún problema en el biológico. Utilizar el método this.esAfirmativo
    investigacion.problemaBiologico = this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) => header.column === 'DNVE ESAVI TRK - Evidenció algún problema en el biológico',
        )
      ],
    );
    //column: DNVE ESAVI TRK - Se realizó búsqueda de casos con similar sintomatología y que recibió la vacuna. Utilizar el método this.esAfirmativo
    investigacion.busquedaCasosSintomatologiaConVacuna = this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) =>
            header.column ===
            'DNVE ESAVI TRK - Se realizó búsqueda de casos con similar sintomatología y que recibió la vacuna',
        )
      ],
    );
    //column: DNVE ESAVI TRK - Se realizó búsqueda de casos con similar sintomatología sin antecedente de la vacuna. Utilizar el método this.esAfirmativo
    investigacion.busquedaCasosSintomatologiaSinVacuna = this.esValorAfirmativo(
      row[
        headers.findIndex(
          (header) =>
            header.column ===
            'DNVE ESAVI TRK - Se realizó búsqueda de casos con similar sintomatología sin antecedente de la vacuna',
        )
      ],
    );
    //column: DNVE ESAVI TRK - Muestra de Laboratorio. Utilizar el método this.esAfirmativo
    investigacion.muestraLaboratorio = this.esValorAfirmativo(
      row[
        headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Muestra de Laboratorio')
      ],
    );

    // Complete the dto
    const create = new CreateCompleteDto();
    create.source = SourceEnum.DHIS2;
    create.pacienteDhis2 = paciente;
    create.notificacion = notificacion;
    create.datoEsavi = datoEsavis;
    create.datoVacuna = datoVacunas;
    create.gravedadEsavi = grave;
    create.desenlaceEsavi = desenlaceEsavi;
    //investigacion.datoEsaviId= datoEsavis.id;
    create.investigacion = investigacion;

    if (
      antecedenteMedico.descripcionPrincipal &&
      antecedenteMedico.descripcionPrincipal.length > 0
    ) {
      create.antecedenteMedico = antecedenteMedico;
    }
    create.antecedenteEvento = antecedenteEventoAdverso;

    if (embarazada.momentoEsavi) {
      create.pacienteEmbarazada = embarazada;
      create.antecedenteEmbarazo = antecedenteEmbarazada;
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

  extractedFromDHIS2ToPersist = async (data: IData) => {
    // data.rows.map(async (row, i) => {
    // for (let i = 0; i < data.rows.length; i++) {
    //   const row = data.rows[i];
    for (const row of data.rows) {
      // Create Paciente
      const semanasEmbarazo = 42;
      const paciente = new CreatePacienteDhis2Dto();
      paciente.identificacion =
        row[data.headers.findIndex((header) => header.column === 'Nro. de identificación')];
      paciente.sexoPaciente = row[data.headers.findIndex((header) => header.column === 'Sexo')];
      paciente.codigoDhis2 =
        row[data.headers.findIndex((header) => header.column === 'Nro. de identificación')];
      paciente.autoIdentificacionPaciente =
        row[data.headers.findIndex((header) => header.column === 'Autoidentificación')];
      const nombre = row[data.headers.findIndex((header) => header.column === 'Nombres')];
      const apellido = row[data.headers.findIndex((header) => header.column === 'Apellidos')];
      paciente.nombre = `${nombre} ${apellido}`;

      // Create Notificacion
      const notificacion = new CreateNotificacionDto();
      notificacion.fechaNacimiento = this.formatoFecha(
        row[data.headers.findIndex((header) => header.column === 'Fecha de nacimiento')],
      );
      notificacion.edad = this.formatoInteger(
        row[data.headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Edad')],
      );
      notificacion.unidadEdadPaciente =
        row[data.headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Tipo edad')];
      console.log('Unidad de Edad:::', notificacion.edad, notificacion.unidadEdadPaciente);

      notificacion.unidadEdadPaciente =
        row[data.headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Tipo edad')];
      notificacion.organizacion =
        row[data.headers.findIndex((header) => header.column === 'Organisation unit name')];

      notificacion.organizacionUnitCode =
        row[data.headers.findIndex((header) => header.column === 'Organisation unit code')];
      notificacion.organizacionUnit =
        row[data.headers.findIndex((header) => header.column === 'Organisation unit')];

      notificacion.codigoDhis2Evento =
        row[
          data.headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Código del caso')
        ];
      notificacion.fechaNotificacion = this.formatoFecha(
        row[data.headers.findIndex((header) => header.column === 'Fecha de notificación')],
      );
      notificacion.fechaAtencion = this.formatoFecha(
        row[
          data.headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Fecha de atención')
        ],
      );
      notificacion.fechaLlenadoFicha = this.formatoFecha(
        row[data.headers.findIndex((header) => header.column === 'Incident date')],
      );
      // Ubicacion residencia paciente
      const ubicacionResidencia = new UbicacionDto();
      ubicacionResidencia.provincia =
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Provincia residencia',
          )
        ];
      ubicacionResidencia.canton =
        row[
          data.headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Canton residencia')
        ];
      ubicacionResidencia.parroquia =
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Parroquia residencia',
          )
        ];
      notificacion.residenciaPaciente = ubicacionResidencia;
      // Profesion quien notifica
      notificacion.profesionNotificadorParam =
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Profesión de quien notifica',
          )
        ];
      // Presenta eventos adversos
      const antecedenteEventoPrevio = this.obtenerValorNumerico(
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Evento adverso anterior',
          )
        ],
      );
      notificacion.antecedenteEventoPrevio = antecedenteEventoPrevio;
      // Tiene antecedente vacunal
      const antecedenteVacunal = this.obtenerValorNumerico(
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Tiene antecedente vacunal',
          )
        ],
      );
      // Establecimiento de salud
      notificacion.codigoUnidadSalud =
        row[data.headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Unicódigo')];
      notificacion.monitorioEstablecimientoSalud = this.obtenerValorNumerico(
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Monitoreo del establecimiento de salud',
          )
        ],
      );
      notificacion.antecedenteVacunal = antecedenteVacunal;
      // Caso Narrativo - Observaciones
      notificacion.casoNarrativo =
        row[data.headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Observaciones')];

      // Create Antecedente Medico
      const antecedenteMedico = new CreateAntecedenteMedicoDto();
      const comorbilidadPrincipal = this.separarCodigoYDescripcion(
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Especificar la comorbilidad 1',
          )
        ],
      );
      antecedenteMedico.comorbilidadPrincipalCIE10 = comorbilidadPrincipal.codigo;
      antecedenteMedico.descripcionPrincipal = comorbilidadPrincipal.descripcion;
      const comorbilidadDos = this.separarCodigoYDescripcion(
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Especificar la comorbilidad 2',
          )
        ],
      );
      antecedenteMedico.comorbilidadDosCIE10 = comorbilidadDos.codigo;
      antecedenteMedico.descripcionDos = comorbilidadDos.descripcion;
      const comorbilidadTres = this.separarCodigoYDescripcion(
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Especificar la comorbilidad 3',
          )
        ],
      );
      antecedenteMedico.comorbilidadTresCIE10 = comorbilidadTres.codigo;
      antecedenteMedico.descripcionTres = comorbilidadTres.descripcion;

      // Create Antecedente evento adverso
      const antecedenteEventoAdverso = new CreateAntecedenteEventoDto();
      antecedenteEventoAdverso.antecedente = this.obtenerValorNumerico(
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Evento adverso anterior',
          )
        ],
      );
      antecedenteEventoAdverso.alergiaMedicamento = this.esValorAfirmativo(
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Alergia Medicamentos',
          )
        ],
      );
      antecedenteEventoAdverso.alergiaAlimentos = this.esValorAfirmativo(
        row[
          data.headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Alergia Alimentos')
        ],
      );
      antecedenteEventoAdverso.alergiaInsectos = this.esValorAfirmativo(
        row[
          data.headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Alergia Insectos')
        ],
      );
      antecedenteEventoAdverso.alergiaPolvo = this.esValorAfirmativo(
        row[data.headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Alergia Polvo')],
      );
      antecedenteEventoAdverso.otrasAlergias =
        row[data.headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Otro Alergias')];

      // Create AntecedenteEnfermedadesPrevias
      const antecedentePreexistencia = new CreateAntecedentePreexistenciaDto();
      const antecedentePrevio = this.separarCodigoYDescripcion(
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Antecedente patológico personal 1',
          )
        ],
      );
      antecedentePreexistencia.codigoEsaviCIE10 = antecedentePrevio.codigo;
      antecedentePreexistencia.descripcion = antecedentePrevio.descripcion;

      //Create Gravedad
      const grave = new CreateGravedadEsaviDto();
      grave.tipo = 'GRAVE';
      grave.riesgoVida = this.esValorAfirmativo(
        row[
          data.headers.findIndex(
            (header) =>
              header.column === 'DNVE ESAVI TRK - Criterio de notificación - amenaza a la vida',
          )
        ],
      );
      grave.discapacidad = this.esValorAfirmativo(
        row[
          data.headers.findIndex(
            (header) =>
              header.column === 'DNVE ESAVI TRK - Criterio de notificación - discapacidad',
          )
        ],
      );
      grave.hospitalizacion = this.esValorAfirmativo(
        row[
          data.headers.findIndex(
            (header) =>
              header.column === 'DNVE ESAVI TRK - Criterio de notificación - hospitalización',
          )
        ],
      );
      grave.anomaliaCongenita = this.esValorAfirmativo(
        row[
          data.headers.findIndex(
            (header) =>
              header.column === 'DNVE ESAVI TRK - Criterio de notificación - anomalía congénita',
          )
        ],
      );
      grave.aborto = this.esValorAfirmativo(
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Criterio de notificación - aborto',
          )
        ],
      );
      grave.muerteFetal = this.esValorAfirmativo(
        row[
          data.headers.findIndex(
            (header) =>
              header.column === 'DNVE ESAVI TRK - Criterio de notificación - muerte fetal',
          )
        ],
      );
      grave.muerte = this.esValorAfirmativo(
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Criterio de notificación - muerte',
          )
        ],
      );
      grave.parteEventosPreocupacion = this.esValorAfirmativo(
        row[
          data.headers.findIndex(
            (header) =>
              header.column ===
              'DNVE ESAVI TRK - Criterio de investigación - parte de eventos preocupación',
          )
        ],
      );
      grave.nuevoEventos = this.esValorAfirmativo(
        row[
          data.headers.findIndex(
            (header) =>
              header.column === 'DNVE ESAVI TRK - Criterio de investigación - nuevos eventos',
          )
        ],
      );
      grave.condicionEgreso =
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Condición de egreso',
          )
        ];

      // Define Desenlace esavi
      const desenlaceEsavi = new CreateDesenlaceEsaviDto();
      desenlaceEsavi.autopsia = this.obtenerValorNumerico(
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Se realizó autopsia',
          )
        ],
      );
      desenlaceEsavi.fechaMuerte = this.formatoFecha(
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Fecha fallecimiento',
          )
        ],
      );
      desenlaceEsavi.fechaInicioInvestigacion = this.formatoFecha(
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Fecha de investigación',
          )
        ],
      );
      desenlaceEsavi.clasificacionFinalCaso =
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Clasificación final del caso',
          )
        ];
      desenlaceEsavi.clasificacionFinalCasoA =
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Clasificación final del caso A',
          )
        ];
      desenlaceEsavi.clasificacionFinalCasoB =
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Clasificación final del caso B',
          )
        ];

      // DatoEsavi
      const numeroIncidencias = 3;
      const datoEsavis: CreateDatoEsaviDto[] = [];

      for (let i = 1; i <= numeroIncidencias; i++) {
        const dato = this.separarCodigoYDescripcion(
          row[
            data.headers.findIndex(
              (header) => header.column === `DNVE ESAVI TRK - Diagnóstico inicial ${i}`,
            )
          ],
        );
        const fechaInicio =
          row[
            data.headers.findIndex(
              (h) => h.column === 'DNVE ESAVI TRK - Fecha de inicio de síntomas del ESAVI',
            )
          ]?.split(' ')[0];
        const horaInicio =
          row[
            data.headers.findIndex(
              (h) => h.column === 'DNVE ESAVI TRK - Hora de Inicio de síntomas del ESAVI',
            )
          ];
        const fechaEsavi =
          fechaInicio && horaInicio ? new Date(`${fechaInicio}T${horaInicio}:00Z`) : null;

        // Verifica que nombre y código no estén vacíos
        if (dato.descripcion && dato.codigo) {
          const datoEsaviInicial = new CreateDatoEsaviDto();
          datoEsaviInicial.nombre = dato.descripcion;
          // datoEsavi.codigoEsaviCie10 = dato.codigo;
          datoEsaviInicial.fechaEsavi = fechaEsavi;
          datoEsaviInicial.descripcion = `Diagnostico inicial ${i}`;
          datoEsaviInicial.codigoCaso = notificacion.codigoDhis2Evento;

          datoEsavis.push(datoEsaviInicial);
          console.log('DatooEsaviInicial::', datoEsaviInicial);
        }
      }

      for (let i = 1; i <= numeroIncidencias; i++) {
        const dato = this.separarCodigoYDescripcion(
          row[
            data.headers.findIndex(
              (header) => header.column === `DNVE ESAVI TRK - Diagnostico final ${i}`,
            )
          ],
        );
        const fechaInicio =
          row[
            data.headers.findIndex(
              (h) => h.column === 'DNVE ESAVI TRK - Fecha de inicio de síntomas del ESAVI',
            )
          ]?.split(' ')[0];
        const horaInicio =
          row[
            data.headers.findIndex(
              (h) => h.column === 'DNVE ESAVI TRK - Hora de Inicio de síntomas del ESAVI',
            )
          ];
        const fechaEsavi =
          fechaInicio && horaInicio ? new Date(`${fechaInicio}T${horaInicio}:00Z`) : null;

        // Verifica que nombre y código no estén vacíos
        if (dato.descripcion && dato.codigo) {
          const datoEsavi = new CreateDatoEsaviDto();
          datoEsavi.nombre = dato.descripcion;
          // datoEsavi.codigoEsaviCie10 = dato.codigo;
          datoEsavi.fechaEsavi = fechaEsavi;
          datoEsavi.descripcion = `Diagnostico final ${i}`;
          datoEsavi.codigoCaso = notificacion.codigoDhis2Evento;

          datoEsavis.push(datoEsavi);
        }
      }

      console.log('DtaoooEsaviiiiii:::', datoEsavis);

      // Datos Lugar vacunacion
      const datoLugarVacuna = new CreateDatoVacunacionDto();
      datoLugarVacuna.nombreVacunatorio =
        row[
          data.headers.findIndex(
            (header) =>
              header.column ===
              'DNVE ESAVI TRK - Establecimiento de salud donde recibió la vacuna 1',
          )
        ];

      // Paciente embarazada
      const embarazada = new CreatePacienteEmbarazadaDto();
      const embarazadaMomentoVacuna =
        row[
          data.headers.findIndex(
            (header) => header.column === 'DNVE ESAVI TRK - Semanas gestación al recibir la vacuna',
          )
        ];
      embarazada.momentoVacuna = embarazadaMomentoVacuna ? true : false;
      embarazada.momentoEsavi = this.esValorAfirmativo(
        row[data.headers.findIndex((header) => header.column === 'DNVE ESAVI TRK - Embarazada')],
      );

      // Antecedentes embarazo
      const antecedenteEmbarazada = new CreateAntecedenteEmbarazoDto();

      const semanaGestacion =
        row[
          data.headers.findIndex(
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

      //Dato Vacuna
      // const datoVacuna = new CreateDatoVacunaDto();
      // datoVacuna.nombreVacuna = row[data.headers.findIndex(header => header.column === `DNVE ESAVI TRK - Antecedente vacuna 1`)];
      // datoVacuna.nombreFabricante = row[data.headers.findIndex(header => header.column === "DNVE ESAVI TRK - Casa comercial vacuna 1")];
      // // Validar con el funcional el numero de dosis
      // //datoVacuna.numeroDosisVacuna = row[data.headers.findIndex(header => header.column === "DNVE ESAVI TRK - Semanas gestación al recibir la vacuna")]
      // datoVacuna.numeroLote = row[data.headers.findIndex(header => header.column === "DNVE ESAVI TRK - Lote de la vacuna 1")]
      // datoVacuna.fechaVencimientoVacuna = this.formatoFecha(row[data.headers.findIndex(header => header.column === "DNVE ESAVI TRK - Fecha de caducidad de la vacuna 1")]);
      // datoVacuna.viaAdministracion = row[data.headers.findIndex(header => header.column === "DNVE ESAVI TRK - Vía de aplicación vacuna 1")]
      // datoVacuna.fechaVencimientoVacuna = this.formatoFecha(row[data.headers.findIndex(header => header.column === "DNVE ESAVI TRK - Fecha de expiración del diluyente vacuna 1")]);
      // datoVacuna.nombreDiluyenteVacuna = row[data.headers.findIndex(header => header.column === "DNVE ESAVI TRK - Nombre del diluyente usado vacuna 1")]
      // datoVacuna.inicioAdministracion = this.formatoFecha(row[data.headers.findIndex(header => header.column === "DNVE ESAVI TRK - Fecha de vacunación vacuna 1")]);

      const numeroVacunas = 5;
      const datoVacunas: CreateDatoVacunaDto[] = [];

      for (let i = 1; i <= numeroVacunas; i++) {
        const datoVacuna = new CreateDatoVacunaDto();
        datoVacuna.nombreVacuna =
          row[
            data.headers.findIndex(
              (header) => header.column === `DNVE ESAVI TRK - Antecedente vacuna ${i}`,
            )
          ];
        datoVacuna.nombreFabricante =
          row[
            data.headers.findIndex(
              (header) => header.column === `DNVE ESAVI TRK - Casa comercial vacuna ${i}`,
            )
          ];
        datoVacuna.numeroLote =
          row[
            data.headers.findIndex(
              (header) => header.column === `DNVE ESAVI TRK - Lote de la vacuna ${i}`,
            )
          ];
        datoVacuna.fechaVencimientoVacuna = this.formatoFecha(
          row[
            data.headers.findIndex(
              (header) => header.column === `DNVE ESAVI TRK - Fecha de caducidad de la vacuna ${i}`,
            )
          ],
        );
        datoVacuna.viaAdministracion =
          row[
            data.headers.findIndex(
              (header) => header.column === `DNVE ESAVI TRK - Vía de aplicación vacuna ${i}`,
            )
          ];
        datoVacuna.fechaVencimientoDiluyente = this.formatoFecha(
          row[
            data.headers.findIndex(
              (header) =>
                header.column === `DNVE ESAVI TRK - Fecha de expiración del diluyente vacuna ${i}`,
            )
          ],
        );
        datoVacuna.nombreDiluyenteVacuna =
          row[
            data.headers.findIndex(
              (header) =>
                header.column === `DNVE ESAVI TRK - Nombre del diluyente usado vacuna ${i}`,
            )
          ];
        datoVacuna.inicioAdministracion = this.formatoFecha(
          row[
            data.headers.findIndex(
              (header) => header.column === `DNVE ESAVI TRK - Fecha de vacunación vacuna ${i}`,
            )
          ],
        );
        // datoVacuna.numeroDosisVacuna = (row[data.headers.findIndex(header => header.column === `DNVE ESAVI TRK - Fecha de vacunación vacuna ${i}`)])

        if (
          datoVacuna.nombreVacuna ||
          datoVacuna.nombreFabricante ||
          datoVacuna.numeroLote ||
          datoVacuna.fechaVencimientoVacuna ||
          datoVacuna.viaAdministracion ||
          datoVacuna.fechaVencimientoDiluyente ||
          datoVacuna.nombreDiluyenteVacuna ||
          datoVacuna.inicioAdministracion
        ) {
          datoVacunas.push(datoVacuna);
        }
      }
      //-------TR_INVESTIGACION
      const investigacion = new InvestigacionCreateDto();
      investigacion.fechaInvestigacion = this.formatoFecha(
        row[
          data.headers.findIndex(
            (header) =>
              header.column === 'DNVE ESAVI TRK - Fecha en que se termina la investigación',
          )
        ],
      );
      // Antecedente evento adverso

      //Complete the dto
      const create = new CreateCompleteDto();
      create.source = SourceEnum.DHIS2;
      create.pacienteDhis2 = paciente;
      create.notificacion = notificacion;
      create.datoEsavi = datoEsavis;
      create.datoVacuna = datoVacunas;
      create.gravedadEsavi = grave;
      create.desenlaceEsavi = desenlaceEsavi;
      if (antecedentePreexistencia.descripcion) {
        create.antecedentePreexistencia = antecedentePreexistencia;
      }
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

      try {
        if (notificacion.codigoDhis2Evento) {
          await this.integradorService.create(create);
        }
      } catch (error) {
        console.log(error);
      }
    }
    // );
  };

  // no usado
  // generarArchivo = async (
  //   events: any,
  //   estructuraCabecera: ProgramStage[],
  //   estructuraCabeceraEntidad: ProgramTrackedEntityAttribute[],
  // ) => {
  //   const wbEventos = new Workbook();
  //   wbEventos.creator = 'ESAVI';

  //   const hojaPromedios: Worksheet = wbEventos.addWorksheet('ESAVIS');
  //   agregarColumnasWorkSheet(
  //     hojaPromedios,
  //     estructuraCabecera,
  //     estructuraCabeceraEntidad,
  //   );
  //   agregarRegistros(hojaPromedios, events);

  //   await wbEventos.xlsx.writeFile('/tmp/esavis.xlsx').then(() => {
  //     console.log('Archivo generado...');
  //   });
  //   //This piece of code was took from https://www.brcline.com/blog/how-to-read-an-excel-file-in-nodejs
  //   await wbEventos.eachSheet((ws, sheetId) => {
  //     const headers = {};
  //     for (let i = 1; i <= ws.actualColumnCount; i++) {
  //       headers[i] = ws.getRow(1).getCell(i).value;
  //     }
  //     for (let x = 2; x <= ws.actualRowCount; x++) {
  //       const theRow = {};
  //       for (let y = 1; y <= ws.actualColumnCount; y++) {
  //         theRow[headers[y]] = ws.getRow(x).getCell(y).value;
  //       }
  //       //Define paciente
  //       const paciente = new CreatePacienteDhis2Dto();
  //       paciente.sexoPaciente = theRow['Sexo'];
  //       paciente.identificacion = theRow['Nro. de identificación'];
  //       paciente.nombre = `${theRow['Nombres']} ${theRow['Apellidos']}`;
  //       paciente.autoIdentificacionPaciente = theRow['Autoidentificación'];
  //       paciente.codigoDhis2 = uuidv4();
  //       console.log(paciente);
  //       // Define notificacion
  //       const notificacion = new CreateNotificacionDto();
  //       notificacion.fechaNacimiento = theRow['Fecha de nacimiento'];
  //       if (this.isDigit(theRow['Edad'])) {
  //         notificacion.edad = theRow['Edad'];
  //       }
  //       notificacion.unidadEdadPaciente = theRow['Tipo Edad'];
  //       notificacion.grupoEtarioPaciente = theRow['Grupo edad'];
  //       notificacion.residencia.parroquia = theRow['Parroquia residencia'];
  //       notificacion.residencia.canton = theRow['Canton residencia'];
  //       notificacion.residencia.provincia = theRow['Provincia residencia'];
  //       notificacion.nombreNotificador = theRow['Nombre de quien notifica'];
  //       notificacion.profesionNotificadorParam =
  //         theRow['Profesión de quien notifica'];

  //       console.log(notificacion);
  //       // Define esavi
  //       const gravedadEsavi = new CreateGravedadEsaviDto();
  //       gravedadEsavi.muerte =
  //         theRow['Criterio de notificación - muerte'] == 'true';
  //       if (!gravedadEsavi.muerte) {
  //         gravedadEsavi.aborto =
  //           theRow['Criterio de notificación - aborto'] == 'true';
  //         gravedadEsavi.anomaliaCongenita =
  //           theRow['Criterio de notificación - anomalía congénita'] == 'true';
  //         gravedadEsavi.discapacidad =
  //           theRow['Criterio de notificación - discapacidad'] == 'true';
  //         gravedadEsavi.riesgoVida =
  //           theRow['Criterio de notificación - amenaza a la vida'] == 'true';
  //         gravedadEsavi.hospitalizacion =
  //           theRow['Criterio de notificación - hospitalización'] == 'true';
  //       }
  //       gravedadEsavi.muerteFetal =
  //         theRow['Criterio de notificación - muerte fetal'] == 'true';
  //       console.log(gravedadEsavi);
  //       // Define desenlace esavi
  //       const desenlaceEsavi = new CreateDesenlaceEsaviDto();
  //       // desenlaceEsavi.autopsia = theRow['Se realizó autopsia'] == 'true';
  //       desenlaceEsavi.fechaMuerte = theRow['Fecha fallecimiento'];
  //       console.log(desenlaceEsavi);
  //       //Complete the dto
  //       const create = new CreateCompleteDto();
  //       create.source = SourceEnum.DHIS2;
  //       create.pacienteDhis2 = paciente;
  //       create.notificacion = notificacion;
  //       create.gravedadEsavi = gravedadEsavi;
  //       create.desenlaceEsavi = desenlaceEsavi;
  //       this.integradorService.create(create);
  //     }
  //   });
  // };

  DIGIT_EXPRESSION = /^\d$/;

  isDigit = (character: string): boolean => {
    return character && this.DIGIT_EXPRESSION.test(character);
  };
}

export interface MyColumns {
  header: string;
  key: string;
}
export const agregarColumnasWorkSheet = (
  workSheet: Worksheet,
  programStage: ProgramStage[],
  estructuraCabeceraEntidad: ProgramTrackedEntityAttribute[],
) => {
  const cabecera: MyColumns[] = [];
  estructuraCabeceraEntidad.forEach(
    (programTrackedEntityAttribute: ProgramTrackedEntityAttribute) => {
      cabecera.push({
        header: (programTrackedEntityAttribute.displayName || '').replace('ESAVI-Graves ', ''),
        key: programTrackedEntityAttribute.trackedEntityAttribute.id, // attributes.attribute
      });
    },
  );

  programStage.forEach((programStage: ProgramStage, index) => {
    programStage.programStageDataElements.forEach((programStageDataElement) => {
      cabecera.push({
        header: (programStageDataElement.dataElement.name || '').replace('DNVE ESAVI TRK - ', ''),
        key: programStageDataElement.dataElement.id,
      });
    });
  });

  workSheet.columns = cabecera;
};

export const agregarRegistros = (workSheet: Worksheet, events: any) => {
  events.forEach((event: any) => {
    const row: any = {};
    event.dataValues.forEach((dataValue: any) => {
      row[dataValue.dataElement] = dataValue.value;
    });
    workSheet.addRow(row);
  });
};
