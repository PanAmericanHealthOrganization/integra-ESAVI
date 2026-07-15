import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs/promises';
import * as countries from 'i18n-iso-countries';
import * as enLocale from 'i18n-iso-countries/langs/en.json';
import * as esLocale from 'i18n-iso-countries/langs/es.json';
import { SyncStatus } from 'src/integrator/entity';
import { IAuditoria } from 'src/integrator/entity/auditoria.entity';
import { DatoEsaviService } from 'src/integrator/service/dato-esavi.service';
import { SyncService } from 'src/integrator/service/sync.service';
import { MeddraLLTService } from 'src/meddra/services/meddra-lt.service';
import { MeddraPtService } from 'src/meddra/services/meddra-pt.service';
import { MeddraSocService } from 'src/meddra/services/meddra-soc.service';
import { IWhodrugVaccineMatch } from 'src/whodrugs/models/dtos';
import { ActiveIngredientsService } from 'src/whodrugs/services/activeIngredients.service';
import { DrugService } from 'src/whodrugs/services/drugs.service';
import { IngredientTranslationService } from 'src/whodrugs/services/ingredientsTraslations.service';
import { MaholderService } from 'src/whodrugs/services/maholder.service';
import { read, utils, WorkBook } from 'xlsx';
import {
  CreateCompleteDto,
  CreateDatoEsaviDto,
  CreateDatoVacunacionDto,
  CreateDatoVacunaDto,
  CreateDesenlaceEsaviDto,
  CreateGravedadEsaviDto,
  CreateMedicamentoDto,
  CreateNotificacionDto,
  CreatePacienteEmbarazadaDto,
  CreatePacienteVigiflowDto,
  UbicacionDto,
  UpdateDatoVacunaDto,
  UpdateNotificacionDto,
} from '../../integrator/dto';
import { SourceEnum } from '../../integrator/enum/source-enum';
import { IntegradorService } from '../../integrator/facade/integrador.service';
import { DatoVacunaService } from '../../integrator/service/dato-vacuna.service';
import { DatoVacunacionService } from '../../integrator/service/dato-vacunacion.service';
import { MedicamentoService } from '../../integrator/service/medicamento.service';
import { NotificacionVigiflowService } from '../../integrator/service/notificacion-vigiflow.service';
import { NotificadorService } from '../../integrator/service/notificador.service';
import { PacienteService } from '../../integrator/service/paciente.service';
import { VigiflowUtils } from '../utils/vigiflow-utils.module';
import { VigiflowCrawlerService } from './vigiflow-crawler.service';

const profesiones = [
  'AUXILIAR',
  'ENFERMERA',
  'ESTUDIANTE',
  'FARMACEUTICO',
  'INTERNO',
  'MEDICO',
  'CONSUMIDOR U OTRO PROFESIONAL',
  'OTRO PROFESIONAL DE LA SALUD',
];

//--- Registrar idiomas
countries.registerLocale(enLocale);
countries.registerLocale(esLocale);
const idiomaParaPaisIso3Code = 'es';

@Injectable()
export class VigiflowIntegradorService {
  private readonly logger = new Logger(VigiflowIntegradorService.name);

  private originalFechaInicio: Date;
  private fechaInicio: Date;

  constructor(
    private readonly vigiflowCrawlerService: VigiflowCrawlerService,
    private readonly configService: ConfigService,
    private readonly integradorService: IntegradorService,
    private readonly pacienteService: PacienteService,
    private readonly notificacionVigiflowService: NotificacionVigiflowService,
    private readonly notificadorService: NotificadorService,
    private readonly medicamentoService: MedicamentoService,
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
  ) {
    const fechaInicioStr = this.configService.get<string>('VIGIFLOW_FECHA_INICIO_CRON', '2024-11-01');
    this.originalFechaInicio = new Date(`${fechaInicioStr}T00:00:00.000Z`);
    this.fechaInicio = this.originalFechaInicio;
  }

  // 0 23 L * * -- Ejecución fin de mes
  // 0 23 1 * * -- Ejecucion inicio de mes
  @Cron('0 23 1 * *')
  private async handleCron() {
    const now = new Date();

    // Procesar mes a mes mientras fechaInicio sea menor que la fecha actual
    while (this.fechaInicio < now) {
      // Fecha de fin: último día del mes de fechaInicio (UTC)
      const fechaFin = new Date(Date.UTC(
        this.fechaInicio.getUTCFullYear(),
        this.fechaInicio.getUTCMonth() + 1,
        0, 23, 59, 59, 999,
      ));
      await this.createInBulk(this.fechaInicio, fechaFin);

      this.logger.log(
        `Procesado desde ${this.fechaInicio.toISOString()} hasta ${fechaFin.toISOString()}`,
      );
      // Avanzar fechaInicio al primer día del siguiente mes (UTC)
      this.fechaInicio = new Date(Date.UTC(
        this.fechaInicio.getUTCFullYear(),
        this.fechaInicio.getUTCMonth() + 1,
        1, 0, 0, 0, 0,
      ));
    }

    // Al alcanzar la fecha actual, reiniciar fechaInicio a la fecha original
    if (this.fechaInicio >= now) {
      this.fechaInicio = this.originalFechaInicio;
    }
  }

  /* ARCHIVOS ORIGEN REMOTO */
  async createInBulk(fechaInicio: Date, fechaFin: Date, codigoATC = 'J07') {
    if (fechaFin <= fechaInicio) {
      throw new BadRequestException();
    }
    // Las fechas se envían con el formato YYYYMMDD, ejm: 20230113
    const fechaInicioFmrt = VigiflowUtils.formatoYYYYMMDD(fechaInicio);
    const fechaFinFmrt = VigiflowUtils.formatoYYYYMMDD(fechaFin);

    await this.ejecutarConRegistroSync(
      'VIGIFLOW_BULK',
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

        await this.procesarWorkbooks(reportOne, reportTwo);
      },
      fechaInicio,
      fechaFin,
    );
  }

  /* ARCHIVOS LOCALES */
  public async createInBulkFromFile() {
    const aefiFilePath = this.configService.get<string>('VIGIFLOW_FILE_AEFI', './upload_files/files_meddra/aefi.xlsx');
    const reportFilePath = this.configService.get<string>('VIGIFLOW_FILE_REPORT', './upload_files/files_meddra/report.xlsx');
    const reportOne = read(await fs.readFile(aefiFilePath));
    const reportTwo = read(await fs.readFile(reportFilePath));
    await this._processBulkWorkbooks(reportOne, reportTwo, 'VIGIFLOW_BULK_FILE');
  }

  public async createInBulkFromUploadedFiles(aefiBuffer: Buffer, reportBuffer: Buffer) {
    const reportOne = read(aefiBuffer);
    const reportTwo = read(reportBuffer);
    await this._processBulkWorkbooks(reportOne, reportTwo, 'VIGIFLOW_BULK_UPLOAD');
  }

  private async _processBulkWorkbooks(reportOne: WorkBook, reportTwo: WorkBook, syncName: string) {
    await this.ejecutarConRegistroSync(
      syncName,
      'Importación VigiFlow desde archivo completada',
      () => this.procesarWorkbooks(reportOne, reportTwo),
    );
  }

  /**
   * Pipeline de extracción común a todos los orígenes (remoto, archivo local, upload).
   */
  private async procesarWorkbooks(reportOne: WorkBook, reportTwo: WorkBook) {
    // La hoja AEFI se procesa primero y NO contiene el código ATC (vive en la hoja Medicamentos).
    // Se pre-calcula qué pacientes tienen al menos una vacuna J07 para no crear un dato-vacuna
    // "mínimo" a pacientes cuyo reporte no incluye ninguna vacuna J07.
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
   * Crea el registro de sincronización, ejecuta el proceso y actualiza el registro
   * a COMPLETED o FAILED según el resultado.
   */
  private async ejecutarConRegistroSync(
    syncName: string,
    mensajeExito: string,
    proceso: () => Promise<void>,
    dataStartDate: Date | null = null,
    dataEndDate: Date | null = null,
  ) {
    const syncRecord = await this.syncService.createSyncProcess({
      name: syncName,
      status: SyncStatus.RUNNING,
      startTime: new Date(),
      endTime: null,
      dataStartDate,
      dataEndDate,
      message: null,
      errorMessage: null,
      errorStack: null,
      errorTrace: null,
      createdAt: new Date(),
      createdBy: 'System',
      updatedAt: new Date(),
      updatedBy: 'System',
      deletedAt: null,
      deletedBy: null,
      isEnabled: true,
      isActive: true,
    });

    try {
      await proceso();
      await this.syncService.update(syncRecord.id, {
        status: SyncStatus.COMPLETED,
        endTime: new Date(),
        message: mensajeExito,
      });
    } catch (error) {
      await this.syncService.update(syncRecord.id, {
        status: SyncStatus.FAILED,
        endTime: new Date(),
        errorMessage: error?.message ?? String(error),
        errorStack: error?.stack ?? null,
      });
      throw error;
    }
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
   * Sirve para que la fase AEFI —que se ejecuta antes y no tiene el ATC— sepa a qué pacientes
   * corresponde crear un dato-vacuna.
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

        const origenOriginal = {
          iniciales: reg['C'] ?? null,
          identificacion: reg['E'] ?? null,
          sexo: reg['F'] ?? null,
          fechaNacimiento: reg['G'] ?? null,
          edad: reg['H'] ?? null,
          unidadEdad: reg['I'] ?? null,
          reportadoPor: reg['AB'] ? reg['AB'].toString().trim() : null,
        };
        paciente.origenOriginal = origenOriginal;

        // Create Notificacion
        const notificacion = new CreateNotificacionDto();
        notificacion.origenOriginal = origenOriginal;
        const fechaNacimiento = VigiflowUtils.analizarCadenaFecha(reg['G']?.toString());
        if (fechaNacimiento) {
          notificacion.fechaNacimiento = fechaNacimiento;
          //Para no repetir la extracción, simplemente se asigna la fecha de nacimiento al paciente desde la notificación.
          paciente.fechaNacimiento = fechaNacimiento;
        }

        // Al momento la edad y su unidad se toman directamente del excel. Los cálculos
        // que se hacen en el documento "notificacion-vigiflow.service.ts" son
        // únicamente para calcular el grupo etario.
        const edad = VigiflowUtils.formatoInteger(reg['H']);
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
        //Si se toma de la hoja Reportes reg['E'], se debe usar updateNotificacion.
        notificacion.medioNotificacion = 'Medio electrónico VigiFlow';
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
        let gravedad = '0'; //'NO GRAVE'
        const tipoGravedad = reg['X'];
        if (tipoGravedad && tipoGravedad.toUpperCase().includes('S')) {
          gravedad = '1'; //'GRAVE'
        }
        grave.tipo = gravedad;

        const eventosImportantes = reg['Y'];
        //Nota: el DTO declara estos campos como string, pero históricamente se les asigna el resultado
        //booleano de includes(); se mantiene "any" para no alterar los datos persistidos.
        const cadenaNormalizada: any = VigiflowUtils.eliminarTildes(eventosImportantes && eventosImportantes.toLowerCase());
        grave.muerte = cadenaNormalizada && cadenaNormalizada.includes('muerte');
        grave.riesgoVida = cadenaNormalizada && cadenaNormalizada.includes('amenaza');
        grave.discapacidad = cadenaNormalizada && cadenaNormalizada.includes('discapacidad');
        grave.hospitalizacion = cadenaNormalizada && cadenaNormalizada.includes('hospitalizacion');
        grave.anomaliaCongenita = cadenaNormalizada && cadenaNormalizada.includes('anomalia');

        // Create Desenlace Esavi
        const desenlaceEsaviDto = new CreateDesenlaceEsaviDto();
        const autopsia = reg['AA'];
        desenlaceEsaviDto.autopsia =
          autopsia && VigiflowUtils.eliminarTildes(autopsia).includes('si')
            ? 1
            : autopsia && VigiflowUtils.eliminarTildes(autopsia).includes('no')
            ? 0
            : 2;
        desenlaceEsaviDto.comentarioResultado = reg['Z'] && VigiflowUtils.obtenerPrimerComentario(reg['Z']); // Guarda solo el primer comentario, hasta encontrar un salto de linea
        const fechaInvestigacion = VigiflowUtils.formatoFecha(reg['AM']?.toString());
        if (fechaInvestigacion) {
          desenlaceEsaviDto.fechaInicioInvestigacion = fechaInvestigacion;
        }

        //Create Dato Vacunacion
        const datoVacunacionDto = new CreateDatoVacunacionDto();
        datoVacunacionDto.nombreVacunatorio = reg['AF'];
        datoVacunacionDto.fechaVacunacion = VigiflowUtils.formatoFecha(reg['N']?.toString());

        //Create Dato Vacuna con numeroDosisVacuna. Tomar en cuenta que el resto de campos
        //de CreateDatoVacunaDto se completa en "extractedFromJsonReportToCreateMedicamento".
        const numeroDosisVacuna = reg['O'] && reg['O'].match(/\d+/) ? parseInt(reg['O'].match(/\d+/)[0], 10) : null;
        const datoVacunaDto = new CreateDatoVacunaDto();
        datoVacunaDto.numeroDosisVacuna = numeroDosisVacuna;

        //Paciente Embarazada
        const embarazada = new CreatePacienteEmbarazadaDto();
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
        //Solo se crea el dato-vacuna "mínimo" si el paciente tiene una vacuna J07 en la hoja Medicamentos.
        //Sin J07 el reporte no contiene vacuna, así que no debe generarse ningún dato-vacuna.
        if (paciente.codigoVigiflow && codigosPacientesConVacunaJ07.has(paciente.codigoVigiflow)) {
          create.datoVacuna = datoVacunaDto;
        }
        if (esEmbarazada) {
          create.pacienteEmbarazada = embarazada;
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
          updateNotificacion.profesionNotificadorParam = VigiflowUtils.encontrarCoincidencia(profesionNotificador, profesiones);
          updateNotificacion.tipoReporte = reg['N'];
          const fechaRecepcionInicial = VigiflowUtils.analizarCadenaFecha(reg['J']?.toString());
          updateNotificacion.fechaNotificacion = fechaRecepcionInicial;
          updateNotificacion.fechaReporteNacional = fechaRecepcionInicial;
          updateNotificacion.fechaAtencion = fechaRecepcionInicial;
          updateNotificacion.tipoEmisor = reg['F'] ? reg['F'].toString().trim() : null;
          updateNotificacion.peso = reg['AA'] ? parseFloat(reg['AA'].toString()) : null;
          updateNotificacion.altura = reg['AB'] ? parseFloat(reg['AB'].toString()) : null;

          // Crear/actualizar notificador: identificacion=col W, nombres=origenOriginal.reportadoPor (AEFI AB)
          let notificador = null;
          const especialistaId = reg['W']?.toString().trim();
          if (especialistaId) {
            try {
              const nombresNotificador = notificacion.origenOriginal?.reportadoPor ?? null;
              notificador = await this.notificadorService.createOrUpdateFromVigiflow(especialistaId, profesionNotificador, nombresNotificador);
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

        let medicamento = new CreateMedicamentoDto();
        medicamento.rolMedicamento = reg['C'];
        medicamento.nombre = reg['D'];
        medicamento.nombreMedPatenteWHODrug = reg['E'] ? VigiflowUtils.limpiarCampoWHODrug(reg['E']) : reg['E'];
        medicamento.codigoATC = reg['G'];
        medicamento = { ...medicamento, ...auditoria };

        // Crear medicamento. "medicamentoService.createOneToOne" filtra los posibles medicamentos
        // duplicados sobre la base de NOTIFICACION_ID, NOMBRE_MEDICAMENTO, y ATC
        await this.medicamentoService.createOneToOne(notificacionMed, medicamento);

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
          dtoDatoVacunacion.finAdministracion = VigiflowUtils.formatoFecha(reg['X']?.toString());
          await this.datoVacunacionService.create(notificacion, dtoDatoVacunacion);

          //Este fragmento no solo actualiza registros, también crea nuevos registros de datoVacuna
          //cuando es necesario (ver datoVacunaService al final del bloque).
          const updateDatoVacuna = new UpdateDatoVacunaDto();
          updateDatoVacuna.accionTomada = reg['M'];
          updateDatoVacuna.dosis = reg['S'];
          updateDatoVacuna.intervaloDosificacion = reg['T'];
          updateDatoVacuna.dosis1 = reg['U'];
          updateDatoVacuna.duracion = reg['V'];
          updateDatoVacuna.formaFarmaceutica = reg['Y'];
          updateDatoVacuna.formaFarmaceuticaEDQM = reg['Z'];
          updateDatoVacuna.viaAdministracion = reg['AA'];
          updateDatoVacuna.viaAdministracionEDQM = reg['AB'];
          //TODO: En caso de necesitar solo una lista fija de paises autorizados, lo más eficiente es
          //implementar un diccionario con la equivalencia del código ISO3 alfa-3 o catálogo de países autorizados.
          updateDatoVacuna.paisAutorizacionIso3Code = reg['J'] ? countries.getAlpha3Code(reg['J'].toString().toUpperCase(), idiomaParaPaisIso3Code) : 'ECU';
          updateDatoVacuna.numeroLote = reg['AE'] && VigiflowUtils.transformarLoteVacuna(reg['AE']);
          updateDatoVacuna.indicacionMeddra = reg['Q']; // TODO: REVISAR si ya está transformado a Meddra LLT. Si está vacío debe ser NULL.

          const nombreVacPatenteWHODrugVigiFlow = reg['E'] ? VigiflowUtils.limpiarCampoWHODrug(reg['E']) : reg['E'];
          updateDatoVacuna.nombreVacPatenteWHODrug = nombreVacPatenteWHODrugVigiFlow;

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
              updateDatoVacuna.drugCode = whodrugMatch.drugCode;
              updateDatoVacuna.drugName = whodrugMatch.drugName;
              updateDatoVacuna.medicinalProductId = whodrugMatch.medicinalProductId;
              updateDatoVacuna.maHolder = whodrugMatch.maHolder;
              updateDatoVacuna.maHolderMedicinalProductId = whodrugMatch.maHolderMedicinalProductId;
            } else {
              //Fallback: estandarización por nombre de patente (col E), utilizando el diccionario
              //oficial de WHODrug Global de Uppsala Monitoring Centre.
              const whodrug: any[] = await this.drugService.getDrugsOnly(nombreVacPatenteWHODrugVigiFlow, country);
              if (whodrug.length > 0) {
                updateDatoVacuna.drugCode = whodrug[0]?.drugCode;
                updateDatoVacuna.drugName = whodrug[0]?.drugName;

                const mah = await this.maholderService.getMaholderOfDrug(whodrug[0]?.id, country);
                // Se genera un valor compatible con JSONB; el mapeo a JSONB ocurre en la capa de persistencia (ORM/driver + PostgreSQL).
                updateDatoVacuna.maHolderJsonb = mah.map((item) => ({
                  name: item.name,
                  medicinalProductID: item.medicinalProductID, // El MPID principal del medicamento es diferente al valor del MPID del maHolder.
                }));

                // Poblar también las columnas planas (igual que el lookup primario) tomando el primer titular.
                // Sin esto, un match por fallback dejaba MA_HOLDER / MEDICINAL_PRODUCT_ID / MA_HOLDER_MEDI_PROD_ID vacíos.
                const maHolderPrincipal = mah[0];
                if (maHolderPrincipal) {
                  updateDatoVacuna.maHolder = maHolderPrincipal.name;
                  updateDatoVacuna.maHolderMedicinalProductId = maHolderPrincipal.medicinalProductID != null ? String(maHolderPrincipal.medicinalProductID) : null;
                  updateDatoVacuna.medicinalProductId = maHolderPrincipal.countrySale?.medicinalProductID != null ? String(maHolderPrincipal.countrySale.medicinalProductID) : null;
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

      const totalEventos = nombresLLT.length;
      if (totalEventos === 0) {
        this.logger.warn(`[Reacciones] Fila sin eventos LLT para notificación ${notificacion.codigoOrigenNotificacion}`);
        continue;
      }

      for (let i = 0; i < totalEventos; i++) {
        const nombreLLT = nombresLLT[i]?.trim() ?? '';
        if (!nombreLLT) continue;

        try {
          let datoEsavi = new CreateDatoEsaviDto();
          datoEsavi = { ...datoEsavi, ...auditoria };

          datoEsavi.nombre = nombreLLT.toUpperCase();
          const nombreReportadoRaw = (nombresReportados[i] ?? nombreLLT).toUpperCase();
          datoEsavi.nombreReportado = VigiflowUtils.eliminarSaltoLinea(nombreReportadoRaw);
          datoEsavi.fechaEsavi = VigiflowUtils.formatoFecha(fechasInicio[i] ?? '');
          datoEsavi.fechaFinalizacion = VigiflowUtils.formatoFecha(fechasFin[i] ?? '');
          datoEsavi.duracion = duraciones[i] ?? null;
          datoEsavi.resultado = resultados[i] ?? null;
          datoEsavi.nameLLT = nombreLLT.toUpperCase();
          datoEsavi.namePT = (nombresPT[i] ?? '').toUpperCase() || null;
          datoEsavi.nameHLT = (nombresHLT[i] ?? '').toUpperCase() || null;
          datoEsavi.nameHLGT = (nombresHLGT[i] ?? '').toUpperCase() || null;
          datoEsavi.nameSOC = (nombresSOC[i] ?? '').toUpperCase() || null;

          // Buscar CODE en MEDDRA.MED_LLT comparando NAME en mayúsculas (similitud >= 90%)
          datoEsavi.codigoLLT = await this.meddraLltService.buscarCodigoPorSimilitud(nombreLLT);

          const meddraPT = await this.meddraPtService.searchPT(nombresPT[i] ?? '');
          const meddraSOC = await this.meddraSocService.searchSOC(nombresSOC[i] ?? '');

          datoEsavi.CTPTMEDDRA_ID = meddraPT?.id ?? null;
          datoEsavi.CTSOCMEDDRA_ID = meddraSOC?.id ?? null;

          datoEsavi.codigoPT = meddraPT?.code ?? null;
          datoEsavi.codigoSOC = meddraSOC?.code ?? null;

          datoEsavi.codigoCaso = notificacion.codigoOrigenNotificacion;
          await this.datoEsaviService.createVigiflow(notificacion, datoEsavi);
        } catch (err) {
          this.logger.error(
            `[Reacciones] Error procesando evento "${nombreLLT}" [i=${i}] para notificación ${notificacion.codigoOrigenNotificacion}: ${err.message}`,
          );
          // Continúa con el siguiente evento sin detener el procesamiento
        }
      }
    }
  }
}
