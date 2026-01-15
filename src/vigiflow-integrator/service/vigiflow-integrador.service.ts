import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs/promises';import * as fsappend from 'fs';
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
import { UpdateDatoVacunaDto } from '../../integrator/dto/update-dato-vacuna.dto';
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
      paciente.codigoVigiflow = reg['B'];
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
    const importRange2 = 'A2:AX2915';
    const headers2 = 'A';
    const toUpdate = utils.sheet_to_json(ws2, {
      range: importRange2,
      header: headers2,
      raw: true, // 👈 fuerza a no convertir tipos
      defval: '', // 👈 opcional: asigna valor por defecto si la celda está vacía, con esto se muestran todas las columnas, incluso si etán vacías.
    });

    // Usar for...of para esperar que cada operación asíncrona termine
    for (const reg of toUpdate) {
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
          updateNotificacion.comentarioNotificador = reg['AD'];
          // updateNotificacion.profesionNotificadorParam = reg['AQ'] && this.obtenerPrimerComentario(reg['AQ']);;
          const profesionNotificador = reg['AQ'] && this.obtenerPrimerComentario(reg['AQ']);
          updateNotificacion.profesionNotificadorParam = this.encontrarCoincidencia(profesionNotificador, profesiones); //TODO: En dhis2 y figiflow ya está integrado con FK, solo está pendiente la equivalencia de valores numéricos.
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
      const paciente = await this.pacienteVigiflowService.findByVigiflowCode(reg['A']); // No es .findByVigiflowCode(reg['B']); porque ya se comparó los valores con la hoja AEFI, y en realidad su equivalente es la columna 'A' en "Medicamentos".
      if (paciente) {
        const notificacionList = await this.notificacionVigiflowService.findByPacienteUUID(paciente.id);
        const notificacionMed = notificacionList.at(0);//TODO: Iterar por todas las notificaciones asociadas al paciente, o lo que es lo mismo, a su código vigiflow. RECORDAR que un código vigiflow puede tener varios ATC asociados además del J07. Y finalmente, un J07 no siempre aparece en la primera ocurrencia o posiciión del array notificacionList.
        let medicamento = new CreateMedicamentoDto();
        medicamento.rolMedicamento = reg['C'];
        medicamento.nombre = reg['D'];
        medicamento.codigoATC = reg['G']; 
        medicamento = { ...medicamento, ...auditoria };

        // Crear medicamento
        await this.medicamentoService.createOneToOne(notificacionMed, medicamento);

        /**
         * La hoja "Medicamentos", para el código ATC no tiene filtro de J07, y a primera vista, 
         * parecería no ser necesario volver a aplicar otro filtro, porque, el ATC J07 está 
         * filtrado en el libro AEFI (cantidad de registros comparable con el mensaje de la página VigiFlow).
         * Sin embargo, se debe tener en cuenta que un mismo código Vigiflow puede tener varios ATC asociados,
         * incluyendo el J07. Por lo tanto, es necesario validar que el código ATC de la fila actual
         * corresponda a una vacuna (J07) antes de proceder a crear o actualizar el datoVacuna.
         */
        const validacionCdgAtcVacunas = reg['G'] && this.validarCodigoAtcVacuna(reg['G'].toString());
        for(const notificacion of notificacionList){
          // Buscar datoVacuna existente y actualizarlo
          const datoVacunaList = await this.datoVacunaService.findByNotifIdDtoMinimo(notificacion.id);
          //const datoVacunaExistente = datoVacunaList && datoVacunaList.length > 0 ? datoVacunaList[0] : null;
          if (validacionCdgAtcVacunas) {
            let updateDatoVacuna = new UpdateDatoVacunaDto();
            updateDatoVacuna.nombreVacuna = reg['D'];
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
            updateDatoVacuna.paisAutorizacion = reg['J'];
            updateDatoVacuna.numeroLote = reg['AE'] && this.transformarLoteVacuna(reg['AE']);
            updateDatoVacuna.indicacionMeddra = reg['Q']; // TODO: REVISAR si ya está transformado a Meddra LLT. Si está vacío debe ser NULL.
            updateDatoVacuna.nombreVacPatenteWHODrug = reg['E'] && reg['E'] ? this.limpiarNombrePatenteWHODrug(reg['E']) : reg['E'];
            updateDatoVacuna.acIngredientTranslationJson = reg['F'] && this.parseIngredients(reg['F']);//Se asigna esta columna porque la mayoría ya viene con la traducción al español.
            updateDatoVacuna.codigoAtc = reg['G'];
            updateDatoVacuna.rolVacuna = reg['C'];

            const drugName = updateDatoVacuna.nombreVacPatenteWHODrug;
            const whodrug: any[] = (await this.drugService.getDrugsOnly(drugName, country)).length > 0? await this.drugService.getDrugsOnly(drugName, country) : [];
            // escribir en txt los logs, del número elementos del vector resultante de la búsqueda con "nombreVacPatenteWHODrug"
            //fsappend.appendFileSync('C:/logsNumElementosDrugName.txt', `${whodrug.length}|${drugName}|${JSON.stringify(whodrug)}\n`);
            if (whodrug.length > 0) {
              updateDatoVacuna.drugCode = whodrug[0]?.drugCode;
              
              const mah = await this.maholderService.getMaholderOfDrug(whodrug[0]?.id, country);
              updateDatoVacuna.mahholdersJson = mah.map((item) => ({
                name: item.name,
                medicinalProductID: item.medicinalProductID,
              }));
              const ingredentActive = await this.activeIngredentService.getActiveIngredentsOfDrug(whodrug[0]?.id);
              //console.log('ingredentActive IDs:::', ingredentActive.map(item => ({ id: item.id, ingredient: item.ingredient })));
              updateDatoVacuna.activeIngredientJson = ingredentActive.map((item) => ({
                ingredient: item.ingredient, //La propiedad "ingredient" solo es etiqueta y se converirá en la clave dentro del objeto JSON.
              }));
              if ( (ingredentActive.length > 0) && !(updateDatoVacuna.acIngredientTranslationJson)) {
                              
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
              //------------console.log(`No se encontró el nombre de la vacuna en WHODrug: ${drugName} y país: ${country}. Buscando en catálogo CSV...`);
              /*const drugNameFromCsv = buscarWHODrugNameEnCatalogoCsv(drugName);
              if( drugNameFromCsv ){
                updateDatoVacuna.nombreVacPatenteWHODrug = drugNameFromCsv; //El alcance sería hasta aquí, porque no se tiene el ID para buscar los demás datos relacionados.
                //updateDatoVacuna.drugCode = drugCodeFromCsv;
              } else {
              updateDatoVacuna.drugCode = null;
              updateDatoVacuna.mahholdersJson = [];
              updateDatoVacuna.activeIngredientJson = [];
              }*/
            }
            if(datoVacunaList.length > 0){
              //actualizar el datoVacuna 'm í n i m o' existente, asociado a la notificación. Mínimo, porque no todas las columnas se encuentran en esta hoja Excel.
              //y fue creado inicialmente con los datos de la hoja AEFI. La cantidad de registros únicos será igual a la cantidad de notificaciones asociadas al paciente.

              await this.datoVacunaService.update(datoVacunaList[0].id, updateDatoVacuna);
            } else {
              //crear un registro completamente nuevo de DatoVacuna asociado a la notificación, utilizando el método create del servicio datoVacunaService.
              await this.datoVacunaService.create(notificacion, updateDatoVacuna); //Existe otra forma, utilizando la actualización propia que tiene este método create.
              
            }
            break; // Salir del bucle una vez que se ha actualizado el datoVacuna
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
  parseIngredients(rawText: string): { ingredient: string }[] {
    return rawText
      .split(/\r?\n/) // divide por \n o \r\n 
      .map(line => line.trim()) // limpia espacios y posibles \r 
      .filter(line => line !== '') // descarta líneas vacías 
      .map(line => ({ ingredient: line })); // construye el objeto
  }
  
  validarCodigoAtcVacuna(cadena: string): boolean {
    // Verifica que la cadena empiece con "J07"
    const empiezaConPrefijo = cadena.startsWith('J07');
  
    // Verifica que la longitud sea como máximo 7 caracteres
    const longitudValida = cadena.length <= 7;
  
    // Retorna true solo si ambas condiciones se cumplen
    return empiezaConPrefijo && longitudValida;
  }

  /**
 * Limpia una cadena de texto según las reglas:
 * - Elimina espacios al inicio y al final
 * - Reemplaza comas por punto y coma
 * - Reemplaza saltos de línea internos por punto y coma
 * - Elimina saltos de línea al final de la cadena
 * - Elimina espacios antes y después del punto y coma
 */
private limpiarNombrePatenteWHODrug(input: string): string {
  if (!input) return '';

  return input
    .trim() // elimina espacios al inicio y al final
    // reemplaza saltos de línea internos por ;
    .replace(/[\r\n]+(?!$)/g, ';')
    // elimina saltos de línea al final (si los hay)
    .replace(/[\r\n]+$/g, '')
    // reemplaza comas por punto y coma
    .replace(/,/g, ';')
    // elimina espacios alrededor de ;
    .replace(/\s*;\s*/g, ';');
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