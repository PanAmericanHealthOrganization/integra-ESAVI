import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs/promises';
import * as countries from 'i18n-iso-countries';
import * as enLocale from 'i18n-iso-countries/langs/en.json';
import * as esLocale from 'i18n-iso-countries/langs/es.json';
import { SyncSource } from 'src/integrator/entity';
import { IAuditoria } from 'src/integrator/entity/auditoria.entity';
import { DatoEsaviService } from 'src/integrator/service/dato-esavi.service';
import { SyncService } from 'src/integrator/service/sync.service';
import { DestinatarioNotificacion } from 'src/mensajes/models/notificacion.interface';
import { MeddraLLTService } from 'src/meddra/services/meddra-lt.service';
import { MeddraPtService } from 'src/meddra/services/meddra-pt.service';
import { MeddraSocService } from 'src/meddra/services/meddra-soc.service';
import { ICodificacionVacunaWhodrug, IWhodrugVaccineMatch } from 'src/whodrugs/models/dtos';
import { ActiveIngredientsService } from 'src/whodrugs/services/activeIngredients.service';
import { DrugService } from 'src/whodrugs/services/drugs.service';
import { IngredientTranslationService } from 'src/whodrugs/services/ingredientsTraslations.service';
import { MaholderService } from 'src/whodrugs/services/maholder.service';
import { RangoFechasUtils } from 'src/utils/rango-fechas.util';
import * as path from 'path';
import { read, utils, WorkBook, write } from 'xlsx';
import {
  CreateCompleteDto,
  CreateDatoEsaviDto,
  CreateDatoVacunacionDto,
  CreateDatoVacunaDto,
  CreateDesenlaceEsaviDto,
  CreateEmbarazoEsaviDto,
  CreateGravedadEsaviDto,
  CreateMedicamentoDto,
  CreateNotificacionDto,
  CreateAntecedenteEmbarazoDto,
  CreatePacienteVigiflowDto,
  UbicacionDto,
  UpdateDatoVacunaDto,
  UpdateNotificacionDto,
} from '../../integrator/dto';
import { InvestigacionCreateDto } from '../../integrator/entity/investigacion.entity';
import { SourceEnum } from '../../integrator/enum/source-enum';
import { TipoRegistroEsaviEnum } from '../../integrator/enum/tipo-registro-esavi.enum';
import { IntegradorService } from '../../integrator/facade/integrador.service';
import { DesenlaceEsaviService } from '../../integrator/service/desenlace-esavi.service';
import { EmbarazoEsaviService } from '../../integrator/service/embarazo-esavi.service';
import { GravedadEsaviService } from '../../integrator/service/gravedad-esavi.service';
import { DatoVacunaService } from '../../integrator/service/dato-vacuna.service';
import { DatoVacunacionService } from '../../integrator/service/dato-vacunacion.service';
import { MedicamentoService } from '../../integrator/service/medicamento.service';
import { NotificacionVigiflowService } from '../../integrator/service/notificacion-vigiflow.service';
import { NotificadorService } from '../../integrator/service/notificador.service';
import { PacienteService } from '../../integrator/service/paciente.service';
import { VigiflowUtils } from '../utils/vigiflow-utils.module';
import { VigiflowCrawlerService } from './vigiflow-crawler.service';

// La lista fija de profesiones se eliminó: filtraba el valor de VigiFlow contra 8 literales
// antes de homologarlo, así que cualquier profesión fuera de esa lista se perdía aunque sí
// existiera en el catálogo. La homologación es ahora única para ambos orígenes y se resuelve
// en NotificadorService contra TC_CATALOGO_PADRE (código OCUPACION).

//--- Registrar idiomas
countries.registerLocale(enLocale);
countries.registerLocale(esLocale);
const idiomaParaPaisIso3Code = 'es';

/**
 * Resultado de una importación por rango de fechas. Un rango de más de un mes se ejecuta como
 * varias importaciones mensuales independientes, así que el resultado es un agregado: cuántos
 * periodos se intentaron, cuántos terminaron bien y el detalle de los que fallaron.
 */
export interface ResumenImportacionVigiflow {
  totalPeriodos: number;
  completados: number;
  fallidos: { periodo: string; error: string }[];
}

@Injectable()
export class VigiflowIntegradorService {
  private readonly logger = new Logger(VigiflowIntegradorService.name);

  /**
   * Edad gestacional por notificación, capturada en la hoja Medicamentos y consumida al
   * procesar la hoja Reacciones, que es donde se conoce la fecha del ESAVI necesaria para
   * derivar FECHAULTIMAMENSTRUACIONESAVI y FECHAPARTOESAVI.
   */
  private readonly edadGestacionalPorNotificacion = new Map<string, number>();

  constructor(
    private readonly vigiflowCrawlerService: VigiflowCrawlerService,
    private readonly configService: ConfigService,
    private readonly integradorService: IntegradorService,
    private readonly pacienteService: PacienteService,
    private readonly notificacionVigiflowService: NotificacionVigiflowService,
    private readonly notificadorService: NotificadorService,
    private readonly medicamentoService: MedicamentoService,
    private readonly embarazoEsaviService: EmbarazoEsaviService,
    private readonly desenlaceEsaviService: DesenlaceEsaviService,
    private readonly gravedadEsaviService: GravedadEsaviService,
    private readonly datoVacunaService: DatoVacunaService,
    private readonly datoVacunacionService: DatoVacunacionService,
    private readonly datoEsaviService: DatoEsaviService,
    private readonly drugService: DrugService,
    private readonly maholderService: MaholderService,
    private readonly activeIngredentService: ActiveIngredientsService,
    private readonly ingredientTranslationService: IngredientTranslationService,
    private readonly syncService: SyncService,
    private readonly meddraLltService: MeddraLLTService,
    private readonly meddraPtService: MeddraPtService,
    private readonly meddraSocService: MeddraSocService,
  ) {}

  /**
   * Importación programada de VigiFlow: todos los días a las 23:00 (zona horaria del servidor).
   * Cada corrida procesa ÚNICAMENTE el día anterior completo (UTC), no el histórico: antes se
   * recorría mes a mes desde VIGIFLOW_FECHA_INICIO_CRON, lo que con periodicidad diaria habría
   * repetido todo el histórico cada noche.
   *
   * Para recargar un rango histórico se usa el endpoint GET /vigiflow/bulk, que sigue aceptando
   * fechas arbitrarias.
   */
  @Cron('0 23 * * *', { name: 'vigiflow-import-diario' })
  private async handleCron() {
    const { fechaInicio, fechaFin } = RangoFechasUtils.diaAnterior();

    this.logger.log(`Cron VigiFlow: procesando el día ${fechaInicio.toISOString().slice(0, 10)}`);

    try {
      await this.createInBulk(fechaInicio, fechaFin);
      this.logger.log('Cron VigiFlow: importación programada completada');
    } catch (error: any) {
      // ejecutarConRegistroSync ya deja el registro en FAILED; aquí se evita que la excepción
      // escape del scheduler como unhandled rejection.
      this.logger.error(`Cron VigiFlow: la importación programada falló: ${error?.message}`, error?.stack);
    }
  }

  /* ARCHIVOS ORIGEN REMOTO */
  /**
   * Importa desde VigiFlow el rango solicitado. Un rango que abarca más de un mes NO se pide
   * de una sola vez: se parte en tramos mensuales y cada mes se descarga y procesa por
   * separado, con su propio registro de sincronización (dataStartDate/dataEndDate del tramo).
   *
   * Así una importación larga no depende de una única descarga gigante de VigiFlow, y el fallo
   * de un mes no invalida los demás: se continúa con los siguientes y se reporta cuáles
   * fallaron. Un rango dentro de un mismo mes se comporta exactamente como antes (un tramo).
   *
   * `usuario` es quien lanzó la importación desde la interfaz; recibe una notificación por
   * cada tramo, con su desenlace. El cron no lo aporta —no hay a quién avisar— y en ese caso
   * la corrida sólo queda en TR_SYNC_PROCESS.
   */
  async createInBulk(
    fechaInicio: Date,
    fechaFin: Date,
    codigoATC = 'J07',
    usuario?: DestinatarioNotificacion | null,
  ): Promise<ResumenImportacionVigiflow> {
    if (fechaFin <= fechaInicio) {
      throw new BadRequestException();
    }

    const tramos = RangoFechasUtils.dividirEnMeses(fechaInicio, fechaFin);
    const resumen: ResumenImportacionVigiflow = {
      totalPeriodos: tramos.length,
      completados: 0,
      fallidos: [],
    };

    if (tramos.length > 1) {
      this.logger.log(
        `VigiFlow: el rango ${VigiflowUtils.formatoYYYYMMDD(fechaInicio)} – ${VigiflowUtils.formatoYYYYMMDD(
          fechaFin,
        )} supera el mes; se procesará en ${tramos.length} tramos mensuales`,
      );
    }

    let primerError: unknown = null;

    for (const tramo of tramos) {
      const periodo = `${VigiflowUtils.formatoYYYYMMDD(tramo.fechaInicio)} – ${VigiflowUtils.formatoYYYYMMDD(
        tramo.fechaFin,
      )}`;
      try {
        await this.importarPeriodo(tramo.fechaInicio, tramo.fechaFin, codigoATC, usuario);
        resumen.completados++;
      } catch (error: any) {
        // Se continúa con los meses restantes: cada tramo es independiente y ya quedó
        // registrado como FAILED en su propio sync. El detalle se devuelve al llamador.
        primerError ??= error;
        resumen.fallidos.push({ periodo, error: error?.message ?? String(error) });
        this.logger.error(`VigiFlow: falló la importación del periodo ${periodo}: ${error?.message}`, error?.stack);
      }
    }

    // Si ningún tramo prosperó, la importación fracasó como un todo y debe propagarse.
    if (resumen.completados === 0 && primerError) {
      throw primerError;
    }

    return resumen;
  }

  /**
   * Descarga y procesa un único periodo (a lo sumo un mes) desde VigiFlow.
   */
  private async importarPeriodo(
    fechaInicio: Date,
    fechaFin: Date,
    codigoATC: string,
    usuario?: DestinatarioNotificacion | null,
  ) {
    // Las fechas se envían con el formato YYYYMMDD, ejm: 20230113
    const fechaInicioFmrt = VigiflowUtils.formatoYYYYMMDD(fechaInicio);
    const fechaFinFmrt = VigiflowUtils.formatoYYYYMMDD(fechaFin);

    await this.ejecutarConRegistroSync(
      `Importación VigiFlow ${fechaInicioFmrt} – ${fechaFinFmrt}`,
      `Importación VigiFlow completada: ${fechaInicioFmrt} – ${fechaFinFmrt}`,
      async () => {
        const { jwt } = await this.vigiflowCrawlerService.retrieveJWT();

        // Excel para persistir los elementos la primera vez (J07BX=Covid-19)
        const reportOne = await this.vigiflowCrawlerService.retrieveExcelReport(
          fechaInicioFmrt,
          fechaFinFmrt,
          codigoATC,
          jwt,
        );
        // Excel para actualizar los elementos
        const reportTwo = await this.vigiflowCrawlerService.retrieveJsonReport(fechaInicioFmrt, fechaFinFmrt, codigoATC, jwt);

        await this.guardarCopiaDeDepuracion(reportOne, reportTwo, fechaInicio, fechaFin);

        await this.procesarWorkbooks(reportOne, reportTwo);
      },
      fechaInicio,
      fechaFin,
      usuario,
    );
  }

  /**
   * Deja en disco una copia de los dos Excel que VigiFlow acaba de devolver.
   *
   * Sólo corre con `ENV=DEV`. Lo que llega de VigiFlow es efímero —se descarga, se parsea y
   * se descarta—, así que cuando una importación produce datos raros no queda nada que
   * inspeccionar. Con la copia se puede reproducir el caso contra el mismo archivo.
   *
   * Se serializan los WorkBook ya parseados y no el cuerpo original de la respuesta: es lo
   * que el crawler entrega (`retrieveExcelReport` devuelve el resultado de `read`), y para
   * depurar interesa precisamente lo que el parser vio, no lo que viajó por la red.
   *
   * Nunca lanza. Es una ayuda de depuración: que falle por permisos o por disco lleno no
   * puede tumbar una importación que, por lo demás, iba bien.
   */
  private async guardarCopiaDeDepuracion(
    aefi: WorkBook,
    report: WorkBook,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<void> {
    if (this.configService.get<string>('ENV') !== 'DEV') return;

    const directorio = path.join(process.cwd(), 'upload_files', 'files_meddra');
    try {
      await fs.mkdir(directorio, { recursive: true });

      for (const [libro, sufijo] of [
        [aefi, 'aefi'],
        [report, 'report'],
      ] as const) {
        const nombre = VigiflowUtils.nombreArchivoRespaldo(fechaInicio, fechaFin, sufijo);
        // `Uint8Array` y no `Buffer`: xlsx declara su propio tipo `Buffer`, incompatible
        // con el de Node, y writeFile acepta cualquier vista de ArrayBuffer.
        const contenido = write(libro, { type: 'buffer', bookType: 'xlsx' }) as Uint8Array;
        await fs.writeFile(path.join(directorio, nombre), contenido);
        this.logger.log(`VigiFlow (ENV=DEV): copia guardada en upload_files/files_meddra/${nombre}`);
      }
    } catch (error: any) {
      this.logger.warn(
        `VigiFlow: no se pudo guardar la copia de depuración en ${directorio}: ${error?.message ?? error}`,
      );
    }
  }

  /* ARCHIVOS LOCALES */
  public async createInBulkFromFile(usuario?: DestinatarioNotificacion | null) {
    const aefiFilePath = this.configService.get<string>('VIGIFLOW_FILE_AEFI', './upload_files/files_meddra/aefi.xlsx');
    const reportFilePath = this.configService.get<string>('VIGIFLOW_FILE_REPORT', './upload_files/files_meddra/report.xlsx');
    const reportOne = read(await fs.readFile(aefiFilePath));
    const reportTwo = read(await fs.readFile(reportFilePath));
    await this._processBulkWorkbooks(reportOne, reportTwo, 'Importación VigiFlow desde archivo', usuario);
  }

  public async createInBulkFromUploadedFiles(
    aefiBuffer: Buffer,
    reportBuffer: Buffer,
    usuario?: DestinatarioNotificacion | null,
  ) {
    const reportOne = read(aefiBuffer);
    const reportTwo = read(reportBuffer);
    await this._processBulkWorkbooks(reportOne, reportTwo, 'Importación VigiFlow desde archivo cargado', usuario);
  }

  private async _processBulkWorkbooks(
    reportOne: WorkBook,
    reportTwo: WorkBook,
    syncName: string,
    usuario?: DestinatarioNotificacion | null,
  ) {
    await this.ejecutarConRegistroSync(
      syncName,
      'Importación VigiFlow desde archivo completada',
      () => this.procesarWorkbooks(reportOne, reportTwo),
      null,
      null,
      usuario,
    );
  }

  /**
   * Pipeline de extracción común a todos los orígenes (remoto, archivo local, upload).
   */
  private async procesarWorkbooks(reportOne: WorkBook, reportTwo: WorkBook) {
    // La hoja AEFI se procesa primero y NO contiene el código ATC (vive en la hoja Medicamentos).
    // Se pre-calcula qué pacientes tienen al menos una vacuna J07 para descartar por completo
    // (sin crear notificación) los casos cuyo reporte no incluye ninguna vacuna.
    const codigosPacientesConVacunaJ07 = this.extraerPacientesConVacunaJ07(reportTwo);
    this.logger.log(`Pacientes con vacuna J07 en hoja Medicamentos: ${codigosPacientesConVacunaJ07.size}`);

    this.logger.log('extractedFromExcelToPersist..................');
    await this.extractedFromExcelToPersist(reportOne, codigosPacientesConVacunaJ07);
    await VigiflowUtils.sleep(8000);
    this.logger.log('extractedFromJsonReportToUpdate..................');
    await this.extractedFromJsonReportToUpdate(reportTwo);
    await VigiflowUtils.sleep(8000);
    this.logger.log('extractedFromJsonReportToCreateMedicamento..................');
    await this.extractedFromJsonReportToCreateMedicamento(reportTwo);
    await VigiflowUtils.sleep(8000);
    this.logger.log('extractedFromJsonReportToCreateReaccion..................');
    await this.extractedFromJsonReportToCreateReaccion(reportTwo);
    await VigiflowUtils.sleep(3000);
    this.logger.log('Fin Proceso..................');
  }

  /**
   * Envoltorio sobre el registro común. Sólo adapta la forma de llamar (aquí el
   * mensaje de éxito se conoce de antemano); el registro en TR_SYNC_PROCESS y el
   * aviso al usuario los hace `SyncService.ejecutarConRegistro`, igual que el
   * resto de las fuentes.
   */
  private async ejecutarConRegistroSync(
    syncName: string,
    mensajeExito: string,
    proceso: () => Promise<void>,
    dataStartDate: Date | null = null,
    dataEndDate: Date | null = null,
    usuario?: DestinatarioNotificacion | null,
  ) {
    await this.syncService.ejecutarConRegistro(
      SyncSource.VIGIFLOW,
      syncName,
      async () => {
        await proceso();
        return { mensaje: mensajeExito };
      },
      { dataStartDate, dataEndDate, usuario },
    );
  }

  // TODO: colocar auditoria correcta
  private crearAuditoria(): IAuditoria {
    return {
      createdAt: new Date(),
      createdBy: 'System',
      updatedAt: undefined,
      updatedBy: 'System',
      deletedAt: undefined,
      deletedBy: 'System',
      isEnabled: true,
      isActive: true,
    };
  }

  /**
   * Devuelve el conjunto de "Número de identificación único mundial" (columna A de la hoja
   * Medicamentos) que tienen al menos una fila con código ATC de vacuna J07 (columna G).
   * Sirve para que la fase AEFI —que se ejecuta antes y no tiene el ATC— sepa qué casos
   * corresponde registrar: sin vacuna J07 no se crea ningún registro para ese paciente.
   */
  private extraerPacientesConVacunaJ07(workbook: WorkBook): Set<string> {
    const ws = workbook.Sheets[workbook.SheetNames[2]];
    const filas = utils.sheet_to_json(ws, { header: 'A', defval: '' }) as Record<string, any>[];
    const codigos = new Set<string>();
    for (const fila of filas) {
      const codigo = fila['A'] ? fila['A'].toString().trim() : null;
      if (!codigo) continue;
      const atcVacuna = fila['G'] ? VigiflowUtils.extraerCodigoAtcVacuna(fila['G'].toString()) : null;
      if (atcVacuna) codigos.add(codigo);
    }
    return codigos;
  }

  //Extracción de los datos de la hoja [0], del libro
  //de Excel 'VigiFlow_AEFILinelisting_ddmmaaaa_hhmmss.xlsx'.
  //AEFI: Adverse Events Following Immunization (Eventos Adversos Después de la Vacunación).
  private async extractedFromExcelToPersist(workBook: WorkBook, codigosPacientesConVacunaJ07: Set<string>) {
    //Convert file to json
    const ws = workBook.Sheets[workBook.SheetNames[0]];
    const reports = utils.sheet_to_json(ws, {
      header: 'A',
      raw: true,
      defval: '',
    });
    this.logger.log(`Numero de reportes de vigiflow ${reports.length}`);

    // Precargar pacientes y notificaciones existentes en bulk para evitar N+1 queries
    const rows = reports.slice(1) as Record<string, any>[];
    const codigos = [...new Set(rows.map(r => r['B']?.toString().trim()).filter(Boolean))];
    const pacienteMap = await this.pacienteService.findByCodigosOrigen(codigos);
    const notificacionMap = await this.notificacionVigiflowService.findAllByCodigosOrigen(codigos);

    // Precarga en bloque: datoVacunas para evitar N+1 dentro del loop
    const notifIds = [...notificacionMap.values()].flat().map(n => n.id);
    await this.datoVacunaService.preloadByNotificacionIds(notifIds);

    try {
      // Usar for...of para esperar que cada operación asíncrona termine
      for (const reg of rows) {
        const auditoria = this.crearAuditoria();

        // Create Paciente Vigiflow
        const paciente = new CreatePacienteVigiflowDto();
        paciente.identificacion = reg['E'] ? reg['E'].toString().trim() : null;
        paciente.sexoPaciente = reg['F'];
        paciente.codigoVigiflow = reg['B'] ? reg['B'].toString().trim() : null; // Viene desde la hoja AEFI columna B
        paciente.inicialesNombre = reg['C'] ? reg['C'].toString().trim().toUpperCase() : null;

        // Criterio funcional: solo se registran casos ESAVI, es decir, con al menos una vacuna
        // (ATC J07*) en la hoja Medicamentos. Sin J07 el reporte no corresponde a una vacuna, así
        // que no debe crearse NINGÚN registro (ni notificación ni paciente ni sub-entidades).
        // Un registro sin código VigiFlow tampoco es verificable contra la hoja Medicamentos.
        if (!paciente.codigoVigiflow || !codigosPacientesConVacunaJ07.has(paciente.codigoVigiflow)) {
          this.logger.warn(
            `[AEFI] Caso ${paciente.codigoVigiflow ?? '(sin código VigiFlow)'} descartado: no tiene ninguna vacuna J07 en la hoja Medicamentos`,
          );
          continue;
        }

        // Comparación exacta contra "Sí"/"No" normalizado (sin tildes ni mayúsculas). Cualquier
        // otro valor ("Sin dato", "Desconocido", celda vacía) se trata como NO GRAVE.
        const gravedad = VigiflowUtils.esAfirmativo(reg['X']) ? '1' /*GRAVE*/ : '0' /*NO GRAVE*/;

        // Criterio funcional: desde VigiFlow solo se procesan los casos NO GRAVES. Los casos
        // graves llegan por DHIS2 (programa "ESAVI-Graves"), así que registrarlos también desde
        // VigiFlow duplicaría el mismo evento en dos orígenes. El descarte es total —igual que
        // el filtro J07—: no se crea notificación ni paciente ni sub-entidades.
        if (gravedad === '1') {
          this.logger.warn(`[AEFI] Caso ${paciente.codigoVigiflow} descartado: es un caso GRAVE (se procesa desde DHIS2)`);
          continue;
        }

        // El snapshot crudo se guarda una sola vez, en TR_PACIENTE.PAYLOAD_ORIGEN. Antes este
        // mismo objeto se asignaba también a notificacion.origenOriginal, duplicando en
        // TR_NOTIFICACION un contenido que es enteramente demográfico del paciente.
        paciente.payloadOrigen = {
          iniciales: reg['C'] ?? null,
          identificacion: reg['E'] ?? null,
          sexo: reg['F'] ?? null,
          fechaNacimiento: reg['G'] ?? null,
          edad: reg['H'] ?? null,
          unidadEdad: reg['I'] ?? null,
          reportadoPor: reg['AB'] ? reg['AB'].toString().trim() : null,
        };

        // Create Notificacion
        const notificacion = new CreateNotificacionDto();
        const fechaNacimiento = VigiflowUtils.analizarCadenaFecha(reg['G']?.toString());
        if (fechaNacimiento) {
          notificacion.fechaNacimiento = fechaNacimiento;
          //Para no repetir la extracción, simplemente se asigna la fecha de nacimiento al paciente desde la notificación.
          paciente.fechaNacimiento = fechaNacimiento;
        }

        // Al momento la edad y su unidad se toman directamente del excel. Los cálculos
        // que se hacen en el documento "notificacion-vigiflow.service.ts" son
        // únicamente para calcular el grupo etario.
        const edad = VigiflowUtils.formatoEnteroSinSeparadores(reg['H']) ?? 0;
        const unidadEdad = reg['I'] && reg['I'].toUpperCase();
        if ((edad > 0 && edad < 121) && unidadEdad) {
          notificacion.edad = edad;
          notificacion.unidadEdadPaciente = unidadEdad;
        } else {
          // Si la edad no es válida, se asigna null.
          // TODO: edad = fechaNotificacion - fechaNacimiento [AÑOS], similar a dhis2.
          // El cálculo a partir de esas dos fechas se realiza en el servicio de notificación VigiFlow.
          notificacion.edad = null;
          notificacion.unidadEdadPaciente = null;
          this.logger.warn(`Edad o unidad de edad no válida para paciente con código Vigiflow: ${paciente.codigoVigiflow}`);
        }
        const fechaNotificacion = VigiflowUtils.analizarCadenaFecha(reg['AD']?.toString());
        if (fechaNotificacion) {
          notificacion.fechaNotificacion = fechaNotificacion;
          //fechaLlenadoFicha se actualiza luego al extraer el otro Excel que contiene la hoja "Reportes".
          notificacion.fechaLlenadoFicha = fechaNotificacion;
        }
        const fechaReporte = VigiflowUtils.analizarCadenaFecha(reg['AE']?.toString());
        if (fechaReporte) {
          notificacion.fechaReporteNacional = fechaReporte;
        }

        //Por recomendación del equipo funcional, se asigna un valor estático.
        //Tanto VigiFlow como DHIS2 deben quedar codificados con el mismo literal, sin
        //mencionar el sistema de origen.
        //Si se toma de la hoja Reportes reg['E'], se debe usar updateNotificacion.
        notificacion.medioNotificacion = 'Medio electrónico';
        notificacion.organizacionNotificador = reg['AF']; //Más adelante se actualiza este campo.
        notificacion.codigoVigiflow = reg['B'];
        notificacion.nombreNotificador = reg['AB'];

        // Ubicacion residencia Paciente
        const ubicacionResidenciaPaciente = new UbicacionDto();
        ubicacionResidenciaPaciente.provincia = reg['D'] ? reg['D'].replace(/^(Provincia\s+(de|del)\s+)/i, '').trim().toUpperCase() : 'DESCONOCIDO';
        notificacion.residenciaPaciente = ubicacionResidenciaPaciente;
        // Ubicacion residencia Notificador
        const ubicacionResidenciaNotificador = new UbicacionDto();
        ubicacionResidenciaNotificador.provincia = reg['AC'] ? reg['AC'].replace(/^(Provincia\s+(de|del)\s+)/i, '').trim().toUpperCase() : 'DESCONOCIDO';
        notificacion.residenciaNotificador = ubicacionResidenciaNotificador;

        // AntecedenteEnfermedadesPrevias: en el documento de vigiflow no se encuentran enfermedades previas.

        //Create Gravedad
        const grave = new CreateGravedadEsaviDto();
        // Siempre '0': los casos graves ya fueron descartados al inicio del bucle. TIPO_GRAVEDAD
        // se sigue registrando en TR_GRAVEDAD_ESAVI para dejar explícito el origen del dato.
        grave.tipo = gravedad;

        // Las banderas MUERTE, RIESGO_VIDA, DISCAPACIDAD, HOSPITALIZACION, ANOMALIA_CONGENITA y
        // PARTE_EVENTOS_PREOCUPACION ya no se derivan de la columna Y de esta hoja: su origen es
        // "Criterio (s) de Gravedad" (hoja Reacciones, columna M), donde los valores vienen
        // separados por evento. Se resuelven en consolidarDesenlaceYGravedad().

        // Create Desenlace Esavi
        const desenlaceEsaviDto = new CreateDesenlaceEsaviDto();
        const autopsia = reg['AA'];
        desenlaceEsaviDto.autopsia =
          autopsia && VigiflowUtils.eliminarTildes(autopsia).includes('si')
            ? 1
            : autopsia && VigiflowUtils.eliminarTildes(autopsia).includes('no')
            ? 0
            : 2;
        // COMENTARIO_RESULTADO se retiró de TR_DESENLACE_ESAVI por estar repetida; el estado
        // final del evento se registra homologado en RESULTADO_EVENTO desde la hoja Reacciones.
        // FECHAINICIOINVESTIGACION tampoco se puebla desde VigiFlow: la fecha de investigación
        // vive en TR_INVESTIGACION.FECHA_INVESTIGACION (ver más abajo).

        // Investigación: "Fecha prevista de investigación" (hoja AEFI, columna AL).
        const investigacionDto = new InvestigacionCreateDto();
        investigacionDto.fechaInvestigacion = VigiflowUtils.formatoFecha(reg['AL']?.toString());

        //Create Dato Vacunacion
        const datoVacunacionDto = new CreateDatoVacunacionDto();
        datoVacunacionDto.nombreVacunatorio = reg['AF'];
        datoVacunacionDto.fechaVacunacion = VigiflowUtils.formatoFecha(reg['N']?.toString());

        //Create Dato Vacuna con numeroDosisVacuna. Tomar en cuenta que el resto de campos
        //de CreateDatoVacunaDto se completa en "extractedFromJsonReportToCreateMedicamento".
        const datoVacunaDto = new CreateDatoVacunaDto();
        // El número de dosis debe quedar como entero, sin puntos ni comas.
        datoVacunaDto.numeroDosisVacuna = VigiflowUtils.formatoEnteroSinSeparadores(reg['O']);
        datoVacunaDto.nombreDiluyenteVacuna = reg['Q'] ? reg['Q'].toString().trim() : null;
        datoVacunaDto.numeroLoteDiluyente = reg['R'] ? reg['R'].toString().trim() : null;

        //Paciente Embarazada
        // El estado de embarazo pasó de TR_PACIENTE_EMBARAZADA a TR_ANTECEDENTES_EMBARAZO,
        // donde ya vivían los datos clínicos del embarazo (ambas eran 1:1 con la notificación).
        const embarazada = new CreateAntecedenteEmbarazoDto();
        const esEmbarazada = reg['J'] && VigiflowUtils.eliminarTildes(reg['J']).toLowerCase().includes('si');
        embarazada.momentoEsavi = esEmbarazada ? '1' : '0';

        //Complete the dto
        let create = new CreateCompleteDto();
        create.source = SourceEnum.VIGIFLOW;
        create.pacienteVigiflow = paciente;
        create.notificacion = notificacion;
        create.gravedadEsavi = grave;
        create.desenlaceEsavi = desenlaceEsaviDto;
        create.datoVacunacion = datoVacunacionDto;
        if (investigacionDto.fechaInvestigacion) {
          create.investigacion = investigacionDto;
        }
        //El dato-vacuna "mínimo" siempre aplica: las filas sin vacuna J07 ya se descartaron
        //al inicio del bucle, así que aquí todo caso tiene al menos una vacuna en Medicamentos.
        create.datoVacuna = datoVacunaDto;
        if (esEmbarazada) {
          create.antecedenteEmbarazo = embarazada;
        }
        create = { ...create, ...auditoria };

        const codigoVf = create.pacienteVigiflow?.codigoVigiflow ?? null;
        await this.integradorService.create(
          create,
          codigoVf ? pacienteMap.get(codigoVf) : undefined,
          codigoVf ? notificacionMap.get(codigoVf)?.at(0) : undefined,
        );
      }
    } finally {
      this.datoVacunaService.clearDatoVacunaCache();
    }
  }

  //Extracción de los datos de la hoja [1] de nombre 'Reportes', del libro
  //de Excel 'VigiFlow_Excel_ddmmaaaa_hhmmss.xlsx'. Recordar que la hoja [0], no
  //contiene información. Estos nuevos campos permiten completar la tabla
  //de NOTIFICACON, mediante un proceso de actualización.
  async extractedFromJsonReportToUpdate(workbook2: WorkBook) {
    //Convert file to json
    const ws2 = workbook2.Sheets[workbook2.SheetNames[1]];
    const toUpdate = utils.sheet_to_json(ws2, {
      header: 'A',
      raw: true,
      defval: '',
    });

    const allPatients = await this.pacienteService.findAll();
    const patientMap = new Map(allPatients.map(p => [p.codigoOrigen?.trim(), p]));

    // Precargar notificaciones en bulk para evitar N queries individuales
    const notificacionMapUpdate = await this.notificacionVigiflowService.findAllByCodigosOrigen([...patientMap.keys()]);

    // Precarga en bloque: establecimientos y catálogoPadre para evitar N+1 dentro del loop
    await this.notificacionVigiflowService.preloadBulk();

    // Detectar dinámicamente cuál columna es "Organización (Emisor)"
    let orgCol = 'E'; // valor por defecto
    if (toUpdate.length > 0) {
      const headerRow = toUpdate[0] as Record<string, any>;
      for (const [key, val] of Object.entries(headerRow)) {
        const v = (val ?? '').toString().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (v.includes('ORGANIZACI') && v.includes('EMISOR')) {
          orgCol = key;
          break;
        }
      }
    }

    // Usar for...of para esperar que cada operación asíncrona termine
    for (const reg of toUpdate) {
      const codigoFila = reg['G']?.toString().trim();
      const paciente = patientMap.get(codigoFila) ?? null;

      if (paciente && paciente.id) {
        const notificacion = notificacionMapUpdate.get(codigoFila)?.at(0) ?? null;

        if (notificacion) {
          const updateNotificacion = new UpdateNotificacionDto();
          updateNotificacion.id = notificacion.id;
          updateNotificacion.casoNarrativo = reg['AC'];
          const profesionNotificador = reg['AQ'] && VigiflowUtils.obtenerPrimerComentario(reg['AQ']);
          updateNotificacion.profesionNotificadorParam = profesionNotificador || null;
          updateNotificacion.tipoReporte = reg['N'];
          const fechaRecepcionInicial = VigiflowUtils.analizarCadenaFecha(reg['J']?.toString());
          updateNotificacion.fechaNotificacion = fechaRecepcionInicial;
          updateNotificacion.fechaReporteNacional = fechaRecepcionInicial;
          updateNotificacion.fechaAtencion = fechaRecepcionInicial;
          updateNotificacion.tipoEmisor = reg['F'] ? reg['F'].toString().trim() : null;
          // PESO y ALTURA se retiraron de TR_NOTIFICACION por no ser variables priorizadas.

          // Crear/actualizar notificador: identificacion=col W, nombres=payloadOrigen.reportadoPor (AEFI AB).
          // El snapshot se lee del paciente: dejó de duplicarse en la notificación.
          let notificador = null;
          const especialistaId = reg['W']?.toString().trim();
          if (especialistaId) {
            try {
              const nombresNotificador = paciente.payloadOrigen?.reportadoPor ?? null;
              notificador = await this.notificadorService.createOrUpdate(especialistaId, profesionNotificador, nombresNotificador);
            } catch (error) {
              this.logger.warn(`No se pudo registrar notificador ${especialistaId}: ${error.message}`);
            }
          }

          await this.notificacionVigiflowService.update(notificacion, updateNotificacion, notificador);

          const orgEmisorRaw = reg[orgCol]?.toString().trim();
          await this.notificacionVigiflowService.matchYGrabarEstablecimiento(notificacion.id, orgEmisorRaw);
        }
      }
    }
    this.notificacionVigiflowService.clearBulkCache();
  }

  //Extracción de los datos de la hoja [2] de nombre 'Medicamentos', del libro
  //de Excel 'VigiFlow_Excel_ddmmaaaa_hhmmss.xlsx'.
  async extractedFromJsonReportToCreateMedicamento(workbook2: WorkBook) {
    // Convertir archivo a JSON
    const country = 'ECU';

    const ws2 = workbook2.Sheets[workbook2.SheetNames[2]];
    const toUpdate = utils.sheet_to_json(ws2, {
      header: 'A',
      defval: '',
    });

    const auditoria = this.crearAuditoria();

    const allPatients = await this.pacienteService.findAll();
    const patientMap = new Map(allPatients.map(p => [p.codigoOrigen?.trim(), p]));

    // Precargar notificaciones en bulk para evitar N queries individuales
    const notificacionMapMed = await this.notificacionVigiflowService.findAllByCodigosOrigen([...patientMap.keys()]);

    // Precarga en bloque: medicamentos y datoVacunas para evitar N+1 dentro del loop
    const notifIdsMed = [...notificacionMapMed.values()].flat().map(n => n.id);
    await this.medicamentoService.preloadByNotificacionIds(notifIdsMed);
    await this.datoVacunaService.preloadByNotificacionIds(notifIdsMed);

    // Caché por ejecución del lookup WHODrug (ingrediente|laboratorio), incluye resultados negativos.
    // Varias filas de la hoja suelen repetir la misma vacuna/laboratorio.
    const whodrugVaccineCache = new Map<string, IWhodrugVaccineMatch | null>();

    // Misma idea para la codificación WHODrug (DRUG_CODE y los dos MPID): un lote repite la
    // misma vacuna decenas de veces y cada acierto cuesta una o dos consultas.
    const codificacionVacunaCache = new Map<string, ICodificacionVacunaWhodrug | null>();

    // El bloque de embarazo es único por notificación, pero la edad gestacional viene a nivel de
    // fila (una por medicamento): se retiene la primera fila con un valor válido.
    this.edadGestacionalPorNotificacion.clear();

    try {
      // Iterar con for...of, para esperar que cada operación asíncrona termine.
      // "toUpdate" es un arreglo de objetos JSON, cada uno representa una fila de la hoja "Medicamentos".
      for (const reg of toUpdate) {
        const medNumIdUnicoMundial = reg['A'] ? reg['A'].toString().trim() : null;
        const paciente = patientMap.get(medNumIdUnicoMundial) ?? null;
        if (!paciente) {
          this.logger.warn(`[Medicamentos] Paciente no encontrado para código: "${medNumIdUnicoMundial}" — se omite la fila`);
          continue;
        }

        const notificacionList = notificacionMapMed.get(medNumIdUnicoMundial) ?? [];
        //TODO: Iterar por todas las notificaciones asociadas al paciente (a su código vigiflow).
        //RECORDAR que un código vigiflow puede tener varios ATC asociados además del J07, y un J07
        //no siempre aparece en la primera posición del array notificacionList.
        const notificacionMed = notificacionList.at(0);
        // El paciente puede existir en BD (de importaciones anteriores) sin que este lote le haya
        // creado notificación: la fase AEFI descarta los casos sin vacuna J07 y los graves. Sin
        // notificación no hay a qué colgar el medicamento ni el dato-vacuna, así que se omite la
        // fila en vez de reventar con "Cannot read properties of undefined (reading 'id')".
        if (!notificacionMed) {
          this.logger.warn(
            `[Medicamentos] Sin notificación para el código: "${medNumIdUnicoMundial}" (caso descartado en la hoja AEFI) — se omite la fila`,
          );
          continue;
        }

        let medicamento = new CreateMedicamentoDto();
        medicamento.rolMedicamento = reg['C'];
        medicamento.nombre = reg['D'];
        medicamento.nombreMedPatenteWHODrug = reg['E'] ? VigiflowUtils.limpiarCampoWHODrug(reg['E']) : reg['E'];
        medicamento.codigoATC = reg['G'];
        // Los medicamentos de VigiFlow se codifican siempre con el diccionario WHODrug.
        medicamento.sistemaCodificacion = 'WHODrug';
        // Forma farmacéutica y vía de administración se toman de las columnas EDQM sin modificar.
        medicamento.nombreFormaFarmaceutica = reg['Z'] ? reg['Z'].toString().trim() : null;
        medicamento.nombreViaAdministracion = reg['AB'] ? reg['AB'].toString().trim() : null;
        medicamento = { ...medicamento, ...auditoria };

        // Crear medicamento. "medicamentoService.createOneToOne" filtra los posibles medicamentos
        // duplicados sobre la base de NOTIFICACION_ID, NOMBRE_MEDICAMENTO, y ATC
        await this.medicamentoService.createOneToOne(notificacionMed, medicamento);

        // EDAD_GESTACIONAL (TR_ESAVI_DURANTE_EMBARAZO) desde la columna P "Edad gestacional al
        // momento de la exposición (si es un feto)". Se procesa antes del filtro J07 porque la
        // exposición reportada corresponde a la fila del medicamento, sea vacuna o no.
        // Solo se retiene el valor: FECHAULTIMAMENSTRUACIONESAVI y FECHAPARTOESAVI se derivan de
        // la fecha del ESAVI, que únicamente se conoce al procesar la hoja Reacciones.
        const edadGestacional = VigiflowUtils.formatoEdadGestacional(reg['P']);
        if (edadGestacional !== null && notificacionMed && !this.edadGestacionalPorNotificacion.has(notificacionMed.id)) {
          this.edadGestacionalPorNotificacion.set(notificacionMed.id, edadGestacional);
        }

        const codigoAtcVacunaTransformado = reg['G'] ? VigiflowUtils.extraerCodigoAtcVacuna(reg['G'].toString()) : null;

        // Un dato-vacuna solo se genera a partir de las filas cuya columna "Código(s) ATC" (col G)
        // contiene un código de vacuna J07. Las filas de medicamentos no-vacuna ya quedaron
        // registradas en TR_MEDICAMENTO (arriba) y no deben generar evento de vacunación ni dato-vacuna.
        if (!codigoAtcVacunaTransformado) {
          continue;
        }

        for (const notificacion of notificacionList) {
          // Buscar datoVacuna existente. Se filtra por notificación.id y comprobando que sus campos principales sean NULL o vacíos.
          const datoVacunaList = await this.datoVacunaService.findByNotifIdDtoMinimo(notificacion.id);

          // Guardar INICIO_ADMINISTRACION (col W) y FIN_ADMINISTRACION (col X) en DatoVacunacion.
          // create() tiene lógica upsert: actualiza si ya existe, crea si no existe.
          const dtoDatoVacunacion = new CreateDatoVacunacionDto();
          dtoDatoVacunacion.inicioAdministracion = VigiflowUtils.formatoFecha(reg['W']?.toString());
          // FIN_ADMINISTRACION (col X) se dejó de mapear: la columna se eliminó por no aportar
          // valor al análisis.
          await this.datoVacunacionService.create(notificacion, dtoDatoVacunacion);

          //Este fragmento no solo actualiza registros, también crea nuevos registros de datoVacuna
          //cuando es necesario (ver datoVacunaService al final del bloque).
          const updateDatoVacuna = new UpdateDatoVacunaDto();
          updateDatoVacuna.origen = SourceEnum.VIGIFLOW;
          // ACCION_TOMADA, INTERVALO_DOSIFICACION y DOSIS_DE_APLICACION se retiraron de
          // TR_DATO_VACUNA por no ser variables priorizadas para el análisis.
          updateDatoVacuna.dosis = reg['S'];
          // DURACION_TRATAMIENTO (col V) se dejó de mapear: la columna se retiró de
          // TR_DATO_VACUNA por no aportar valor al análisis.
          updateDatoVacuna.formaFarmaceutica = reg['Y'];
          updateDatoVacuna.formaFarmaceuticaEDQM = reg['Z'];
          updateDatoVacuna.viaAdministracion = reg['AA'];
          updateDatoVacuna.viaAdministracionEDQM = reg['AB'];
          //TODO: En caso de necesitar solo una lista fija de paises autorizados, lo más eficiente es
          //implementar un diccionario con la equivalencia del código ISO3 alfa-3 o catálogo de países autorizados.
          updateDatoVacuna.paisAutorizacionIso3Code = reg['J'] ? countries.getAlpha3Code(reg['J'].toString().toUpperCase(), idiomaParaPaisIso3Code) : 'ECU';
          updateDatoVacuna.numeroLote = reg['AE'] && VigiflowUtils.transformarLoteVacuna(reg['AE']);
          // INDICACION_MEDDRA se retiró de TR_DATO_VACUNA por no ser variable priorizada.

          const nombreVacPatenteWHODrugVigiFlow = reg['E'] ? VigiflowUtils.limpiarCampoWHODrug(reg['E']) : reg['E'];
          // El nombre con el que VigiFlow reporta la vacuna se persiste aparte, en
          // NOMBRE_VACUNA_REPORTADO. Antes se usaba como valor por defecto de DRUG_NAME y el
          // match WHODrug lo sobrescribía, así que el nombre original se perdía y DRUG_NAME
          // mezclaba valores homologados con texto libre. DRUG_NAME queda ahora reservado al
          // nombre oficial WHODrug: si no hay match, se queda null y eso es información útil.
          updateDatoVacuna.nombreVacunaReportado = nombreVacPatenteWHODrugVigiFlow;

          // Reemplaza comas o saltos de línea por punto y coma.
          const principioActivoWHODrugVigiFlow = reg['F'] ? VigiflowUtils.limpiarCampoWHODrug(reg['F']) : reg['F'];
          //Se asigna esta columna porque la mayoría ya viene con la traducción al español.
          updateDatoVacuna.acIngredientTranslationJson = VigiflowUtils.parseIngredientsWithSemicolonsToJson(principioActivoWHODrugVigiFlow);
          updateDatoVacuna.codigoAtc = codigoAtcVacunaTransformado;
          updateDatoVacuna.rolVacuna = reg['C'];

          //ConfigService devuelve strings desde .env: 'false' sería truthy, por eso se compara explícitamente.
          const whodrugGlobalFlag = this.configService.get('VIGIFLOW_USE_WHODRUG_GLOBAL', false);
          const utilizarSoloDiccionarioWhodrugGlobalUmc = whodrugGlobalFlag === true || whodrugGlobalFlag === 'true' || whodrugGlobalFlag === '1';
          if (utilizarSoloDiccionarioWhodrugGlobalUmc) {
            //Estandarización primaria: buscar 1 solo registro WHODrug por principio activo (col F)
            //+ laboratorio titular del registro (col I). Si col F trae varios ingredientes separados
            //por ';', se itera en orden y gana el primer match.
            const laboratorioTitular = reg['I'] ? reg['I'].toString().trim() : null;
            let whodrugMatch: IWhodrugVaccineMatch | null = null;
            if (laboratorioTitular && principioActivoWHODrugVigiFlow) {
              const ingredientes = principioActivoWHODrugVigiFlow
                .split(';')
                .map((ing) => ing.trim())
                .filter((ing) => ing !== '');
              for (const ingrediente of ingredientes) {
                const cacheKey = `${ingrediente}|${laboratorioTitular}`;
                if (whodrugVaccineCache.has(cacheKey)) {
                  whodrugMatch = whodrugVaccineCache.get(cacheKey);
                } else {
                  whodrugMatch = await this.ingredientTranslationService.findVaccineByIngredientAndMaholder(ingrediente, laboratorioTitular, country);
                  whodrugVaccineCache.set(cacheKey, whodrugMatch);
                }
                if (whodrugMatch) break;
              }
            }

            if (whodrugMatch) {
              // DRUG_CODE, MEDICINAL_PRODUCT_ID y MA_HOLDER_MEDI_PROD_ID ya no se
              // resuelven aquí: su identificación se rehará con otra lógica. Lo que este
              // cruce sigue aportando es el nombre estandarizado y el titular.
              updateDatoVacuna.drugName = whodrugMatch.drugName;
              updateDatoVacuna.maHolder = whodrugMatch.maHolder;
            } else {
              //Fallback: estandarización por nombre de patente (col E), utilizando el diccionario
              //oficial de WHODrug Global de Uppsala Monitoring Centre.
              const whodrug: any[] = await this.drugService.getDrugsOnly(nombreVacPatenteWHODrugVigiFlow, country);
              if (whodrug.length > 0) {
                updateDatoVacuna.drugName = whodrug[0]?.drugName;

                const mah = await this.maholderService.getMaholderOfDrug(whodrug[0]?.id, country);
                // Se genera un valor compatible con JSONB; el mapeo a JSONB ocurre en la capa de persistencia (ORM/driver + PostgreSQL).
                updateDatoVacuna.maHolderJsonb = mah.map((item) => ({
                  name: item.name,
                  medicinalProductID: item.medicinalProductID, // El MPID principal del medicamento es diferente al valor del MPID del maHolder.
                }));

                // Del primer titular sólo se conserva el nombre (MA_HOLDER). Los dos MPID
                // que antes se derivaban aquí —MAHOLDER.MEDICINAL_PRODUCT_ID y
                // COUNTRY_SALES.COS_MEDICINAL_PRODUCT_ID— se retiraron junto con DRUG_CODE.
                const maHolderPrincipal = mah[0];
                if (maHolderPrincipal) {
                  updateDatoVacuna.maHolder = maHolderPrincipal.name;
                }

                const ingredentActive = await this.activeIngredentService.getActiveIngredentsOfDrug(whodrug[0]?.id);
                updateDatoVacuna.activeIngredientJson = ingredentActive.map((item) => ({
                  ingredient: item.ingredient, //La propiedad "ingredient" solo es etiqueta y se convertirá en la clave dentro del objeto JSON.
                }));

                if (ingredentActive.length > 0 && !updateDatoVacuna.acIngredientTranslationJson) {
                  // Para cada ingrediente activo, obtener su traducción en español.
                  // TODO: si la traducción es null, usar ingredient.ingredient o mapear desde el Excel.
                  //Es probable que no sea necesario, porque desde VigiFlow ya vienen traducidos varios ingredientes activos.
                  updateDatoVacuna.acIngredientTranslationJson = await Promise.all(
                    ingredentActive.map(async (ingredient) => ({
                      ingredient: await this.activeIngredentService.getIngredientTranslation(ingredient.id, 'es-ES'),
                    })),
                  );
                }
              }
            }
          }

          /*
           * Codificación WHODrug: DRUG_CODE, MEDICINAL_PRODUCT_ID y MA_HOLDER_MEDI_PROD_ID.
           *
           * Va fuera del bloque anterior y no depende de VIGIFLOW_USE_WHODRUG_GLOBAL: es la
           * estrategia definida para todo lo que entre por VigiFlow, y esa bandera viene en
           * `false` por defecto, con lo que dentro no se ejecutaría nunca.
           *
           * El principio activo se toma en crudo de la columna F, no de
           * `principioActivoWHODrugVigiFlow`: `limpiarCampoWHODrug` sustituye las comas por
           * punto y coma, y eso rompería la igualdad exacta contra INT_INGREDIENT en
           * cualquier ingrediente que lleve coma en su nombre.
           */
          const principioActivoCrudo = reg['F'] ? reg['F'].toString() : null;
          const laboratorioTitularCrudo = reg['I'] ? reg['I'].toString() : null;
          // Columna E en crudo, por el mismo motivo que la F: `limpiarCampoWHODrug`
          // sustituye comas por punto y coma y alteraría el parecido contra DRU_NAME.
          const nombreMedicamentoCrudo = reg['E'] ? reg['E'].toString() : null;
          if (principioActivoCrudo?.trim()) {
            const claveCodificacion = [
              principioActivoCrudo.trim(),
              laboratorioTitularCrudo?.trim() ?? '',
              nombreMedicamentoCrudo?.trim() ?? '',
            ].join('|');
            let codificacion: ICodificacionVacunaWhodrug | null;
            if (codificacionVacunaCache.has(claveCodificacion)) {
              codificacion = codificacionVacunaCache.get(claveCodificacion);
            } else {
              codificacion = await this.ingredientTranslationService.buscarCodificacionVacuna(
                principioActivoCrudo,
                laboratorioTitularCrudo,
                nombreMedicamentoCrudo,
              );
              codificacionVacunaCache.set(claveCodificacion, codificacion);
            }

            if (codificacion) {
              updateDatoVacuna.drugCode = codificacion.drugCode;
              updateDatoVacuna.medicinalProductId = codificacion.medicinalProductId;
              updateDatoVacuna.maHolderMedicinalProductId = codificacion.maHolderMedicinalProductId;
              // El nombre y el titular salen de la misma fila que los códigos: si se
              // dejaran los que resolvió el bloque anterior, DRUG_NAME podría describir un
              // medicamento distinto del que identifica DRUG_CODE.
              updateDatoVacuna.drugName = codificacion.drugName;
              updateDatoVacuna.maHolder = codificacion.maHolder;
            }
          }

          if (datoVacunaList.length > 0) {
            //Actualizar el datoVacuna 'mínimo' existente, asociado a la notificación. Se denomina "mínimo"
            //porque no todas las columnas se encuentran en esta hoja Excel, y fue creado inicialmente con los
            //datos de la hoja AEFI. La cantidad de registros únicos será igual a la cantidad de notificaciones
            //asociadas al paciente.
            await this.datoVacunaService.update(datoVacunaList[0].id, updateDatoVacuna);
            // Invalidar caché mínimo para evitar doble-update si el mismo paciente tiene varios ATCs J07
            this.datoVacunaService.invalidateMinimoEntry(notificacion.id, datoVacunaList[0].id);
          } else {
            //Crear un registro completamente nuevo de DatoVacuna asociado a la notificación.
            //"createByNotificacion" utiliza filtros internos de TypeORM para evitar duplicados.
            //TODO: Evaluar si es necesario implementar una lógica para evitar la creación de registros duplicados en DatoVacuna.
            //TODO: Solicitar indicaciones al personal funcional, sobre el manejo del número de dosis que normalmente viene de la hoja AEFI en un DTO mínimo.
            await this.datoVacunaService.createByNotificacion(notificacion, updateDatoVacuna as CreateDatoVacunaDto);
          }
        }
      }
    } finally {
      this.medicamentoService.clearMedicamentosCache();
      this.datoVacunaService.clearDatoVacunaCache();
    }
  }

  //Extracción de los datos de la hoja [3] de nombre 'Reacciones', del libro
  //de Excel 'VigiFlow_Excel_ddmmaaaa_hhmmss.xlsx'.
  // Cada celda puede contener múltiples valores separados por \n (un valor por evento ESAVI).
  async extractedFromJsonReportToCreateReaccion(workbook2: WorkBook) {
    //Convert file to json
    const ws3 = workbook2.Sheets[workbook2.SheetNames[3]];
    const toCreate = utils.sheet_to_json(ws3, {
      header: 'A',
      defval: '',
    });

    const auditoria = this.crearAuditoria();

    // Se cargan todos los pacientes (sin filtro isActive) para no perder ninguna reacción
    const allPatients = await this.pacienteService.findAll();
    const patientMap = new Map(allPatients.map(p => [p.codigoOrigen?.trim(), p]));

    // Precargar notificaciones en bulk para evitar N queries individuales
    const notificacionMapReac = await this.notificacionVigiflowService.findAllByCodigosOrigen([...patientMap.keys()]);

    // La primera fila de la hoja es el encabezado; se omite explícitamente
    for (const reg of toCreate.slice(1)) {
      const caseCode = reg['A']?.toString().trim();
      if (!caseCode) continue;

      const paciente = patientMap.get(caseCode) ?? null;
      if (!paciente) {
        this.logger.warn(`[Reacciones] Paciente no encontrado para código: "${caseCode}" — se omite la fila`);
        continue;
      }

      const notificacion = notificacionMapReac.get(caseCode)?.at(0) ?? null;
      if (!notificacion) {
        this.logger.warn(`[Reacciones] Notificación no encontrada para paciente ${paciente.codigoOrigen} — se omite la fila`);
        continue;
      }

      // Cada celda puede tener múltiples valores separados por \n (un evento ESAVI por línea)
      const nombresLLT        = VigiflowUtils.splitLineas(reg['D']?.toString() ?? '');
      const nombresReportados = VigiflowUtils.splitLineas(reg['C']?.toString() ?? '');
      const nombresPT         = VigiflowUtils.splitLineas(reg['E']?.toString() ?? '');
      const nombresHLT        = VigiflowUtils.splitLineas(reg['F']?.toString() ?? '');
      const nombresHLGT       = VigiflowUtils.splitLineas(reg['G']?.toString() ?? '');
      const nombresSOC        = VigiflowUtils.splitLineas(reg['H']?.toString() ?? '');
      const fechasInicio      = VigiflowUtils.splitLineas(reg['I']?.toString() ?? '');
      const fechasFin         = VigiflowUtils.splitLineas(reg['J']?.toString() ?? '');
      const duraciones        = VigiflowUtils.splitLineas(reg['K']?.toString() ?? '');
      const resultados        = VigiflowUtils.splitLineas(reg['N']?.toString() ?? '');
      const criteriosGravedad = VigiflowUtils.splitLineas(reg['M']?.toString() ?? '');

      // El evento se cuenta por la columna D (LLT MedDRA), pero VigiFlow no siempre alcanza a
      // codificar la reacción: en esos casos D viene vacía y el evento solo existe como texto
      // libre del notificador (columna C). Antes la fila se descartaba y el caso quedaba sin
      // ningún ESAVI en la app; ahora se registra con el nombre reportado y sin codificación
      // MedDRA, que puede completarse después.
      const eventos = nombresLLT.length > 0 ? nombresLLT : nombresReportados;
      const totalEventos = eventos.length;
      if (totalEventos === 0) {
        this.logger.warn(
          `[Reacciones] Fila sin evento (columnas C y D vacías) para notificación ${notificacion.codigoOrigenNotificacion}`,
        );
        continue;
      }

      for (let i = 0; i < totalEventos; i++) {
        const nombreLLT = nombresLLT[i]?.trim() ?? '';
        const nombreReportado = nombresReportados[i]?.trim() ?? '';
        if (!nombreLLT && !nombreReportado) continue;

        try {
          let datoEsavi = new CreateDatoEsaviDto();
          datoEsavi = { ...datoEsavi, ...auditoria };

          // NOMBRE_ESAVI guarda el término estandarizado (LLT MedDRA, columna D) y
          // NOMBRE_ESAVI_REPORTADO el texto libre del notificador (columna C). Antes ambos
          // valores caían en NOMBRE_ESAVI_REPORTADO, lo que dejaba el dato estandarizado en el
          // campo "reportado" y NOMBRE_ESAVI vacío: la semántica quedaba invertida.
          // VigiFlow no siempre alcanza a codificar la reacción; cuando D viene vacía el evento
          // queda sin término estandarizado y solo con el texto reportado, que puede homologarse
          // después.
          datoEsavi.nombre = nombreLLT
            ? VigiflowUtils.eliminarSaltoLinea(nombreLLT.toUpperCase())
            : null;
          datoEsavi.nombreReportado = nombreReportado
            ? VigiflowUtils.eliminarSaltoLinea(nombreReportado.toUpperCase())
            : null;
          datoEsavi.tipoRegistro = TipoRegistroEsaviEnum.REACCION;
          datoEsavi.fechaEsavi = VigiflowUtils.formatoFecha(fechasInicio[i] ?? '');
          datoEsavi.fechaFinalizacion = VigiflowUtils.formatoFecha(fechasFin[i] ?? '');
          datoEsavi.duracion = duraciones[i] ?? null;
          // RESULTADO_EVENTO se retiró de TR_DATOS_ESAVI; se consolida por notificación en
          // TR_DESENLACE_ESAVI al terminar de recorrer los eventos de la fila.
          datoEsavi.nameLLT = nombreLLT ? nombreLLT.toUpperCase() : null;
          datoEsavi.namePT = (nombresPT[i] ?? '').toUpperCase() || null;
          datoEsavi.nameHLT = (nombresHLT[i] ?? '').toUpperCase() || null;
          datoEsavi.nameHLGT = (nombresHLGT[i] ?? '').toUpperCase() || null;
          datoEsavi.nameSOC = (nombresSOC[i] ?? '').toUpperCase() || null;

          // Buscar el LLT en MEDDRA.MED_LLT comparando NAME en mayúsculas (similitud >= 90%).
          // Una sola búsqueda resuelve CODIGO_ESAVI_MEDDRA_LLT y CODIGO_ESAVI_CIE10, ya que el
          // diccionario MedDRA trae el CIE-10 equivalente en la propia fila del LLT.
          // Sin LLT no hay nada que buscar: el evento queda sin codificación MedDRA.
          const meddraLlt = nombreLLT ? await this.meddraLltService.buscarPorSimilitud(nombreLLT) : null;
          datoEsavi.codigoLLT = meddraLlt?.code ?? null;
          datoEsavi.codigoEsaviCie10 = meddraLlt?.icd10Code ?? null;

          const meddraPT = await this.meddraPtService.searchPT(nombresPT[i] ?? '');
          const meddraSOC = await this.meddraSocService.searchSOC(nombresSOC[i] ?? '');

          datoEsavi.CTPTMEDDRA_ID = meddraPT?.id ?? null;
          datoEsavi.CTSOCMEDDRA_ID = meddraSOC?.id ?? null;

          datoEsavi.codigoPT = meddraPT?.code ?? null;
          datoEsavi.codigoSOC = meddraSOC?.code ?? null;

          // COGIDO_CASO se retiró de TR_DATOS_ESAVI: era una copia del código de la
          // notificación en cada evento. El caso se identifica por la FK NOTIFICACION_ID.
          await this.datoEsaviService.createVigiflow(notificacion, datoEsavi);
        } catch (err) {
          this.logger.error(
            `[Reacciones] Error procesando evento "${nombreLLT || nombreReportado}" [i=${i}] para notificación ${notificacion.codigoOrigenNotificacion}: ${err.message}`,
          );
          // Continúa con el siguiente evento sin detener el procesamiento
        }
      }

      // Consolidación por notificación (los datos de la fila aplican a todos sus eventos).
      await this.consolidarDesenlaceYGravedad(notificacion, resultados, criteriosGravedad);
      await this.registrarEmbarazoEsavi(notificacion, fechasInicio);
    }
  }

  /**
   * Registra en TR_DESENLACE_ESAVI el estado final homologado del evento y actualiza en
   * TR_GRAVEDAD_ESAVI las banderas que dependen de "Criterio (s) de Gravedad".
   * Cuando la fila reporta varios eventos, RESULTADO_EVENTO se resuelve por prioridad de
   * severidad (5 > 4 > 3 > 2 > 1 > 0).
   */
  private async consolidarDesenlaceYGravedad(
    notificacion: any,
    resultados: string[],
    criteriosGravedad: string[],
  ): Promise<void> {
    const criteriosUnidos = criteriosGravedad.join(' ');

    try {
      const desenlace = new CreateDesenlaceEsaviDto();
      desenlace.resultadoEvento = VigiflowUtils.seleccionarResultadoPrioritario(resultados, criteriosGravedad);
      await this.desenlaceEsaviService.create(notificacion, desenlace);
    } catch (error) {
      this.logger.warn(
        `[Reacciones] No se pudo registrar RESULTADO_EVENTO para la notificación ${notificacion.codigoOrigenNotificacion}: ${error.message}`,
      );
    }

    try {
      const grave = new CreateGravedadEsaviDto();
      grave.muerte = VigiflowUtils.marcarCriterioGravedad(criteriosUnidos, 'muerte');
      grave.riesgoVida = VigiflowUtils.marcarCriterioGravedad(criteriosUnidos, 'amenaza');
      grave.discapacidad = VigiflowUtils.marcarCriterioGravedad(criteriosUnidos, 'discapacidad');
      grave.hospitalizacion = VigiflowUtils.marcarCriterioGravedad(criteriosUnidos, 'hospitalizacion');
      grave.anomaliaCongenita = VigiflowUtils.marcarCriterioGravedad(criteriosUnidos, 'anomalia');
      grave.parteEventosPreocupacion = VigiflowUtils.marcarCriterioGravedad(
        criteriosUnidos,
        'otra condicion medica importante',
      );
      // Regla de consistencia: criterio "Muerte" implica MUERTE = 1 y RESULTADO_EVENTO = 5.
      await this.gravedadEsaviService.create(notificacion, grave);
    } catch (error) {
      this.logger.warn(
        `[Reacciones] No se pudieron actualizar los criterios de gravedad de la notificación ${notificacion.codigoOrigenNotificacion}: ${error.message}`,
      );
    }
  }

  /**
   * Registra en TR_ESAVI_DURANTE_EMBARAZO la edad gestacional capturada en la hoja Medicamentos
   * junto con las fechas derivadas, que dependen de la fecha del ESAVI (inicio de síntomas).
   * Se usa la fecha de inicio más antigua de la fila, por ser el comienzo del cuadro clínico.
   */
  private async registrarEmbarazoEsavi(notificacion: any, fechasInicio: string[]): Promise<void> {
    const edadGestacional = this.edadGestacionalPorNotificacion.get(notificacion.id);
    if (edadGestacional === undefined) return;

    const fechaEsavi = fechasInicio
      .map((fecha) => VigiflowUtils.formatoFecha(fecha))
      .filter((fecha): fecha is Date => fecha !== null)
      .sort((a, b) => a.getTime() - b.getTime())
      .at(0);

    if (!fechaEsavi) {
      this.logger.warn(
        `[Reacciones] Sin fecha de ESAVI para derivar las fechas de embarazo de la notificación ${notificacion.codigoOrigenNotificacion}`,
      );
      return;
    }

    try {
      const embarazo = new CreateEmbarazoEsaviDto();
      embarazo.edadGestacional = edadGestacional;
      embarazo.fechaUltimaMenstruacion = VigiflowUtils.calcularFechaUltimaMenstruacion(fechaEsavi, edadGestacional);
      embarazo.fechaParto = VigiflowUtils.calcularFechaParto(embarazo.fechaUltimaMenstruacion);
      await this.embarazoEsaviService.create(notificacion, embarazo);
    } catch (error) {
      this.logger.warn(
        `[Reacciones] No se pudo registrar el embarazo durante el ESAVI de la notificación ${notificacion.codigoOrigenNotificacion}: ${error.message}`,
      );
    }
  }
}
