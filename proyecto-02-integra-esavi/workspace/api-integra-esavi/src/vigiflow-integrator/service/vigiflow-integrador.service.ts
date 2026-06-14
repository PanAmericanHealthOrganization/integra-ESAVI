import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs/promises';
import * as moment from 'moment/moment';
import * as countries from 'i18n-iso-countries';
import * as enLocale from 'i18n-iso-countries/langs/en.json';
import * as esLocale from 'i18n-iso-countries/langs/es.json';
import { CreatePacienteEmbarazadaDto } from 'src/integrator/dto/create-paciente-embarazada.dto';
import { UbicacionDto } from 'src/integrator/dto/ubicacion.dto';
import { UpdateAntecedenteEmbarazoDto } from 'src/integrator/dto/update-antecedente-embarazo.dto';
import { Auditoria, IAuditoria } from 'src/integrator/entity/auditoria.entity';
import { AntecedenteEmbarazoService } from 'src/integrator/service/antecedente-embarazo.service';
import { DatoEsaviService } from 'src/integrator/service/dato-esavi.service';
import { MeddraLLTService } from 'src/meddra/services/meddra-lt.service';
import { MeddraPtService } from 'src/meddra/services/meddra-pt.service';
import { MeddraSocService } from 'src/meddra/services/meddra-soc.service';
import { ActiveIngredientsService } from 'src/whodrugs/services/activeIngredients.service';
import { DrugService } from 'src/whodrugs/services/drugs.service';
import { MaholderService } from 'src/whodrugs/services/maholder.service';
import { read, utils, WorkBook } from 'xlsx';
import { CreateCompleteDto } from '../../integrator/dto/create-complete.dto';
import { CreateDatoEsaviDto } from '../../integrator/dto/create-dato-esavi.dto';
import { CreateDatoVacunaDto } from '../../integrator/dto/create-dato-vacuna.dto';
import { CreateDatoVacunacionDto } from '../../integrator/dto/create-dato-vacunacion.dto';
import { CreateDesenlaceEsaviDto } from '../../integrator/dto/create-desenlace-esavi.dto';
import { CreateGravedadEsaviDto } from '../../integrator/dto/create-gravedad-esavi.dto';
import { CreateMedicamentoDto } from '../../integrator/dto/create-medicamento.dto';
import { CreateNotificacionDto } from '../../integrator/dto/create-notificacion.dto';
import { CreatePacienteVigiflowDto } from '../../integrator/dto/create-paciente-vigiflow.dto';
import { UpdateNotificacionDto } from '../../integrator/dto/update-notificacion.dto';
import { UpdateDatoVacunaDto } from '../../integrator/dto/update-dato-vacuna.dto';
import { SourceEnum } from '../../integrator/enum/source-enum';
import { IntegradorService } from '../../integrator/facade/integrador.service';
import { DatoVacunaService } from '../../integrator/service/dato-vacuna.service';
import { MedicamentoService } from '../../integrator/service/medicamento.service';
import { NotificacionVigiflowService } from '../../integrator/service/notificacion-vigiflow.service';
import { PacienteVigiflowService } from '../../integrator/service/paciente-vigiflow.service';
import { VigiflowCrawlerService } from './vigiflow-crawler.service';
import { WhodrugVacsTemp } from 'src/integrator/entity/whodrug-vacstemp.entity';
import { WhodrugVacsTempService } from 'src/integrator/service/whodrug-vacstemp.service';
import { WhodrugHomologaVacsService } from 'src/integrator/service/whodrug-homologavacs.service';
import { WhodrugHomologaVacs } from 'src/integrator/entity/whodrug-homologavacs.entity';

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
    private readonly pacienteVigiflowService: PacienteVigiflowService,
    private readonly notificacionVigiflowService: NotificacionVigiflowService,
    private readonly medicamentoService: MedicamentoService,
    private readonly datoVacunaService: DatoVacunaService,
    private readonly datoEsaviService: DatoEsaviService,
    private readonly antecedenteEmbarazo: AntecedenteEmbarazoService,
    private readonly drugService: DrugService,
    private readonly maholderService: MaholderService,
    private readonly activeIngredentService: ActiveIngredientsService,
    private readonly whodrugVacsTempService: WhodrugVacsTempService,
    private readonly whodrugHomologaVacsService: WhodrugHomologaVacsService,

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
      // Calcular la fecha de fin como el último día del mes de fechaInicio
      const fechaFin = moment.utc(this.fechaInicio).endOf('month').toDate();
      // Llamar a la función de procesamiento
      await this.createInBulk(this.fechaInicio, fechaFin);

      // Avanzar fechaInicio al primer día del siguiente mes
      this.logger.log(
        `Procesado desde ${moment.utc(this.fechaInicio).toISOString()} hasta ${moment.utc(fechaFin).toISOString()}`,
      );
      this.fechaInicio = moment.utc(this.fechaInicio).add(1, 'month').startOf('month').toDate();
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
    const fechaInicioFmrt = moment.utc(fechaInicio).format('YYYYMMDD');
    const fechaFinFmrt = moment.utc(fechaFin).format('YYYYMMDD');

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
    // Procesamos el segundo reporte
    await this.extractedFromJsonReportToUpdate(reportTwo);
    await this.sleep(8000);
    this.logger.log('extractedFromJsonReportToCreateMedicamento..................');
    // Procesamos el reporte para crear medicamentos
    await this.extractedFromJsonReportToCreateMedicamento(reportTwo);
    await this.sleep(8000);
    this.logger.log('extractedFromJsonReportToCreateReaccion..................');
    // Procesamos el reporte para crear reacciones
    await this.extractedFromJsonReportToCreateReaccion(reportTwo);
    await this.sleep(3000);
    this.logger.log('Fin Proceso..................');
  }

   // *** ARCHIVOS LOCALES
    // const reportTwo = read(archivo2);
    // Procesamos el primer reporte
  public async createInBulkFromFile() {
    const aefiFilePath = this.configService.get<string>('VIGIFLOW_FILE_AEFI', './upload_files/files_meddra/aefi.xlsx');
    const reportFilePath = this.configService.get<string>('VIGIFLOW_FILE_REPORT', './upload_files/files_meddra/report.xlsx');
    const reportOne = read(await fs.readFile(aefiFilePath));
    const reportTwo = read(await fs.readFile(reportFilePath));

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
    for (const reg of reports) {
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
      paciente.identificacion = reg['E'];
      paciente.sexoPaciente = reg['F'];
      paciente.codigoVigiflow = reg['B'] && reg['B'] ? reg['B'].toString().trim():null; // Viene desde la hoja AEFI columna B
      paciente.inicialesNombre = reg['C'];

      // Create Notificacion
      const notificacion = new CreateNotificacionDto();
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
      embarazada.momentoEsavi = reg['J'] && this.eliminarTildes(reg['J']).toLowerCase().includes('si')?'1':'0';

      //Complete the dto
      let create = new CreateCompleteDto();
      create.source = SourceEnum.VIGIFLOW;
      create.pacienteVigiflow = paciente;
      create.notificacion = notificacion;
      create.gravedadEsavi = grave;
      create.desenlaceEsavi = desenlaceEsaviDto;
      create.datoVacunacion = datoVacunacionDto;
      create.datoVacuna = datoVacunaDto;
      if (embarazada.momentoEsavi) {
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

    const allPatients = await this.pacienteVigiflowService.findAll();
    const patientMap = new Map(allPatients.map(p => [p.codigoVigiflow?.trim(), p]));

    // Usar for...of para esperar que cada operación asíncrona termine
    for (const reg of toUpdate) {
      const paciente = patientMap.get(reg['G']?.toString().trim()) ?? null;

      if (paciente && paciente.id) {
        const notificacionList = await this.notificacionVigiflowService.findByPacienteUUID(paciente.id);

        const notificacion = notificacionList.at(0);

        if (notificacion) {
          const updateNotificacion = new UpdateNotificacionDto();
          updateNotificacion.id = notificacion.id;
          // updateNotificacion.peso = this.formatoInteger(reg['AA']);
          // updateNotificacion.altura = this.formatoFloat(reg['AB']);
          updateNotificacion.casoNarrativo = reg['AC'];
          updateNotificacion.comentarioNotificador = reg['AD'];
          // updateNotificacion.profesionNotificadorParam = reg['AQ'] && this.obtenerPrimerComentario(reg['AQ']);;
          const profesionNotificador = reg['AQ'] && this.obtenerPrimerComentario(reg['AQ']);
          updateNotificacion.profesionNotificadorParam = this.encontrarCoincidencia(profesionNotificador, profesiones); //TODO: En dhis2 y figiflow ya está integrado con FK, solo está pendiente la equivalencia de valores numéricos.
          updateNotificacion.tipoReporte = reg['N'];

          updateNotificacion.organizacionNotificador = reg['AS']; //Se actualiza por recomendación del personal funcional.
          updateNotificacion.organizacionEmisor = reg['AS'];//reg['D']; //Se actualiza por recomendación del personal funcional.
          updateNotificacion.identificacionNotificador = reg['R'];
          updateNotificacion.delegadoOrganizacion = reg['C'];
          updateNotificacion.ultimaEdicionRegistrada = reg['A'];
          updateNotificacion.lactando = reg['Z'] && this.transformarTipoSiNo(reg['Z']);//reg['Z'] && this.esAfirmativo(reg['Z']);
          // Se actualiza la fecha de notificación asignándola, la
          // "fecha de recepción inicial", si esta no existe se la deja con la fecha de notificacion.
          //updateNotificacion.fechaNotificacion = reg['J'] && this.formatoFecha(reg['J'] && reg['J'].toString());
          updateNotificacion.fechaNotificacion = this.analizarCadenaFecha(reg['J'] ? reg['J'].toString() : reg['J']);//reg['J'] && this.analizarCadenaFecha(reg['J'] && reg['J'].toString());
          
          //Por recomendación de PAHO (personal funcional), se actualiza la fecha de reporte nacional con la "fecha de recepción inicial"
          //Recordar que para que surta efecto el nuevo valor asignado, se debe también actualizar en el servicio "notificacion-vigiflow.service.ts", en el método "update".
          updateNotificacion.fechaReporteNacional = this.analizarCadenaFecha(reg['J'] ? reg['J'].toString() : reg['J']);//reg['K'] && this.analizarCadenaFecha(reg['K'] && reg['K'].toString());
          updateNotificacion.tituloNotificador = reg['AR']; // VER SI ES RELEVANTE
          updateNotificacion.residenciaNotificador.canton = reg['AU']; //Distrito/Municipio
          updateNotificacion.residenciaNotificador.parroquia = reg['AT']; //Ciudad (sub-distrito)
          updateNotificacion.tipoEmisor = reg['F'] && this.transformarTipoEmisor(reg['F']);

          //Cuando el paciente es infante hay una variable de si esta lactando que se coloca en la notificacion

          await this.notificacionVigiflowService.update(notificacion, updateNotificacion);

          const antecedenteEmbarazo = new UpdateAntecedenteEmbarazoDto();
          antecedenteEmbarazo.edadGestacional = reg['V'] && Number(reg['V']);
          if (antecedenteEmbarazo.edadGestacional) {
            await this.antecedenteEmbarazo.update(notificacion.id, antecedenteEmbarazo);
          }
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

    const allPatients = await this.pacienteVigiflowService.findAll();
    const patientMap = new Map(allPatients.map(p => [p.codigoVigiflow?.trim(), p]));

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
            }else{ // TODO: Se recomienda implementar la comprobación de la existencia de las tablas de los catálogos WHODRUG en la base de datos, antes de utilizar los catálogos Excel provisionales o temporales.
              
              //const { WorkBook, utils } = require('xlsx');
              //--Inicio --- estandarización utilizando catálogos  E x c e l  provisionales o temporales de WHODRUG.--
              //------------console.log(`No se encontró el nombre de la vacuna en WHODrug: ${drugName} y país: ${country}. Buscando en catálogo CSV...`);
              
              const drugName = nombreVacPatenteWHODrugVigiFlow;
              let activeIngredient = principioActivoWHODrugVigiFlow;
              const whodrugAuxiliar: WhodrugVacsTemp[] = await this.whodrugVacsTempService.getVaccinesByName(drugName);//(await this.whodrugVacsTempService.getVaccinesByName(drugName)).length > 0? await this.whodrugVacsTempService.getVaccinesByName(drugName) : [];
              const whodrug: WhodrugVacsTemp[] = whodrugAuxiliar.length > 0? whodrugAuxiliar : [];
              const cantElementos = whodrug.length;//whodrug.sort((a, b) => a.drugName.length - b.drugName.length); // Ordenar por longitud del nombre del medicamento (de menor a mayor)
              const algunIso3CodeEsNulo = VigiflowIntegradorService.tienePropiedadNula(whodrug, 'countryIso3Code');
              const vacunasEncontradasNoTienenIso3CodeNulo = cantElementos > 1 && !algunIso3CodeEsNulo;
              if( vacunasEncontradasNoTienenIso3CodeNulo ){ activeIngredient = whodrug[0]?.activeIngredient; } // Si se encuentran varias coincidencias pero ninguna tiene código ISO3 de país, se asume que todas corresponden a la vacuna reportada, y se toma el ingrediente activo de la primera coincidencia para continuar con el proceso de comparación.
              
              if ( cantElementos === 0 || ( vacunasEncontradasNoTienenIso3CodeNulo ) ) { //drugName
                const whodrugActiIngr: WhodrugVacsTemp[] = (await this.whodrugVacsTempService.getVaccinesByActiveIngredient(activeIngredient)).length > 0? await this.whodrugVacsTempService.getVaccinesByActiveIngredient(activeIngredient) : [];
                const cantElementosActIng = whodrugActiIngr.length;
                const algunIso3CodeEsNuloActIng = VigiflowIntegradorService.tienePropiedadNula(whodrugActiIngr, 'countryIso3Code');
                
                if( cantElementosActIng === 0 || (cantElementosActIng > 1  && !algunIso3CodeEsNuloActIng) ){ //activeIngredient
                  const whodrugActiIngrTranslation: WhodrugVacsTemp[] = (await this.whodrugVacsTempService.getVaccinesByActIngTranslation(activeIngredient)).length > 0? await this.whodrugVacsTempService.getVaccinesByActIngTranslation(activeIngredient) : [];
                  const cantElementosActIngTransl = whodrugActiIngrTranslation.length;
                  const algunIso3CodeEsNuloActIngTransl = VigiflowIntegradorService.tienePropiedadNula(whodrugActiIngrTranslation, 'countryIso3Code');

                  if( cantElementosActIngTransl === 0 || (cantElementosActIngTransl > 1  && !algunIso3CodeEsNuloActIngTransl ) ){ // activeIngredientTranslation
                    // Si no hay coincidencia al comparar el drugName, activeIngredient y activeIngredientTranslation, 
                    // entonces se debe comparar usando el catálogo Excel auxiliar de homologación.
                    const dnHomologacionVigiFlow: WhodrugHomologaVacs[] = (await this.whodrugHomologaVacsService.getHomologatedVaccByDrugName(drugName)).length > 0? await this.whodrugHomologaVacsService.getHomologatedVaccByDrugName(drugName) : [];
                    const nElementosHomologacionVigiFlow = dnHomologacionVigiFlow.length;

                    if( nElementosHomologacionVigiFlow === 1 && dnHomologacionVigiFlow[0].drugNameWhodrug != 'Sin coincidencia' ){ // drugName homologado en VigiFlow // Como en el algoritmo no se considera la posibilidad de existencia de más de un elemento, se asume que en este nivel solo habrá uno.
                      const whodrugTemp: WhodrugVacsTemp[] = (await this.whodrugVacsTempService.getVaccinesByName( dnHomologacionVigiFlow[0].drugNameWhodrug )).length > 0? await this.whodrugVacsTempService.getVaccinesByName( dnHomologacionVigiFlow[0].drugNameWhodrug ) : [];
                      const cantElementosTemp = whodrugTemp.length;

                      if( cantElementosTemp === 1 ){
                        updateDatoVacuna.drugCode = whodrugTemp[0]?.drugCode;
                        updateDatoVacuna.drugName = whodrugTemp[0]?.drugName;
                        updateDatoVacuna.strengthPotencia = whodrugTemp[0]?.strength;
                        updateDatoVacuna.formaFarmaceutica = whodrugTemp[0]?.pharmaceuticalForm;
                        updateDatoVacuna.paisAutorizacionIso3Code = whodrugTemp[0]?.countryIso3Code;
                        updateDatoVacuna.medicinalProductId = whodrugTemp[0]?.medicinalProductId;
                        updateDatoVacuna.esGenerico = whodrugTemp[0]?.isGeneric;

                        updateDatoVacuna.maHolderJsonb = [{ // Se genera un valor compatible con JSONB, pero el mapeo a JSONB ocurre en la capa de persistencia (ORM/driver + PostgreSQL), no en el código map en sí.
                          name: whodrugTemp[0]?.maHolder,
                          medicinalProductID: whodrugTemp[0]?.maHolderMediProdId, // Se debe recordar que el MPID principal del medicamento es diferente al valor del MPID del maHolder.
                        }];
                        updateDatoVacuna.activeIngredientJson = this.parseIngredientsWithSemicolonsToJson(
                          whodrugTemp[0]?.activeIngredient //La propiedad "ingredient" solo es etiqueta y se converirá en la clave dentro del objeto JSON.
                        );
                      }

                    }
                  }else if( cantElementosActIngTransl === 1 ){
                    updateDatoVacuna.drugCode = whodrugActiIngrTranslation[0]?.drugCode;
                    updateDatoVacuna.drugName = whodrugActiIngrTranslation[0]?.drugName;
                    updateDatoVacuna.strengthPotencia = whodrugActiIngrTranslation[0]?.strength;
                    updateDatoVacuna.formaFarmaceutica = whodrugActiIngrTranslation[0]?.pharmaceuticalForm;
                    updateDatoVacuna.paisAutorizacionIso3Code = whodrugActiIngrTranslation[0]?.countryIso3Code;
                    updateDatoVacuna.medicinalProductId = whodrugActiIngrTranslation[0]?.medicinalProductId;
                    updateDatoVacuna.esGenerico = whodrugActiIngrTranslation[0]?.isGeneric;

                    updateDatoVacuna.maHolderJsonb = [{ // Se genera un valor compatible con JSONB, pero el mapeo a JSONB ocurre en la capa de persistencia (ORM/driver + PostgreSQL), no en el código map en sí.
                      name: whodrugActiIngrTranslation[0]?.maHolder,
                      medicinalProductID: whodrugActiIngrTranslation[0]?.maHolderMediProdId, // Se debe recordar que el MPID principal del medicamento es diferente al valor del MPID del maHolder.
                    }];
                    updateDatoVacuna.activeIngredientJson = this.parseIngredientsWithSemicolonsToJson(
                      whodrugActiIngrTranslation[0]?.activeIngredient //La propiedad "ingredient" solo es etiqueta y se converirá en la clave dentro del objeto JSON.
                    );

                  }else if( cantElementosActIngTransl > 1 && algunIso3CodeEsNuloActIngTransl ){
                    const wdActiIngrTranslation: WhodrugVacsTemp[] = await this.whodrugVacsTempService.getVaccsByActIngTranslationAndIso3CodeNull(activeIngredient);
                    updateDatoVacuna.drugCode = wdActiIngrTranslation[0]?.drugCode;
                    updateDatoVacuna.drugName = wdActiIngrTranslation[0]?.drugName;
                    updateDatoVacuna.strengthPotencia = wdActiIngrTranslation[0]?.strength;
                    updateDatoVacuna.formaFarmaceutica = wdActiIngrTranslation[0]?.pharmaceuticalForm;
                    updateDatoVacuna.paisAutorizacionIso3Code = wdActiIngrTranslation[0]?.countryIso3Code;
                    updateDatoVacuna.medicinalProductId = wdActiIngrTranslation[0]?.medicinalProductId;
                    updateDatoVacuna.esGenerico = wdActiIngrTranslation[0]?.isGeneric;

                    updateDatoVacuna.maHolderJsonb = [{ // Se genera un valor compatible con JSONB, pero el mapeo a JSONB ocurre en la capa de persistencia (ORM/driver + PostgreSQL), no en el código map en sí.
                      name: wdActiIngrTranslation[0]?.maHolder,
                      medicinalProductID: wdActiIngrTranslation[0]?.maHolderMediProdId, // Se debe recordar que el MPID principal del medicamento es diferente al valor del MPID del maHolder.
                    }];
                    updateDatoVacuna.activeIngredientJson = this.parseIngredientsWithSemicolonsToJson(
                      wdActiIngrTranslation[0]?.activeIngredient //La propiedad "ingredient" solo es etiqueta y se converirá en la clave dentro del objeto JSON.
                    );
                  } else {}

                }else if( cantElementosActIng === 1 ){
                  updateDatoVacuna.drugCode = whodrugActiIngr[0]?.drugCode;
                  updateDatoVacuna.drugName = whodrugActiIngr[0]?.drugName;
                  updateDatoVacuna.strengthPotencia = whodrugActiIngr[0]?.strength;
                  updateDatoVacuna.formaFarmaceutica = whodrugActiIngr[0]?.pharmaceuticalForm;
                  updateDatoVacuna.paisAutorizacionIso3Code = whodrugActiIngr[0]?.countryIso3Code;
                  updateDatoVacuna.medicinalProductId = whodrugActiIngr[0]?.medicinalProductId;
                  updateDatoVacuna.esGenerico = whodrugActiIngr[0]?.isGeneric;

                  updateDatoVacuna.maHolderJsonb = [{ // Se genera un valor compatible con JSONB, pero el mapeo a JSONB ocurre en la capa de persistencia (ORM/driver + PostgreSQL), no en el código map en sí.
                    name: whodrugActiIngr[0]?.maHolder,
                    medicinalProductID: whodrugActiIngr[0]?.maHolderMediProdId, // Se debe recordar que el MPID principal del medicamento es diferente al valor del MPID del maHolder.
                  }];
                  updateDatoVacuna.activeIngredientJson = this.parseIngredientsWithSemicolonsToJson(
                    whodrugActiIngr[0]?.activeIngredient //La propiedad "ingredient" solo es etiqueta y se converirá en la clave dentro del objeto JSON.
                  );

                }else if( cantElementosActIng > 1 && algunIso3CodeEsNuloActIng ){
                  const wdActiIngr: WhodrugVacsTemp[] = await this.whodrugVacsTempService.getVaccsByActiveIngredientAndIso3CodeNull(activeIngredient);
                  updateDatoVacuna.drugCode = wdActiIngr[0]?.drugCode;
                  updateDatoVacuna.drugName = wdActiIngr[0]?.drugName;
                  updateDatoVacuna.strengthPotencia = wdActiIngr[0]?.strength;
                  updateDatoVacuna.formaFarmaceutica = wdActiIngr[0]?.pharmaceuticalForm;
                  updateDatoVacuna.paisAutorizacionIso3Code = wdActiIngr[0]?.countryIso3Code;
                  updateDatoVacuna.medicinalProductId = wdActiIngr[0]?.medicinalProductId;
                  updateDatoVacuna.esGenerico = wdActiIngr[0]?.isGeneric;

                  updateDatoVacuna.maHolderJsonb = [{ // Se genera un valor compatible con JSONB, pero el mapeo a JSONB ocurre en la capa de persistencia (ORM/driver + PostgreSQL), no en el código map en sí.
                    name: wdActiIngr[0]?.maHolder,
                    medicinalProductID: wdActiIngr[0]?.maHolderMediProdId, // Se debe recordar que el MPID principal del medicamento es diferente al valor del MPID del maHolder.
                  }];
                  updateDatoVacuna.activeIngredientJson = this.parseIngredientsWithSemicolonsToJson(
                    wdActiIngr[0]?.activeIngredient //La propiedad "ingredient" solo es etiqueta y se converirá en la clave dentro del objeto JSON.
                  );
                } else {}
                
              }else if( cantElementos === 1 ){ //cantElementos === 1 //cantElementos >0
                updateDatoVacuna.drugCode = whodrug[0]?.drugCode;
                updateDatoVacuna.drugName = whodrug[0]?.drugName;
                updateDatoVacuna.strengthPotencia = whodrug[0]?.strength;
                updateDatoVacuna.formaFarmaceutica = whodrug[0]?.pharmaceuticalForm;
                updateDatoVacuna.paisAutorizacionIso3Code = whodrug[0]?.countryIso3Code;
                updateDatoVacuna.medicinalProductId = whodrug[0]?.medicinalProductId;
                updateDatoVacuna.esGenerico = whodrug[0]?.isGeneric;

                updateDatoVacuna.maHolderJsonb = [{ // Se genera un valor compatible con JSONB, pero el mapeo a JSONB ocurre en la capa de persistencia (ORM/driver + PostgreSQL), no en el código map en sí.
                  name: whodrug[0]?.maHolder,
                  medicinalProductID: whodrug[0]?.maHolderMediProdId, // Se debe recordar que el MPID principal del medicamento es diferente al valor del MPID del maHolder.
                }];
                updateDatoVacuna.activeIngredientJson = this.parseIngredientsWithSemicolonsToJson(
                  whodrug[0]?.activeIngredient //La propiedad "ingredient" solo es etiqueta y se converirá en la clave dentro del objeto JSON.
                );

              }else if( cantElementos > 1 && algunIso3CodeEsNulo ){
                const whodrugs: WhodrugVacsTemp[] = await this.whodrugVacsTempService.getVaccinesByNameAndIso3CodeNull(drugName);//(await this.whodrugVacsTempService.getVaccinesByNameAndIso3CodeNull(drugName)).length > 0? await this.whodrugVacsTempService.getVaccinesByNameAndIso3CodeNull(drugName) : [];
                updateDatoVacuna.drugCode = whodrugs[0]?.drugCode;
                updateDatoVacuna.drugName = whodrugs[0]?.drugName;
                updateDatoVacuna.strengthPotencia = whodrugs[0]?.strength;
                updateDatoVacuna.formaFarmaceutica = whodrugs[0]?.pharmaceuticalForm;
                updateDatoVacuna.paisAutorizacionIso3Code = whodrugs[0]?.countryIso3Code; //TODO: Probar previamente si no tiene valor, para que no se sobrescriba.
                updateDatoVacuna.medicinalProductId = whodrugs[0]?.medicinalProductId;
                updateDatoVacuna.esGenerico = whodrugs[0]?.isGeneric;

                updateDatoVacuna.maHolderJsonb = [{ // Se genera un valor compatible con JSONB, pero el mapeo a JSONB ocurre en la capa de persistencia (ORM/driver + PostgreSQL), no en el código map en sí.
                  name: whodrugs[0]?.maHolder,
                  medicinalProductID: whodrugs[0]?.maHolderMediProdId, // Se debe recordar que el MPID principal del medicamento es diferente al valor del MPID del maHolder.
                }];
                updateDatoVacuna.activeIngredientJson = this.parseIngredientsWithSemicolonsToJson(
                  whodrugs[0]?.activeIngredient //La propiedad "ingredient" solo es etiqueta y se converirá en la clave dentro del objeto JSON.
                );
              } else {}            

            }//--- Fin --- estandarización utilizando catálogos Excel provisionales o temporales de WHODRUG.--


            if(datoVacunaList.length > 0){
              //actualizar el datoVacuna 'm í n i m o' existente, asociado a la notificación. Se denomina "Mínimo", porque no todas las columnas se encuentran en esta hoja Excel.
              //y fue creado inicialmente con los datos de la hoja AEFI. La cantidad de registros únicos será igual a la cantidad de notificaciones asociadas al paciente.

              await this.datoVacunaService.update(datoVacunaList[0].id, updateDatoVacuna);
            } else {
              /**Crear un registro completamente nuevo de DatoVacuna asociado a la 
               * notificación, utilizando el método "create" del servicio datoVacunaService.
               * "create" utiliza filtros internos de TypeORM para evitar duplicados.
               * */
              await this.datoVacunaService.create(notificacion, updateDatoVacuna); //Existe otra forma, utilizando la actualización propia que tiene este método create.
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

    const allPatients = await this.pacienteVigiflowService.findAll();
    const patientMap = new Map(allPatients.map(p => [p.codigoVigiflow?.trim(), p]));

    // toCreate.map(async (reg) => {
    for (const reg of toCreate) {
      const paciente = patientMap.get(reg['A']?.toString().trim()) ?? null;

      if (paciente) {
        const notificacionList = await this.notificacionVigiflowService.findByPacienteUUID(paciente.id);
        const notificacion = notificacionList.at(0);

        let datoEsavi = new CreateDatoEsaviDto();
        datoEsavi = { ...datoEsavi, ...auditoria };

        datoEsavi.nombre = reg['D'] && reg['D'].toUpperCase();
        //datoEsavi.nombreReportado = reg['C'] && reg['C'].toUpperCase();
        const nombreEsaviReportadoMayusculas = reg['C'] && reg['C'].toUpperCase();
        datoEsavi.nombreReportado = reg['C'] && this.eliminarSaltoLinea(nombreEsaviReportadoMayusculas);
        datoEsavi.fechaEsavi = this.formatoFecha(reg['I'] ? reg['I'].toString() : reg['I']);
        datoEsavi.fechaFinalizacion = this.formatoFecha(reg['J'] ? reg['J'].toString() : reg['J']);
        datoEsavi.duracion = reg['K'];
        datoEsavi.resultado = reg['N'];
        datoEsavi.nameLLT = reg['D'] && reg['D'].toUpperCase();
        datoEsavi.namePT = reg['E'] && reg['E'].toUpperCase();
        datoEsavi.nameHLT = reg['F'] && reg['F'].toUpperCase();
        datoEsavi.nameHLGT = reg['G'] && reg['G'].toUpperCase();
        datoEsavi.nameSOC = reg['H'] && reg['H'].toUpperCase();

        //TODO: Crear la interfaz para meddra LLT - PT - SOC
        const meddraLlt = await this.meddraLltService.searchLLT(reg['D']);
        const meddraPT = await this.meddraPtService.searchPT(reg['E']);

        // TODO: HLT y HLGT no se encuentran implementados en los servicios de meddra
        // const meddraHLT : any = reg['F'] && await this.meddra.searchPT(reg['F']);
        // const meddraHLGT : any = reg['G'] && await this.meddra.searchPT(reg['G']);

        // busque de SOC
        const meddraSOC = await this.meddraSocService.searchSOC(reg['H']);

        datoEsavi.CTLLTMEDDRA_ID = meddraLlt && meddraLlt.id ? meddraLlt.id : null;
        datoEsavi.CTPTMEDDRA_ID = meddraPT && meddraPT.id ? meddraPT.id : null;

        // TODO: HLT y HLGT no se encuentran implementados en los servicios de meddra
        // datoEsavi.CTHLTMEDDRA_ID = meddraHLT && meddraHLT?.length > 0  ? meddraHLT[0].id : null ;
        // datoEsavi.CTHLGTMEDDRA_ID = meddraHLGT && meddraHLGT?.length > 0  ? meddraHLGT[0].id : null ;
        datoEsavi.CTSOCMEDDRA_ID = meddraSOC && meddraSOC?.id > 0 ? meddraSOC.id : null;

        datoEsavi.codigoLLT = meddraLlt && meddraLlt.id ? meddraLlt.code : null;
        datoEsavi.codigoPT = meddraPT && meddraPT.id ? meddraPT.code : null;

        // TODO: HLT y HLGT no se encuentran implementados en los servicios de meddra
        // datoEsavi.codigoHLT = meddraHLT && meddraHLT?.length > 0 ? meddraHLT[0].code : null ;
        // datoEsavi.codigoHLGT = meddraHLGT && meddraHLGT?.length > 0 ? meddraHLGT[0].code : null ;
        datoEsavi.codigoSOC = meddraSOC && meddraSOC.id ? meddraSOC.code : null;

        //
        datoEsavi.codigoCaso = notificacion.codigoVigiflow;
        await this.datoEsaviService.createVigiflow(notificacion, datoEsavi);
      }
    }
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
  formatoFecha(valor: string) {
    if (valor && valor.length > 0 && valor != '') {
      return moment.utc(valor, 'YYYYMMDD').toDate(); //return moment(valor, 'YYYYMMDD)').toDate();
    }
    return null;
  }//Se comprobó que cuando la fecha viene con la parte de la hora y zona horaria, este método no devuelve ajustado a cero horas, minutos, segundos y milisegundos. En vigiflow no es probable que vengan con la parte de la hora, pero, en DHIS2 si puede venir con la parte de la hora y zona horaria.
  // Actualización: se elimina el paréntesis de cierre del formato de fecha.
  // La definición de la columna en la entidad 'timestamp with time zone': convierte automáticamente a UTC al persistir.
  // Para forzar a UTC, se utiliza 'moment.utc'.
  // Comprobar qué sucese cuando se concatena con la hora cuando los campos diponen este valor en otro Elemento de Datos.

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