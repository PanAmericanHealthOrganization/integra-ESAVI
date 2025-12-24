import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs/promises';
import * as moment from 'moment/moment';
import { throwError } from 'rxjs';
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
import { SourceEnum } from '../../integrator/enum/source-enum';
import { IntegradorService } from '../../integrator/facade/integrador.service';
import { DatoVacunaService } from '../../integrator/service/dato-vacuna.service';
import { MedicamentoService } from '../../integrator/service/medicamento.service';
import { NotificacionVigiflowService } from '../../integrator/service/notificacion-vigiflow.service';
import { PacienteVigiflowService } from '../../integrator/service/paciente-vigiflow.service';
import { VigiflowCrawlerService } from './vigiflow-crawler.service';

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
    private readonly meddraLltService: MeddraLLTService,
    private readonly meddraPtService: MeddraPtService,
    private readonly meddraSocService: MeddraSocService,
  ) {}

  // private originalFechaInicio: Date = new Date('2017-01-01T00:00:00.000Z'); // Fecha de inicio original
  private originalFechaInicio: Date = new Date('2024-11-01T00:00:00.000Z'); // Fecha de inicio original

  private fechaInicio: Date = this.originalFechaInicio; // Fecha de inicio actual

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

    //This method allows us to persiste the information the first time.
    //Retrieve excel to persist elements
    const reportOne = await this.vigiflowCrawlerService.retrieveExcelReport(
      fechaInicioFmrt,
      fechaFinFmrt,
      codigoATC, // (J07BX=Covid-19)
    );
    //Retrieve excel to update elements
    const reportTwo = await this.vigiflowCrawlerService.retrieveJsonReport(fechaInicioFmrt, fechaFinFmrt, codigoATC);
   
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
    // Leer los archivos desde files_meddra
    const reportOne = read(
      await fs.readFile('./upload_files/files_meddra/borrar.fuente-VigiFlow_AEFILinelisting_20082025_092447.xlsx'),
    );
    const reportTwo = read(await fs.readFile('./upload_files/files_meddra/borrar.VigiFlow_Excel_22082025_111315.xlsx'));

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
    const importRange = 'A2:AS2990';
    const headers = 'A';
    const reports = utils.sheet_to_json(ws, {
      range: importRange,
      header: headers,
      raw: true, // 👈 fuerza a no convertir tipos
      defval: '', // 👈 opcional: asigna valor por defecto si la celda está vacía, con esto se muestran todas las columnas, incluso si etán vacías.
    });
    this.logger.log(`Numero de reportes de vigiflow ${reports.length}`);
    reports.map(async (reg) => {
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

      // Create Paciente Vigiflow
      const paciente = new CreatePacienteVigiflowDto();
      paciente.identificacion = reg['E'];
      paciente.sexoPaciente = reg['F'];
      paciente.codigoVigiflow = reg['B'];
      paciente.nombre = reg['C'];

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
        throwError(`Edad o unidad de edad, no válida para el paciente con código Vigiflow: ${paciente.codigoVigiflow}`);
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

      //notificacion.unidadEdadPaciente = reg['I'] && reg['I'].toUpperCase();
      notificacion.organizacion = reg['AF'];
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
          ? 2
          : 3;
      desenlaceEsaviDto.comentarios = reg['Z'] && this.obtenerPrimerComentario(reg['Z']); // Guarda solo el primer comentario, hasta encontrar un salto de linea
      const fechaInvestigacion = this.formatoFecha(reg['AM'] ? reg['AM'].toString() : reg['AM']);
      if (fechaInvestigacion) {
        desenlaceEsaviDto.fechaInicioInvestigacion = fechaInvestigacion;
      }

      //Create Dato Vacunacion
      const datoVacunacionDto = new CreateDatoVacunacionDto();
      datoVacunacionDto.nombreVacunatorio = reg['AF'];
      datoVacunacionDto.fechaVacunacion = this.formatoFecha(reg['N'] ? reg['N'].toString() : reg['N']);

      //Create Dato Vacuna
      const datoVacunaDto = new CreateDatoVacunaDto();
      datoVacunaDto.numeroDosisVacuna = numeroDosisVacuna;

      //Paciente Embarazada
      const embarazada = new CreatePacienteEmbarazadaDto();
      embarazada.momentoEsavi = reg['J'] && this.eliminarTildes(reg['J']).toLowerCase().includes('si');

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

      return;
    });
  }

  //Extracción de los datos de la hoja [1] de nombre 'Reportes', del libro
  //de Excel 'VigiFlow_Excel_ddmmaaaa_hhmmss.xlsx'. Recordar que la hoja [0], no
  //contiene información. Estos nuevos campos permiten completar la tabla
  //de NOTIFICACON, mediante un proceso de actualización.
  async extractedFromJsonReportToUpdate(workbook2: WorkBook) {
    //Convert file to json
    const ws2 = await workbook2.Sheets[workbook2.SheetNames[1]];
    const importRange2 = 'A2:AX2915';
    const headers2 = 'A';
    const toUpdate = utils.sheet_to_json(ws2, {
      range: importRange2,
      header: headers2,
      raw: true, // 👈 fuerza a no convertir tipos
      defval: '', // 👈 opcional: asigna valor por defecto si la celda está vacía, con esto se muestran todas las columnas, incluso si etán vacías.
    });

    toUpdate.map(async (reg) => {
      const paciente = await this.pacienteVigiflowService.findByVigiflowCode(reg['G']);

      if (paciente && paciente.id) {
        const notificacionList = await this.notificacionVigiflowService.findByPacienteUUID(paciente.id);

        const notificacion = notificacionList.at(0);

        if (notificacion) {
          const updateNotificacion = new UpdateNotificacionDto();
          updateNotificacion.id = notificacion.id;
          // updateNotificacion.peso = this.formatoInteger(reg['AA']);
          // updateNotificacion.altura = this.formatoFloat(reg['AB']);
          updateNotificacion.casoNarrativo = reg['AC'];
          updateNotificacion.comentario = reg['AD'];
          // updateNotificacion.profesionNotificadorParam = reg['AQ'] && this.obtenerPrimerComentario(reg['AQ']);;
          const profesionNotificador = reg['AQ'] && this.obtenerPrimerComentario(reg['AQ']);
          updateNotificacion.profesionNotificadorParam = this.encontrarCoincidencia(profesionNotificador, profesiones);
          updateNotificacion.tipoReporte = reg['N'];
          updateNotificacion.organizacionEmisor = reg['D'];
          updateNotificacion.identificacionNotificador = reg['R'];
          updateNotificacion.delegadoOrganizacion = reg['C'];
          updateNotificacion.ultimaEdicionRegistrada = reg['A'];
          updateNotificacion.lactando = reg['Z'] && this.esAfirmativo(reg['Z']);
          // Se actualiza la fecha de notificación asignándola, la
          // "fecha de recepción inicial", si esta no existe se la deja con la fecha de notificacion.
          //updateNotificacion.fechaNotificacion = reg['J'] && this.formatoFecha(reg['J'] && reg['J'].toString());
          updateNotificacion.fechaNotificacion = this.analizarCadenaFecha(reg['J'] ? reg['J'].toString() : reg['J']);//reg['J'] && this.analizarCadenaFecha(reg['J'] && reg['J'].toString());
          updateNotificacion.tituloNotificador = reg['AR']; // VER SI ES RELEVANTE
          updateNotificacion.residenciaNotificador.canton = reg['AU'];

          //Cuando el paciente es infante hay una variable de si esta lactando que se coloca en la notificacion

          await this.notificacionVigiflowService.update(notificacion, updateNotificacion);

          const antecedenteEmbarazo = new UpdateAntecedenteEmbarazoDto();
          antecedenteEmbarazo.edadGestacional = reg['V'] && Number(reg['V']);
          if (antecedenteEmbarazo.edadGestacional) {
            await this.antecedenteEmbarazo.update(notificacion.id, antecedenteEmbarazo);
          }
        }
      }
    });
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
    const importRange2 = 'A2:AX2915';
    const headers2 = 'A';
    const toUpdate = utils.sheet_to_json(ws2, {
      range: importRange2,
      header: headers2,
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

    // Iterar con for...of para esperar las respuestas
    for (const reg of toUpdate) {
      const paciente = await this.pacienteVigiflowService.findByVigiflowCode(reg['B']);
      if (paciente) {
        const notificacionList = await this.notificacionVigiflowService.findByPacienteUUID(paciente.id);
        const notificacion = notificacionList.at(0);
        let medicamento = new CreateMedicamentoDto();
        medicamento.rolMedicamento = reg['C'];
        medicamento.nombre = reg['D'];
        medicamento.codigoATC = reg['G'];
        medicamento = { ...medicamento, ...auditoria };

        // Comentado el método de creación de medicamento para no ejecutarlo
        await this.medicamentoService.createOneToOne(notificacion, medicamento);

        let datoVacuna = new CreateDatoVacunaDto();
        datoVacuna.nombreVacuna = reg['D'];
        datoVacuna.accionTomada = reg['M'];
        datoVacuna.dosis = reg['S'];
        datoVacuna.intervaloDosificacion = reg['T'];
        datoVacuna.dosis1 = reg['U'];
        datoVacuna.duracion = reg['V'];
        datoVacuna.inicioAdministracion = this.formatoFecha(reg['W'] ? reg['W'].toString() : reg['W']);
        datoVacuna.finAdministracion = this.formatoFecha(reg['X'] ? reg['X'].toString() : reg['X']);
        datoVacuna.formaFarmaceutica = reg['Y'];
        datoVacuna.formaFarmaceuticaEDQM = reg['Z'];
        datoVacuna.viaAdministracion = reg['AA'];
        datoVacuna.viaAdministracionEDQM = reg['AB'];
        datoVacuna.paisAutorizacion = reg['J'];
        //datoVacuna.numeroLote = reg['AE'];
        datoVacuna.numeroLote = reg['AE'] && this.transformarLoteVacuna(reg['AE']);
        datoVacuna.indicacionMeddra = reg['Q'];
        datoVacuna.nombreVacunaPatenteWhoDrug = reg['E'];
        datoVacuna.codigoAtc = reg['G'];
        datoVacuna.rolVacuna = reg['C']; // Se revisó, y es la misma variable "Rol del medicamento", no hay una variable específica para vacuna.

        const drugName = datoVacuna.nombreVacunaPatenteWhoDrug;
        const whodrug: any[] = await this.drugService.getDrugsOnly(drugName, country);
        if (whodrug.length > 0) {
          datoVacuna.drugCode = whodrug[0]?.drugCode;
          const mah = await this.maholderService.getMaholderOfDrug(whodrug[0]?.id, country);
          datoVacuna.mahholdersJson = mah.map((item) => ({
            name: item.name,
            medicinalProductID: item.medicinalProductID,
          }));
          const ingredentActive = await this.activeIngredentService.getActiveIngredentsOfDrug(whodrug[0]?.id);
          datoVacuna.activeIngredientsJson = ingredentActive.map((item) => ({
            ingredent: item.ingredient,
          }));
        }
        datoVacuna = { ...datoVacuna, ...auditoria };

        await this.datoVacunaService.createVigiflow(notificacion, datoVacuna);
      } else {
        console.log(`Please checkout ${paciente}`);
      }
    }
  }

  //Extracción de los datos de la hoja [3] de nombre 'Reacciones', del libro
  //de Excel 'VigiFlow_Excel_ddmmaaaa_hhmmss.xlsx'.
  async extractedFromJsonReportToCreateReaccion(workbook2: WorkBook) {
    //Convert file to json
    const ws3 = await workbook2.Sheets[workbook2.SheetNames[3]];
    const importRange2 = 'A2:AX2915';
    const headers2 = 'A';
    const toCreate = utils.sheet_to_json(ws3, {
      range: importRange2,
      header: headers2,
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

    // toCreate.map(async (reg) => {
    for (const reg of toCreate) {
      const paciente = await this.pacienteVigiflowService.findByVigiflowCode(reg['A']);

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


  /**
   *
   * @param input
   * @returns
   */
  private txCompletaLoteVacuna(input: string): string | null { // transformación completa del Lote de Vacuna, en 4 literales(abcd) con regex.
    if (!input) return null;

    let valor = input.trim();

    // a. Eliminar prefijos/sufijos no deseados
    valor = valor.replace(
      /^(LOT:|LOTE|Reg sa:|R\.S\.|Reg\.San\.No\.:|; RG:|Reg\. San\.:|Registro:|RS:|Lote No. |BOPV lote: |DPT: |OPV: |LOTE:)\s*(.*)\s*$/i,
      '$2',
    );

    // b. Reemplazar palabras clave por "Desconocido"
    if (
      /\b(SE DESCONOCE|DESCONOCE|DESCONOCIDO|N\/R|Ni idea|no aplica|no reporta|NO SE DISPONE|NO DISPONIBLE|NO REGISTRA|Asked But Unknown|NO INDICA|SE DESCONOCE EL LOTE )\b/i.test(
        valor,
      )
    ) {
      return 'Desconocido';
    }

    // c. Detectar cantidades/unidades de masa/volumen y asignar NULL
    if (/\d+\s*(mg|ml|g|kg|oz|l|mL|cc)\s*(\/\s*\d+\s*(mg|ml|g|kg|oz|l|mL|cc))?/i.test(valor)) {
      return null;
    }

    // d. Eliminar espacios dentro del número de lote
    valor = valor.replace(/\s*(\w+)\s*(\d+)\s*/g, '$1$2');

    // Normalizar espacios finales/iniciales
    valor = valor.trim();

    return valor || null;
  }

  /**
   * Degrada un término español correcto al formato roto del catálogo histórico.
   * Reglas clave:
   *   í → m     (Neumonía → Neumonma)
   *   é → i     (Afonía → Afonma)
   *   ó → s     (Intoxicación → Intoxicacisn)
   *   ú → z     (úlcera → zlcera)
   *   á → a     (sin tilde, ejemplo Fármaco → Farmaco)
   * Ejemplos:
   *   "Síndrome"      → "Smndrome"
   *   "Clínica"       → "Clmnica"
   *   "Antibiótico"   → "Antibistico"
   *   "Intoxicación"  → "Intoxicacisn"
   *   "Vacunación"    → "Vacunacisn"
   *   "Fármaco"       → "Farmaco"
   *   "Paciente"      → "Paciente" (sin cambios)
   */
  private degradarParaCatalogoRoto = (texto: string): string =>
    texto
      .normalize('NFD') // Separa letras de sus acentos
      .replace(/i\u0301/g, 'm') // í → m  (Neumonía → Neumonma)
      .replace(/I\u0301/g, 'M') // Í → M
      .replace(/e\u0301/g, 'i') // é → i  (Afonía → Afonma)
      .replace(/E\u0301/g, 'I') // É → I
      .replace(/o\u0301/g, 's') // ó → s  (Tóxico → Tsxico)
      .replace(/O\u0301/g, 'S') // Ó → S
      .replace(/u\u0301/g, 'z') // ú → z  (úlcera → zlcera)
      .replace(/U\u0301/g, 'Z') // Ú → Z
      .replace(/[\u0300-\u036f]/g, ''); // Quita todos los demás acentos (á, ú, etc.)

  formatoFecha(valor: string) {
    if (valor && valor.length > 0 && valor != '') {
      return moment(valor, 'YYYYMMDD)').toDate();
    }
    return null;
  }
  analizarCadenaFecha(dateStr: string): Date | null {
    if (!/^\d{8}$/.test(dateStr)) {
       console.log(`Formato inválido, se espera YYYYMMDD: ${dateStr}`);
       return null;
      } 
      const year = Number(dateStr.slice(0, 4)); 
      const month = Number(dateStr.slice(4, 6)); 
      const day = Number(dateStr.slice(6, 8));
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        throw new Error("Fecha inválida");
      }
      const fecha = new Date(year, month - 1, day); //mes en TypeScript empieza en 0 o es base 0
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate())); 
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
}
