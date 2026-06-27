import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs/promises';
import * as countries from 'i18n-iso-countries';
import * as enLocale from 'i18n-iso-countries/langs/en.json';
import * as esLocale from 'i18n-iso-countries/langs/es.json';
import {
  CreatePacienteEmbarazadaDto,
  UbicacionDto,
  CreateCompleteDto,
  CreateDatoEsaviDto,
  CreateDatoVacunaDto,
  CreateDatoVacunacionDto,
  CreateDesenlaceEsaviDto,
  CreateGravedadEsaviDto,
  CreateMedicamentoDto,
  CreateNotificacionDto,
  CreatePacienteVigiflowDto,
  UpdateNotificacionDto,
  UpdateDatoVacunaDto,
} from '../../integrator/dto';
import { Auditoria, IAuditoria } from 'src/integrator/entity/auditoria.entity';
import { DatoEsaviService } from 'src/integrator/service/dato-esavi.service';
import { MeddraLLTService } from 'src/meddra/services/meddra-lt.service';
import { MeddraPtService } from 'src/meddra/services/meddra-pt.service';
import { MeddraSocService } from 'src/meddra/services/meddra-soc.service';
import { ActiveIngredientsService } from 'src/whodrugs/services/activeIngredients.service';
import { DrugService } from 'src/whodrugs/services/drugs.service';
import { MaholderService } from 'src/whodrugs/services/maholder.service';
import { read, utils, WorkBook } from 'xlsx';
import { SourceEnum } from '../../integrator/enum/source-enum';
import { IntegradorService } from '../../integrator/facade/integrador.service';
import { DatoVacunaService } from '../../integrator/service/dato-vacuna.service';
import { MedicamentoService } from '../../integrator/service/medicamento.service';
import { NotificacionVigiflowService } from '../../integrator/service/notificacion-vigiflow.service';
import { NotificadorService } from '../../integrator/service/notificador.service';
import { PacienteService } from '../../integrator/service/paciente.service';
import { VigiflowCrawlerService } from './vigiflow-crawler.service';
import { SyncService } from 'src/integrator/service/sync.service';
import { SyncStatus } from 'src/integrator/entity';

// import { archivoAefi2 } from './excelAefiDescargado2';
// import { archivo2 } from './excelDescargado2';

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
//var countries = require("i18n-iso-countries");
//countries.registerLocale(require("i18n-iso-countries/langs/es.json")); // in a browser environment
//--- Registrar idiomas
countries.registerLocale(enLocale);
countries.registerLocale(esLocale);
const idiomaParaPaisIso3Code = 'es';

@Injectable()
export class VigiflowIntegradorService {
  private readonly logger = new Logger(VigiflowIntegradorService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly vigiflowCrawlerService: VigiflowCrawlerService,
    private readonly configService: ConfigService,
    private readonly integradorService: IntegradorService,
    private readonly pacienteService: PacienteService,
    private readonly notificacionVigiflowService: NotificacionVigiflowService,
    private readonly notificadorService: NotificadorService,
    private readonly medicamentoService: MedicamentoService,
    private readonly datoVacunaService: DatoVacunaService,
    private readonly datoEsaviService: DatoEsaviService,
    private readonly drugService: DrugService,
    private readonly maholderService: MaholderService,
    private readonly activeIngredentService: ActiveIngredientsService,
    private readonly syncService: SyncService,

    private readonly meddraLltService: MeddraLLTService,
    private readonly meddraPtService: MeddraPtService,
    private readonly meddraSocService: MeddraSocService,
  ) {
    const fechaInicioStr = this.configService.get<string>('VIGIFLOW_FECHA_INICIO_CRON', '2024-11-01');
    this.originalFechaInicio = new Date(`${fechaInicioStr}T00:00:00.000Z`);
    this.fechaInicio = this.originalFechaInicio;
  }

  private originalFechaInicio: Date;
  private fechaInicio: Date;

  // @Cron(CronExpression.EVERY_MINUTE)
  // 0 23 L * * -- Ejecución fin de mes
  // 0 23 1 * * -- Ejecucion inicio de mes
  @Cron('0 23 1 * *')
  private async handleCron() {
    const now = new Date();

    // Procesar mientras fechaInicio sea menor que la fecha actual
    while (this.fechaInicio < now) {
      // Calcular la fecha de fin como el último día del mes de fechaInicio (UTC)
      const fechaFin = new Date(Date.UTC(
        this.fechaInicio.getUTCFullYear(),
        this.fechaInicio.getUTCMonth() + 1,
        0, 23, 59, 59, 999,
      ));
      // Llamar a la función de procesamiento
      await this.createInBulk(this.fechaInicio, fechaFin);

      // Avanzar fechaInicio al primer día del siguiente mes (UTC)
      this.logger.log(
        `Procesado desde ${this.fechaInicio.toISOString()} hasta ${fechaFin.toISOString()}`,
      );
      this.fechaInicio = new Date(Date.UTC(
        this.fechaInicio.getUTCFullYear(),
        this.fechaInicio.getUTCMonth() + 1,
        1, 0, 0, 0, 0,
      ));
    }

    // Si hemos alcanzado la fecha actual, reiniciar fechaInicio
    if (this.fechaInicio >= now) {
      this.fechaInicio = this.originalFechaInicio; // Reiniciar a la fecha original
    }
  }

  /* ARCHIVOS O R I G E N REMOTO*/ //----------------------------------------------------------------
  async createInBulk(fechaInicio: Date, fechaFin: Date, codigoATC = 'J07') {
    if (fechaFin <= fechaInicio) {
      throw new BadRequestException();
    }
    //Date params should be sent with this format: 20230113
    const pad = (n: number) => String(n).padStart(2, '0');
    const fechaInicioFmrt = `${fechaInicio.getUTCFullYear()}${pad(fechaInicio.getUTCMonth() + 1)}${pad(fechaInicio.getUTCDate())}`;
    const fechaFinFmrt = `${fechaFin.getUTCFullYear()}${pad(fechaFin.getUTCMonth() + 1)}${pad(fechaFin.getUTCDate())}`;

    const syncRecord = await this.syncService.createSyncProcess({
      name: 'VIGIFLOW_BULK',
      status: SyncStatus.RUNNING,
      startTime: new Date(),
      endTime: null,
      dataStartDate: fechaInicio,
      dataEndDate: fechaFin,
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
      const { jwt } = await this.vigiflowCrawlerService.retrieveJWT();

      //This method allows us to persiste the information the first time.
      //Retrieve excel to persist elements
      const reportOne = await this.vigiflowCrawlerService.retrieveExcelReport(
        fechaInicioFmrt,
        fechaFinFmrt,
        codigoATC, // (J07BX=Covid-19)
        jwt,
      );
      //Retrieve excel to update elements
      const reportTwo = await this.vigiflowCrawlerService.retrieveJsonReport(fechaInicioFmrt, fechaFinFmrt, codigoATC, jwt);

      await this.extractedFromExcelToPersist(reportOne);
      await this.sleep(8000);
      this.logger.log('extractedFromJsonReportToUpdate..................');
      await this.extractedFromJsonReportToUpdate(reportTwo);
      await this.sleep(8000);
      this.logger.log('extractedFromJsonReportToCreateMedicamento..................');
      await this.extractedFromJsonReportToCreateMedicamento(reportTwo);
      await this.sleep(8000);
      this.logger.log('extractedFromJsonReportToCreateReaccion..................');
      await this.extractedFromJsonReportToCreateReaccion(reportTwo);
      await this.sleep(3000);
      this.logger.log('Fin Proceso..................');

      await this.syncService.update(syncRecord.id, {
        status: SyncStatus.COMPLETED,
        endTime: new Date(),
        message: `Importación VigiFlow completada: ${fechaInicioFmrt} – ${fechaFinFmrt}`,
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

   // *** ARCHIVOS LOCALES
    // const reportTwo = read(archivo2);
    // Procesamos el primer reporte
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
    const syncRecord = await this.syncService.createSyncProcess({
      name: syncName,
      status: SyncStatus.RUNNING,
      startTime: new Date(),
      endTime: null,
      dataStartDate: null,
      dataEndDate: null,
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
      this.logger.log('extractedFromExcelToPersist..................');
      await this.extractedFromExcelToPersist(reportOne);
      await this.sleep(8000);
      this.logger.log('extractedFromJsonReportToUpdate..................');
      await this.extractedFromJsonReportToUpdate(reportTwo);
      await this.sleep(8000);
      this.logger.log('extractedFromJsonReportToCreateMedicamento..................');
      await this.extractedFromJsonReportToCreateMedicamento(reportTwo);
      await this.sleep(8000);
      this.logger.log('extractedFromJsonReportToCreateReaccion..................');
      await this.extractedFromJsonReportToCreateReaccion(reportTwo);
      await this.sleep(3000);
      this.logger.log('Fin Proceso..................');

      await this.syncService.update(syncRecord.id, {
        status: SyncStatus.COMPLETED,
        endTime: new Date(),
        message: `Importación VigiFlow desde archivo completada`,
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

  //Extracción de los datos de la hoja [0], del libro
  //de Excel 'VigiFlow_AEFILinelisting_ddmmaaaa_hhmmss.xlsx'.
  //AEFI: Adverse Events Following Immunization (Eventos Adversos Después de la Vacunación).
  private async extractedFromExcelToPersist(workBook: WorkBook) {
    //Convert file to json
    const ws = await workBook.Sheets[workBook.SheetNames[0]];
    const headers = 'A';
    const reports = utils.sheet_to_json(ws, {
      header: headers,
      raw: true,
      defval: '',
    });
    this.logger.log(`Numero de reportes de vigiflow ${reports.length}`);
    // Usar for...of para esperar que cada operación asíncrona termine
    for (const reg of reports.slice(1)) {
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

      // Create Paciente Vigiflow
      const paciente = new CreatePacienteVigiflowDto();
      paciente.identificacion = reg['E'] ? reg['E'].toString().trim() : null;
      paciente.sexoPaciente = reg['F'];
      paciente.codigoVigiflow = reg['B'] && reg['B'] ? reg['B'].toString().trim():null; // Viene desde la hoja AEFI columna B
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
      const fechaNacimiento = this.analizarCadenaFecha(reg['G'] ? reg['G'].toString() : reg['G']);
      if (fechaNacimiento) {
        notificacion.fechaNacimiento = fechaNacimiento;
        //Para no repetir la extracción, simplemente se asigna la fecha de nacimiento al paciente desde la notificación.
        paciente.fechaNacimiento = fechaNacimiento;
      }
      
      // Al momento la edad y su unidad se toman directamente del excel. Los cálculos	
      // que se hacen en el documento "notificacion-vigiflow.service.ts" son
      // úncamente para calcular el grupo etario.
      const edad = this.formatoInteger(reg['H'] && reg['H']);
      const unidadEdad = reg['I'] && reg['I'].toUpperCase();
      if ((edad > 0 && edad < 121) && unidadEdad) {
        notificacion.edad = edad;
        notificacion.unidadEdadPaciente = unidadEdad;
      } else {
        // Si la edad no es válida, se asigna null. TODO: edad = fechaNotificacion - fechaNacimiento [AÑOS], similar a dhis2
        notificacion.edad = null;
        notificacion.unidadEdadPaciente = null;
        this.logger.warn(`Edad o unidad de edad no válida para paciente con código Vigiflow: ${paciente.codigoVigiflow}`);
        //el cálculo a partir de esas dos fechas, se realiza en el servicio de notificación VigiFlow.
      }
      const fechaNotificacion = this.analizarCadenaFecha(reg['AD'] ? reg['AD'].toString() : reg['AD']);
      if (fechaNotificacion) {
        notificacion.fechaNotificacion = fechaNotificacion;
      }//esta fecha se actualiza luego al extraer el otro Excel que contiene la hoja "Reportes".
      const fechaReporte = this.analizarCadenaFecha(reg['AE'] ? reg['AE'].toString() : reg['AE']);
      if (fechaReporte) {
        notificacion.fechaReporteNacional = fechaReporte;
      }

      notificacion.medioNotificacion = 'Medio electrónico VigiFlow';//Por recomendación del equipo funcional, se asigna un valor estático.// si se toma de la hoja Reportes reg['E'];, se debe usar updateNotificacion.
      //notificacion.unidadEdadPaciente = reg['I'] && reg['I'].toUpperCase();
      notificacion.organizacionNotificador = reg['AF']; //Más adelante se actualiza este campo.
      notificacion.codigoVigiflow = reg['B'];
      notificacion.nombreNotificador = reg['AB'];
      // Ubicacion residencia Paciente
      const ubicacionResidenciaPaciente = new UbicacionDto();
      ubicacionResidenciaPaciente.provincia = reg['D'] && reg['D'] ? reg['D'].replace(/^(Provincia\s+(de|del)\s+)/i, "").trim().toUpperCase(): 'DESCONOCIDO';
      notificacion.residenciaPaciente = ubicacionResidenciaPaciente;
      // Unidad residencia Notificador
      const ubicacionResidenciaNotificador = new UbicacionDto();
      ubicacionResidenciaNotificador.provincia = reg['AC'] && reg['AC'] ? reg['AC'].replace(/^(Provincia\s+(de|del)\s+)/i, "").trim().toUpperCase(): 'DESCONOCIDO';
      notificacion.residenciaNotificador = ubicacionResidenciaNotificador;

      // Create AntecedenteEnfermedadesPrevias
      // Como tal en el documento de vigiflow, no se encuentran enfermedades previas

      //Create Gravedad
      const grave = new CreateGravedadEsaviDto();
      let gravedad = '0';//'NO GRAVE';
      const tipoGravedad = reg['X'];
      if (tipoGravedad && tipoGravedad.toUpperCase().includes('S')) {
        gravedad = '1';//'GRAVE';
      }
      grave.tipo = gravedad;

      const eventosImportantes = reg['Y'];
      const cadenaNormalizada = this.eliminarTildes(eventosImportantes && eventosImportantes.toLowerCase());
      grave.muerte = cadenaNormalizada && cadenaNormalizada.includes('muerte');
      grave.riesgoVida = cadenaNormalizada && cadenaNormalizada.includes('amenaza');
      grave.discapacidad = cadenaNormalizada && cadenaNormalizada.includes('discapacidad');
      grave.hospitalizacion = cadenaNormalizada && cadenaNormalizada.includes('hospitalizacion');
      grave.anomaliaCongenita = cadenaNormalizada && cadenaNormalizada.includes('anomalia');

      // Create Desenlace Esavi
      const desenlaceEsaviDto = new CreateDesenlaceEsaviDto();
      const autopsia = reg['AA'];
      desenlaceEsaviDto.autopsia =
        autopsia && this.eliminarTildes(autopsia).includes('si')
          ? 1
          : autopsia && this.eliminarTildes(autopsia).includes('no')
          ? 0//2
          : 2;//3;
      desenlaceEsaviDto.comentarioResultado = reg['Z'] && this.obtenerPrimerComentario(reg['Z']); // Guarda solo el primer comentario, hasta encontrar un salto de linea
      const fechaInvestigacion = this.formatoFecha(reg['AM'] ? reg['AM'].toString() : reg['AM']);
      if (fechaInvestigacion) {
        desenlaceEsaviDto.fechaInicioInvestigacion = fechaInvestigacion;
      }

      //Create Dato Vacunacion
      const datoVacunacionDto = new CreateDatoVacunacionDto();
      datoVacunacionDto.nombreVacunatorio = reg['AF'];
      datoVacunacionDto.fechaVacunacion = this.formatoFecha(reg['N'] ? reg['N'].toString() : reg['N']);

      //Este campo debe ser asignado a datoVacuna.numeroDosisVacuna
      const numeroDosisVacuna = reg['O'] && reg['O'].match(/\d+/) ? parseInt(reg['O'].match(/\d+/)[0], 10) : null;
      // Pero, tomar en cuenta que el CreateDatoVacunaDto aparece en el otro
      // proceso de extracción, en el método "extractedFromJsonReportToCreateMedicamento".
      // Para este proceso se debe analizar los siguientes elementos:
      // dato-vacuna.entity.ts
      // create-dato-vacuna.dto.ts
      // dato-vacuna.service.ts
      // integrador.service.ts
      // update-dato-vacuna.dto.ts
      // dato-vacuna.controller.ts
      //Create Dato Vacunacion
      //Create Dato Vacuna con numeroDosisVacuna
      const datoVacunaDto = new CreateDatoVacunaDto();
      datoVacunaDto.numeroDosisVacuna = numeroDosisVacuna;

      //Paciente Embarazada
      const embarazada = new CreatePacienteEmbarazadaDto();
      const esEmbarazada = reg['J'] && this.eliminarTildes(reg['J']).toLowerCase().includes('si');
      embarazada.momentoEsavi = esEmbarazada ? '1' : '0';

      //Complete the dto
      let create = new CreateCompleteDto();
      create.source = SourceEnum.VIGIFLOW;
      create.pacienteVigiflow = paciente;
      create.notificacion = notificacion;
      create.gravedadEsavi = grave;
      create.desenlaceEsavi = desenlaceEsaviDto;
      create.datoVacunacion = datoVacunacionDto;
      create.datoVacuna = datoVacunaDto;
      if (esEmbarazada) {
        create.pacienteEmbarazada = embarazada;
      }
      create = { ...create, ...auditoria };

      await this.integradorService.create(create);
    }
  }

  //Extracción de los datos de la hoja [1] de nombre 'Reportes', del libro
  //de Excel 'VigiFlow_Excel_ddmmaaaa_hhmmss.xlsx'. Recordar que la hoja [0], no
  //contiene información. Estos nuevos campos permiten completar la tabla
  //de NOTIFICACON, mediante un proceso de actualización.
  async extractedFromJsonReportToUpdate(workbook2: WorkBook) {
    //Convert file to json
    const ws2 = await workbook2.Sheets[workbook2.SheetNames[1]];
    const headers2 = 'A';
    const toUpdate = utils.sheet_to_json(ws2, {
      header: headers2,
      raw: true,
      defval: '',
    });

    const allPatients = await this.pacienteService.findAll();
    const patientMap = new Map(allPatients.map(p => [p.codigoOrigen?.trim(), p]));

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
        const notificacionList = await this.notificacionVigiflowService.findByPacienteUUID(paciente.id);

        const notificacion = notificacionList.at(0);

        if (notificacion) {
          const updateNotificacion = new UpdateNotificacionDto();
          updateNotificacion.id = notificacion.id;
          updateNotificacion.casoNarrativo = reg['AC'];
          const profesionNotificador = reg['AQ'] && this.obtenerPrimerComentario(reg['AQ']);
          updateNotificacion.profesionNotificadorParam = this.encontrarCoincidencia(profesionNotificador, profesiones);
          updateNotificacion.tipoReporte = reg['N'];
          updateNotificacion.fechaNotificacion = this.analizarCadenaFecha(reg['J'] ? reg['J'].toString() : reg['J']);
          updateNotificacion.fechaReporteNacional = this.analizarCadenaFecha(reg['J'] ? reg['J'].toString() : reg['J']);
          updateNotificacion.tipoEmisor = reg['F'] && this.transformarTipoEmisor(reg['F']);

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
  }

  // async extractedFromJsonReportToCreateMedicamento(workbook2: WorkBook) {
  //   //Convert file to json
  //   const country = 'ECU'

  //   const ws2 = await workbook2.Sheets[workbook2.SheetNames[2]];
  //   const importRange2 = 'A2:AX2915';
  //   const headers2 = 'A';
  //   const toUpdate = utils.sheet_to_json(ws2, {
  //     range: importRange2,
  //     header: headers2,
  //   });
  //   toUpdate.map(async (reg) => {
  //     const paciente = await this.pacienteVigiflowService.findByVigiflowCode(
  //       reg['B'],
  //     );
  //     if (paciente) {
  //       const notificacionList =
  //         await this.notificacionVigiflowService.findByPacienteUUID(
  //           paciente.id,
  //         );
  //       const notificacion = notificacionList.at(0);
  //       const medicamento = new CreateMedicamentoDto();
  //       medicamento.rolMedicamento = reg['C'];
  //       medicamento.nombre = reg['D'];
  //       medicamento.codigoATC = reg['G'];

  //       // await this.medicamentoService.createOneToOne(notificacion, medicamento);
  //       const datoVacuna = new CreateDatoVacunaDto();
  //       datoVacuna.accionTomada = reg['M'];
  //       datoVacuna.dosis = reg['S'];
  //       datoVacuna.intervaloDosificacion = reg['T'];
  //       datoVacuna.dosis1 = reg['U'];
  //       datoVacuna.duracion = reg['V'];
  //       datoVacuna.inicioAdministracion = this.formatoFecha(reg['W'] ? reg['W'].toString() : reg['W']);
  //       datoVacuna.finAdministracion = this.formatoFecha(reg['X'] ? reg['X'].toString() : reg['X']);
  //       datoVacuna.formaFarmaceutica = reg['Y'];
  //       datoVacuna.formaFarmaceuticaEDQM = reg['Z'];
  //       datoVacuna.viaAdministracion = reg['AA'];
  //       datoVacuna.viaAdministracionEDQM = reg['AB'];
  //       datoVacuna.paisAutorizacion = reg['J'];
  //       datoVacuna.numeroLote = reg['AE'];
  //       datoVacuna.indicacionMeddra = reg['Q'];
  //       datoVacuna.nombreVacunaPatenteWhoDrug = reg['E']
  //       const drugName = datoVacuna.nombreVacunaPatenteWhoDrug

  //       // Primero guardamos la vacuna, para obtener el id
  //       const vacuna : any = await this.datoVacunaService.create(notificacion, datoVacuna);
  //       // console.log("Vacuna:::" , vacuna?.id , vacuna?.nombreVacunaPatenteWhoDrug );
  //       // Obtenemos el id de la vacuna de acuerdo al nombre y el pais
  //       const whodrug : any[]  = await this.drugService.getDrugsOnly(drugName , country)

  //       for (const drug of whodrug) {
  //         console.log("WhoooDrug:::", drug?.id, drug?.drugName);
  //         const maholder = await this.maholderService.getMaholderOfDrug(drug?.id, country);
  //         console.log("Maholderss::",  drug?.drugName ,  maholder);
  //       }

  //     } else {
  //       console.log(`Please checkout ${paciente}`);
  //     }
  //   });
  // }

  //Extracción de los datos de la hoja [2] de nombre 'Medicamentos', del libro
  //de Excel 'VigiFlow_Excel_ddmmaaaa_hhmmss.xlsx'.
  async extractedFromJsonReportToCreateMedicamento(workbook2: WorkBook) {
    // Convertir archivo a JSON
    const country = 'ECU';

    const ws2 = await workbook2.Sheets[workbook2.SheetNames[2]];
    const headers2 = 'A';
    const toUpdate = utils.sheet_to_json(ws2, {
      header: headers2,
      defval: '',
    });

    const auditoria: Auditoria = {
      createdAt: new Date(),
      createdBy: 'System',
      updatedAt: undefined,
      updatedBy: 'System',
      deletedAt: undefined,
      deletedBy: 'System',
      isEnabled: true,
      isActive: true,
    };

    const allPatients = await this.pacienteService.findAll();
    const patientMap = new Map(allPatients.map(p => [p.codigoOrigen?.trim(), p]));

    // Iterar con for...of, para esperar que cada operación asíncrona termine.
    // "toUpdate" es un arreglo de objetos JSON, cada uno de esos objetos representa una fila de la hoja "Medicamentos".
    for (const reg of toUpdate) {
      const medNumIdUnicoMundial = reg['A'] && reg['A'] ? reg['A'].toString().trim():null;
      const paciente = patientMap.get(medNumIdUnicoMundial) ?? null;
      if (paciente) {
        const notificacionList = await this.notificacionVigiflowService.findByPacienteUUID(paciente.id);
        const notificacionMed = notificacionList.at(0);//TODO: Iterar por todas las notificaciones asociadas al paciente, o lo que es lo mismo, a su código vigiflow. RECORDAR que un código vigiflow puede tener varios ATC asociados además del J07. Y finalmente, un J07 no siempre aparece en la primera ocurrencia o posiciión del array notificacionList.
        let medicamento = new CreateMedicamentoDto();
        medicamento.rolMedicamento = reg['C'];
        medicamento.nombre = reg['D'];
        medicamento.nombreMedPatenteWHODrug = reg['E'] && reg['E'] ? this.limpiarCampoWHODrug(reg['E']) : reg['E'];
        medicamento.codigoATC = reg['G']; 
        medicamento = { ...medicamento, ...auditoria };

        // Crear medicamento. Observar que "medicamentoService.createOneToOne" filtra los posibles medicamentos duplicados sobre la base de NOTIFICACION_ID, NOMBRE_MEDICAMENTO, y ATC
        await this.medicamentoService.createOneToOne(notificacionMed, medicamento);

        /**
         * La hoja "Medicamentos", para el código ATC no tiene filtro de J07, y a primera vista, 
         * parecería no ser necesario volver a aplicar otro filtro, porque, el ATC J07 está 
         * filtrado en el libro AEFI (cantidad de registros comparable con el mensaje de la página VigiFlow).
         * Sin embargo, se debe tener en cuenta que un mismo código Vigiflow puede tener varios ATC asociados,
         * incluyendo el J07. Por lo tanto, es necesario validar que el código ATC de la fila actual
         * corresponda a una vacuna (J07) antes de proceder a crear o actualizar el datoVacuna.
         */
        //const validacionCdgAtcVacunas = reg['G'] && this.validarCodigoAtcVacuna(reg['G'].toString());
        /**
         * OBSERVACIÓN IMPORTANTE: En la columna 'G' ('Código(s) ATC') de la hoja "Medicamentos", pueden existir varios códigos o elementos
         * separados por saltos de línea. De los cuales, temporalmente se asume que solo uno de ellos es J07, es decir una vacuna.
         */
        const codigoAtcVacunaTransformado = reg['G'] && reg['G'] ? this.extraerCodigoAtcVacuna(reg['G'].toString()) : null;
        for(const notificacion of notificacionList){

          // Buscar datoVacuna existente y actualizarlo. Se filtra por notificación.id y comprobando que sus campos principales sean NULL o vacíos.
          const datoVacunaList = await this.datoVacunaService.findByNotifIdDtoMinimo(notificacion.id);
          //const datoVacunaExistente = datoVacunaList && datoVacunaList.length > 0 ? datoVacunaList[0] : null;

          //En realidad este fragmento de código no solo actualiza registros, también crea nuevos registros de datoVacuna cuando es necesario (ver datoVacunaService.create al final del bloque).
          if ( codigoAtcVacunaTransformado ) { //if (validacionCdgAtcVacunas) {
            let updateDatoVacuna = new UpdateDatoVacunaDto();
            //updateDatoVacuna.nombre = reg['D'];//updateDatoVacuna.drugName = reg['D']; //Nombre del medicamento tal como fue reportado por el notificador inicial / original
            updateDatoVacuna.accionTomada = reg['M'];
            updateDatoVacuna.dosis = reg['S'];
            updateDatoVacuna.intervaloDosificacion = reg['T'];
            updateDatoVacuna.dosis1 = reg['U'];
            updateDatoVacuna.duracion = reg['V'];
            updateDatoVacuna.inicioAdministracion = this.formatoFecha(reg['W'] ? reg['W'].toString() : reg['W']);
            updateDatoVacuna.finAdministracion = this.formatoFecha(reg['X'] ? reg['X'].toString() : reg['X']);
            updateDatoVacuna.formaFarmaceutica = reg['Y'];
            updateDatoVacuna.formaFarmaceuticaEDQM = reg['Z'];
            updateDatoVacuna.viaAdministracion = reg['AA'];
            updateDatoVacuna.viaAdministracionEDQM = reg['AB'];
            updateDatoVacuna.paisAutorizacionIso3Code = reg['J'] && reg['J'] ? countries.getAlpha3Code( reg['J'].toString().toUpperCase(), idiomaParaPaisIso3Code) : 'ECU';//TODO:En caso de necesitar solo una lista fija de paises autorizados, lo más eficiente es implementar un diccionario con la equivalencia del código ISO3 alfa-3 o catálogo de países autorizados.
            updateDatoVacuna.numeroLote = reg['AE'] && this.transformarLoteVacuna(reg['AE']);
            updateDatoVacuna.indicacionMeddra = reg['Q']; // TODO: REVISAR si ya está transformado a Meddra LLT. Si está vacío debe ser NULL.
            
            const nombreVacPatenteWHODrugVigiFlow = reg['E'] && reg['E'] ? this.limpiarCampoWHODrug(reg['E']) : reg['E'];
            updateDatoVacuna.nombreVacPatenteWHODrug = nombreVacPatenteWHODrugVigiFlow;//reg['E'] && reg['E'] ? this.limpiarCampoWHODrug(reg['E']) : reg['E'];
            
            const principioActivoWHODrugVigiFlow = reg['F'] && reg['F'] ? this.limpiarCampoWHODrug(reg['F']) : reg['F']; // Reemplaza comas o saltos de línea por punto y coma.
            updateDatoVacuna.acIngredientTranslationJson = this.parseIngredientsWithSemicolonsToJson( principioActivoWHODrugVigiFlow );//reg['F'] && this.parseIngredientsToJson(reg['F']);//Se asigna esta columna porque la mayoría ya viene con la traducción al español.
            updateDatoVacuna.codigoAtc = codigoAtcVacunaTransformado; //reg['G'];
            updateDatoVacuna.rolVacuna = reg['C'];

            //----------------------------------------------------------------------------------------------------------------//
            //----------------------------------------------------------------------------------------------------------------//
            const utilizarSoloDiccionarioWhodrugGlobalUmc = this.configService.get<boolean>('VIGIFLOW_USE_WHODRUG_GLOBAL', false);

            if( utilizarSoloDiccionarioWhodrugGlobalUmc ){
              //----INICIO estandarización utilizando el diccionario oficial de WHODrug Global de Uppsala Monitoring Centre.----
              const drugName = nombreVacPatenteWHODrugVigiFlow;//updateDatoVacuna.nombreVacPatenteWHODrug;
              const whodrug: any[] = (await this.drugService.getDrugsOnly(drugName, country)).length > 0? await this.drugService.getDrugsOnly(drugName, country) : [];
              if (whodrug.length > 0) {
                updateDatoVacuna.drugCode = whodrug[0]?.drugCode;
                updateDatoVacuna.drugName = whodrug[0]?.drugName;
                
                const mah = await this.maholderService.getMaholderOfDrug(whodrug[0]?.id, country);
                updateDatoVacuna.maHolderJsonb = mah.map((item) => ({ // Se genera un valor compatible con JSONB, pero el mapeo a JSONB ocurre en la capa de persistencia (ORM/driver + PostgreSQL), no en el código map en sí.
                  name: item.name,
                  medicinalProductID: item.medicinalProductID, // Se debe recordar que el MPID principal del medicamento es diferente al valor del MPID del maHolder.
                }));
                const ingredentActive = await this.activeIngredentService.getActiveIngredentsOfDrug(whodrug[0]?.id);
                //console.log('ingredentActive IDs:::', ingredentActive.map(item => ({ id: item.id, ingredient: item.ingredient })));
                updateDatoVacuna.activeIngredientJson = ingredentActive.map((item) => ({
                  ingredient: item.ingredient, //La propiedad "ingredient" solo es etiqueta y se converirá en la clave dentro del objeto JSON.
                }));
                if ( (ingredentActive.length > 0) && !(updateDatoVacuna.acIngredientTranslationJson) ) {
                                
                  // Para cada ingrediente activo, obtener su traducción en español
                  const translatedIngredients = await Promise.all(
                    ingredentActive.map(async (ingredient) => {
                      const translation = await this.activeIngredentService.getIngredientTranslation(
                        ingredient.id,
                        'es-ES'
                      ); // TODO: if translation is null, use ingredient.ingredient, or map Excel Data. //Es probable que no sea necesario, porque, desde VigiFlow ya vienen traducidos varios ingredientes activos.

                      return { ingredient: translation };//|| ingredient.ingredient };
                    })
                  );

                  // Resultado final, JSON de traducciones de ingredientes activos
                  //-----------console.log(JSON.stringify(translatedIngredients, null, 2));
                  /*updateDatoVacuna.acIngredientTranslationJson = translatedIngredients.map((item) => ({
                    ingredient: item.ingredient,
                  }));*/
                  updateDatoVacuna.acIngredientTranslationJson = translatedIngredients;
                }

              } else {
                /**
                 * updateDatoVacuna.drugCode = null;
                  updateDatoVacuna.mahholdersJson = [];
                  updateDatoVacuna.activeIngredientJson = [];
                */
              } //---- f i n -- estandarización utilizando el diccionario oficial de WHODrug---------------
            } //---- fin if(utilizarSoloDiccionarioWhodrugGlobalUmc) ----

            if(datoVacunaList.length > 0){
              //actualizar el datoVacuna 'm í n i m o' existente, asociado a la notificación. Se denomina "Mínimo", porque no todas las columnas se encuentran en esta hoja Excel.
              //y fue creado inicialmente con los datos de la hoja AEFI. La cantidad de registros únicos será igual a la cantidad de notificaciones asociadas al paciente.

              await this.datoVacunaService.update(datoVacunaList[0].id, updateDatoVacuna);
            } else {
              /**Crear un registro completamente nuevo de DatoVacuna asociado a la 
               * notificación, utilizando el método "create" del servicio datoVacunaService.
               * "create" utiliza filtros internos de TypeORM para evitar duplicados.
               * */
              await this.datoVacunaService.create(notificacion, updateDatoVacuna as CreateDatoVacunaDto); //Existe otra forma, utilizando la actualización propia que tiene este método create.
              //TODO: Evaluar si es necesario implementar una lógica para evitar la creación de registros duplicados en DatoVacuna.
              //TODO: Solicitar indicaciones al personal funcional, sobre el manejo del número de dosis que normalmente viene de la hoja AEFI en un DTO mínimo.
            }
          }
        }
      } else {
        console.log(`Por favor, verificar el paciente con id: ${paciente}`);
      }
    }
  }

  //Extracción de los datos de la hoja [3] de nombre 'Reacciones', del libro
  //de Excel 'VigiFlow_Excel_ddmmaaaa_hhmmss.xlsx'.
  // Cada celda puede contener múltiples valores separados por \n (un valor por evento ESAVI).
  async extractedFromJsonReportToCreateReaccion(workbook2: WorkBook) {
    //Convert file to json
    const ws3 = await workbook2.Sheets[workbook2.SheetNames[3]];
    const headers2 = 'A';
    const toCreate = utils.sheet_to_json(ws3, {
      header: headers2,
      defval: '',
    });

    const auditoria: Auditoria = {
      createdAt: new Date(),
      createdBy: 'System',
      updatedAt: undefined,
      updatedBy: 'System',
      deletedAt: undefined,
      deletedBy: 'System',
      isEnabled: true,
      isActive: true,
    };

    // Se cargan todos los pacientes (sin filtro isActive) para no perder ninguna reacción
    const allPatients = await this.pacienteService.findAll();
    const patientMap = new Map(allPatients.map(p => [p.codigoOrigen?.trim(), p]));

    // La primera fila de la hoja es el encabezado; se omite explícitamente
    for (const reg of toCreate.slice(1)) {
      const caseCode = reg['A']?.toString().trim();
      if (!caseCode) continue;

      const paciente = patientMap.get(caseCode) ?? null;
      if (!paciente) {
        this.logger.warn(`[Reacciones] Paciente no encontrado para código: "${caseCode}" — se omite la fila`);
        continue;
      }

      const notificacionList = await this.notificacionVigiflowService.findByPacienteUUID(paciente.id);
      const notificacion = notificacionList.at(0);

      if (!notificacion) {
        this.logger.warn(`[Reacciones] Notificación no encontrada para paciente ${paciente.codigoOrigen} — se omite la fila`);
        continue;
      }

      // Cada celda puede tener múltiples valores separados por \n (un evento ESAVI por línea)
      const nombresLLT        = this.splitLineas(reg['D']?.toString() ?? '');
      const nombresReportados = this.splitLineas(reg['C']?.toString() ?? '');
      const nombresPT         = this.splitLineas(reg['E']?.toString() ?? '');
      const nombresHLT        = this.splitLineas(reg['F']?.toString() ?? '');
      const nombresHLGT       = this.splitLineas(reg['G']?.toString() ?? '');
      const nombresSOC        = this.splitLineas(reg['H']?.toString() ?? '');
      const fechasInicio      = this.splitLineas(reg['I']?.toString() ?? '');
      const fechasFin         = this.splitLineas(reg['J']?.toString() ?? '');
      const duraciones        = this.splitLineas(reg['K']?.toString() ?? '');
      const resultados        = this.splitLineas(reg['N']?.toString() ?? '');

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
          datoEsavi.nombreReportado = this.eliminarSaltoLinea(nombreReportadoRaw);
          datoEsavi.fechaEsavi = this.formatoFecha(fechasInicio[i] ?? '');
          datoEsavi.fechaFinalizacion = this.formatoFecha(fechasFin[i] ?? '');
          datoEsavi.duracion = duraciones[i] ?? null;
          datoEsavi.resultado = resultados[i] ?? null;
          datoEsavi.nameLLT = nombreLLT.toUpperCase();
          datoEsavi.namePT = (nombresPT[i] ?? '').toUpperCase() || null;
          datoEsavi.nameHLT = (nombresHLT[i] ?? '').toUpperCase() || null;
          datoEsavi.nameHLGT = (nombresHLGT[i] ?? '').toUpperCase() || null;
          datoEsavi.nameSOC = (nombresSOC[i] ?? '').toUpperCase() || null;

          const meddraLlt = await this.meddraLltService.searchLLT(nombreLLT);
          const meddraPT  = await this.meddraPtService.searchPT(nombresPT[i] ?? '');
          const meddraSOC = await this.meddraSocService.searchSOC(nombresSOC[i] ?? '');

          datoEsavi.CTLLTMEDDRA_ID = meddraLlt?.id ?? null;
          datoEsavi.CTPTMEDDRA_ID  = meddraPT?.id  ?? null;
          datoEsavi.CTSOCMEDDRA_ID = meddraSOC?.id ?? null;

          datoEsavi.codigoLLT = meddraLlt?.code ?? null;
          datoEsavi.codigoPT  = meddraPT?.code  ?? null;
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

  private splitLineas(valor: string): string[] {
    if (!valor) return [];
    return valor.split(/\r?\n/).map(s => s.trim()).filter(s => s !== '');
  }

  /**
   *
   * @param nombreEsaviReportadoMayusculas
   * @returns
   */
  private eliminarSaltoLinea(nombreEsaviReportadoMayusculas: string): string {
    //throw new Error('Method not implemented.');
    return nombreEsaviReportadoMayusculas.replace(/[\r\n]+/g, '');
  }

  /**
 * Normaliza un valor textual según una lista de palabras/frases clave.
 * Si coincide con alguna de ellas, devuelve "Desconocido".
 * Caso contrario, devuelve el valor original.
 */
private transformarLoteVacuna(valor: string): string {// regex dinámica.
  if (!valor) return valor;

  // Lista de palabras/frases a homologar
  const palabrasClave = [
    'SE DESCONOCE EL LOTE',
    'SE DESCONOCE',
    'DESCONOCE',
    'DESCONOCIDO',
    'N/R',
    'Ni idea',
    'no aplica',
    'no reporta',
    'NO SE DISPONE',
    'NO DISPONIBLE',
    'NO REGISTRA',
    'Asked But Unknown',
    'NO INDICA',
  ]; //Funciona muy bien, incluso no ha sido necesario agregar otro valor que aparece: "Número de lote desconocido"

  // Construcción dinámica de la expresión regular
  const regex = new RegExp(
    `(^|\\s)(${palabrasClave.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(\\s|$)`,
    'i',
  );

  return regex.test(valor.trim()) ? 'Desconocido' : valor;
}
  formatoFecha(valor: string): Date | null {
    if (valor && valor.length >= 6 && valor !== '') {
      const year = parseInt(valor.substring(0, 4), 10);
      const month = parseInt(valor.substring(4, 6), 10);
      // Cuando la fecha solo tiene YYYYMM (sin día), se usa el 15 como día por defecto
      const dayStr = valor.substring(6, 8);
      const day = dayStr ? (parseInt(dayStr, 10) || 15) : 15;
      const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  analizarCadenaFecha(dateStr: string): Date | null {
    if (!/^\d{8}$/.test(dateStr)) {// Verifica que la cadena tenga exactamente 8 dígitos
       //console.log(`La fecha: "${dateStr}" no es válida, se esperan 8 dígitos.`);
       return null;
      } 
      const year = Number(dateStr.slice(0, 4)); 
      const month = Number(dateStr.slice(4, 6)); 
      const day = Number(dateStr.slice(6, 8));
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        //throw new Error("Fecha inválida");
        //console.log(`Fecha: "${dateStr}" inválida", se espera este formato YYYYMMDD`);
        return null;
      }
      //const fecha = new Date(year, month - 1, day); //mes en TypeScript empieza en 0 o es base 0
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0)); // Retorna la fecha en formato UTC
    //return fecha.setHours(0,0,0,0), fecha; // Para trabajar solo a nivel nacional, no se necesita UTC. Además al trabajar con formato local, evita errores de desfase horario, y se puede comparar las entradas con las salidas, o las que se almacenan en la base de datos.
  }

  /** * Convierte una cadena con saltos de línea en un arreglo JSON * con la estructura [{ ingredient: "..." }, ...] */
  parseIngredientsToJson(rawText?: string): { ingredient: string }[] {
    if (!rawText || typeof rawText !== 'string') {
      return []; // Retorna un arreglo vacío si no hay texto o no es string
    }

    return rawText
      .split(/\r?\n/) // divide por \n o \r\n 
      .map(line => line.trim()) // limpia espacios y posibles \r 
      .filter(line => line !== '') // descarta líneas vacías 
      .map(line => ({ ingredient: line })); // construye el objeto
  }

  /** * Convierte una cadena con punto y comas en un arreglo JSON * con la estructura [{ ingredient: "..." }, ...] 
   * - Divide la cadena por punto y coma ';'
   * - Limpia espacios y posibles caracteres de retorno de carro '\r' alrededor de cada término
   * - Descarta términos vacíos resultantes de divisiones consecutivas o espacios
   * - Construye un arreglo de objetos con la propiedad "ingredient" para cada término válido
  */
  parseIngredientsWithSemicolonsToJson(rawText?: string): { ingredient: string }[] {
    if (!rawText || typeof rawText !== 'string') {
      return []; // Retorna un arreglo vacío si no hay texto o no es string
    }

    return rawText
      .split(';') // divide por punto y coma
      .map( termino => termino.trim() ) // limpia espacios y posibles \r 
      .filter(termino => termino !== '') // descarta términos vacías 
      .map(termino => ({ ingredient: termino })); // construye el objeto
  }
  
  validarCodigoAtcVacuna(cadena: string): boolean {
    // Verifica que la cadena empiece con "J07"
    const empiezaConPrefijo = cadena.startsWith('J07');
  
    // Verifica que la longitud sea como máximo 7 caracteres
    const longitudValida = cadena.length <= 7;
  
    // Retorna true solo si ambas condiciones se cumplen
    return empiezaConPrefijo && longitudValida;
  }

  extraerCodigoAtcVacuna(celda: string): string | null {
    if (!celda) return null;
  
    // Dividir el contenido de la celda por saltos de línea
    const elementos = celda.split(/\r?\n/);
  
    // Buscar el código ATC válido
    for (const elemento of elementos) {
      const valor = elemento.trim();
  
      // Validar: empieza con J07 y longitud máxima de 7 caracteres
      if (valor.startsWith("J07") && valor.length <= 7) {
        return valor;
      }
    }
  
    // Si no se encuentra ningún código válido
    return null;
  }
  

  /**
 * Limpia una cadena de texto según las reglas:
 * - Elimina espacios al inicio y al final
 * - Reemplaza comas por punto y coma
 * - Reemplaza saltos de línea internos por punto y coma
 * - Elimina saltos de línea al final de la cadena
 * - Elimina espacios antes y después del punto y coma
 */
private limpiarCampoWHODrug(input?: string): string {
  if (!input) return '';

  return input
    .trim() // elimina espacios al inicio y al final
    // reemplaza saltos de línea internos por ;
    .replace(/[\r\n]+(?!$)/g, ';')
    // elimina saltos de línea al final (si los hay)
    .replace(/[\r\n]+$/g, '')
    // reemplaza comas por punto y coma // Para omitir este paso, se utiliza otro catálogo Excel auxiliar con los valores posibles existenes en VigiFlow, y mapeados manualmente a WHODrug oficial.
    //--//.replace(/,/g, ';') //No se puede reemplazar de forma sencilla la coma por el punto y coma, porque, en varios nombres de patente WHODrug, existen comas que son parte del nombre oficial, por ejm: |(13949709002T) Hexasiil - Vacuna Conjugada (Adsorbida) Antidiftérica, Antitetánica y Contra la Tosferina (de célula entera), Hepatitis B (rADN), Poliomielitis (inactivada) y Haemophilus influenzae Tipo b|(13950602109)BE Td - Vacuna Contra La Difteria Y El Tétanos (Adsorbida, Contenido De Antígeno(s) Reducido) (Tiomersal Reducido)|.
    // elimina espacios alrededor del ; (punto y coma)
    .replace(/\s*;\s*/g, ';');
}

/**
   * Verifica si algún objeto del array tiene la propiedad indicada en null.
   * @param items Array de objetos
   * @param prop Nombre de la propiedad a validar
   * @returns true si existe al menos un objeto con la propiedad en null, false en caso contrario
   */
static tienePropiedadNula<T extends Record<string, any>>(items: T[] | null | undefined, prop: keyof T): boolean {
  // Validar si no se recibe nada o el array está vacío
  if (!items || items.length === 0) {
    //console.warn("No se recibió ningún objeto para validar.");
    return false;
  }

  // Recorrido eficiente con for...of
  for (const obj of items) {
    if (obj[prop] === null) {
      return true; // se detiene en el primer hallazgo
    }
  }

  return false; // si no encontró ninguno
}



// Función para transformar el valor a número
/*transformarTipoEmisor(tipo: string): number | null {
  return tipoEmisorMap[tipo] ?? null; 
}*/

private transformarTipoEmisor(tipoEmisorTexto: string): string | null {
  // Definimos un diccionario para mapear los valores
  let tipoEmisorMap: Record<string, string> = {
    'Profesional de la salud': '1',
    'Paciente / consumidor': '2',
    'Laboratorio farmacéutico': '3',
    'Centro regional de farmacovigilancia': '4',
    'Otro': '5',
  }; 

  if (tipoEmisorTexto) {
    // Normalizamos el texto
    const tipoEmisor = tipoEmisorTexto.trim();//.toUpperCase();

    // Retornamos el valor si existe en el diccionario
    if (tipoEmisorMap[tipoEmisor] !== undefined) {
      return tipoEmisorMap[tipoEmisor];
    } else {
      //console.log(`Valor de ... no reconocido: "${Texto}". Se asignará null.`);
      return null; // return null si no se reconoce el valor
    }
  } else {
    //console.log(`Valor de ... vacío o nulo: "${Texto}". Se asignará null.`);
    return null; // return null si no se reconoce el valor
  }  
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

  sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  eliminarTildes(str) {
    try {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } catch (error) {}
  }


  obtenerPrimerComentario(cadena: string): string {
    // Verifica si la cadena existe y la divide por los delimitadores definidos
    return cadena ? cadena.split(/\r?\n|\r|\t|,/)[0] : '';
  }

  normalizarTexto(texto: string): string {
    // Eliminar acentos y convertir todo a minúsculas
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  encontrarCoincidencia(entrada, lista) {
    const entradaNormalizada = this.normalizarTexto(entrada);
    return lista.find((item) => this.normalizarTexto(item).includes(entradaNormalizada));
  }

  esAfirmativo(valor) {
    const val = (valor || '').toString().trim().toLowerCase();
    return val === 'si' ? true : val === 'no' ? false : null;
  }
  transformarTipoSiNo(valor) {
    const val = (valor || '').toString().trim().toLowerCase();
    return val === 'si' ? '1' : val === 'no' ? '0' : null;
  }
}