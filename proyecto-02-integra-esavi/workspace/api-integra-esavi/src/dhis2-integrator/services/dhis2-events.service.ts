import {HttpService} from '@nestjs/axios';
import {HttpException,Injectable,Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {AxiosError} from 'axios';
import {catchError,firstValueFrom} from 'rxjs';
import {ParametroService} from '../../integrator/service/parametro.service';
import {
  DataElement,
  Enrollment,
  IData,
  IHeader,
  OrganisationUnit,
  TrackedEntityAttributeMetadata,
  TrackedEntityInstance,
  TrackerApiTrackedEntity,
} from '../dto';
import {Dhis2ExtraccionUtils} from '../utils/dhis2-extraccion.utils';
import {Dhis2DataElementService} from './dhis2-data-element.service';
import {Dhis2OptionsService} from './dhis2-options.service';
import {Dhis2ProgramService} from './dhis2-program.service';

// Columnas que analytics entrega fuera de atributos/data elements y que consume el integrador.
const COLUMNA_ORG_UNIT_NAME = 'Organisation unit name';
const COLUMNA_ORG_UNIT_CODE = 'Organisation unit code';
const COLUMNA_ORG_UNIT = 'Organisation unit';
const COLUMNA_ENROLLMENT_DATE = 'Enrollment date';
const COLUMNA_INCIDENT_DATE = 'Incident date';
// Fecha del primer evento (etapa "Notificación"), que es como DHIS2 tracker capture
// etiqueta genéricamente el campo "Fecha de reporte" del evento.
const COLUMNA_REPORT_DATE = 'Fecha de reporte';

const TAMANIO_PAGINA_TEI = 50;
const TAMANIO_LOTE_METADATOS = 100;

/**
 * Extrae los datos crudos del formulario (tracker) vía el API de eventos de DHIS2
 * y los expone con la misma estructura headers/rows del API de analytics,
 * de modo que el resto del pipeline de importación no requiera cambios.
 */
@Injectable()
export class Dhis2EventsService {
  private readonly logger = new Logger(Dhis2EventsService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly dhis2DataElementService: Dhis2DataElementService,
    private readonly dhis2OptionsService: Dhis2OptionsService,
    private readonly dhis2ProgramService: Dhis2ProgramService,
    private readonly parametroService: ParametroService,
  ) {}


  /**
   * Punto de entrada de la extracción: lee los datos crudos del formulario
   * en tiempo real (sin depender de la regeneración de las tablas de analytics).
   */
  async getEventsReports(idPrograma: string, fechaInicio?: Date, fechaFin?: Date): Promise<IData> {
    const currentYear = new Date().getFullYear();
    const inicio = fechaInicio ?? new Date(Date.UTC(currentYear - 5, 0, 1));
    const fin = fechaFin ?? new Date(Date.UTC(currentYear, 11, 31));

    const teis = await this.getTrackedEntityInstances(idPrograma, inicio, fin);
    this.logger.log(`Tracker: ${teis.length} instancias obtenidas para el programa ${idPrograma}`);

    const enrollments = this.filtrarEnrollments(teis, idPrograma, inicio, fin);

    // Metadatos en lote para nombrar columnas y normalizar valores como analytics
    const dataElements = await this.getDataElementsDeEnrollments(enrollments);
    const atributos = await this.getAtributosDeTeis(teis);
    const orgUnits = await this.getOrganisationUnits(
      Dhis2ExtraccionUtils.idsUnicos(enrollments, (e) => e.orgUnit),
    );
    const mapaOptionSets = await this.getMapaOptionSets(dataElements, atributos);

    return this.construirReporte(teis, enrollments, dataElements, atributos, orgUnits, mapaOptionSets);
  }

  /**
   * Descarga paginada de las instancias del programa con sus atributos,
   * enrollments y eventos (todos los program stages) en una sola consulta.
   * Usa el nuevo tracker API (/api/tracker/trackedEntities), obligatorio
   * desde DHIS2 2.41 (los endpoints legacy fueron eliminados).
   */
  private async getTrackedEntityInstances(
    idPrograma: string,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<TrackedEntityInstance[]> {
    const baseUrl = this.configService.get<string>('DHIS2_URL');
    const rootOrgUnit = this.configService.get<string>('DHIS2_ROOT_ORG_UNIT', 'CcPKoI4rpPZ');
    const fields =
      'trackedEntity,attributes[attribute,displayName,value],' +
      'enrollments[enrollment,program,status,orgUnit,enrolledAt,occurredAt,' +
      'events[event,programStage,status,occurredAt,dataValues[dataElement,value]]]';

    const teis: TrackedEntityInstance[] = [];
    let page = 1;
    let hasMoreData = true;

    while (hasMoreData) {
      const uri =
        // orgUnit/ouMode: nombres vigentes en 2.36-2.40 y aceptados (deprecados) en 2.41
        `${baseUrl}/api/tracker/trackedEntities.json?orgUnit=${rootOrgUnit}&ouMode=DESCENDANTS` +
        `&program=${idPrograma}` +
        `&enrollmentEnrolledAfter=${fechaInicio.toISOString().slice(0, 10)}` +
        `&enrollmentEnrolledBefore=${fechaFin.toISOString().slice(0, 10)}` +
        `&fields=${fields}` +
        `&totalPages=false&page=${page}&pageSize=${TAMANIO_PAGINA_TEI}`;

      const { data } = await firstValueFrom(
        this.httpService.get(uri, await Dhis2ExtraccionUtils.getConfig(this.parametroService, this.configService)).pipe(
          catchError((e: AxiosError) => {
            this.logger.error('Error consultando tracker/trackedEntities:', e);
            throw new HttpException(e.response?.data || e.message, e.response?.status || 500);
          }),
        ),
      );

      // 2.41+ responde con "trackedEntities"; versiones 2.36-2.40 con "instances"
      const pagina: TrackerApiTrackedEntity[] = data?.trackedEntities ?? data?.instances ?? [];
      teis.push(...pagina.map((tei) => this.mapearTrackedEntity(tei)));
      hasMoreData = pagina.length === TAMANIO_PAGINA_TEI;
      page++;
    }

    return teis;
  }

  /**
   * Mapea la respuesta cruda del nuevo tracker API al modelo normalizado
   * (enrolledAt -> enrollmentDate, occurredAt -> incidentDate/eventDate).
   */
  private mapearTrackedEntity(raw: TrackerApiTrackedEntity): TrackedEntityInstance {
    return {
      trackedEntityInstance: raw.trackedEntity,
      attributes: raw.attributes ?? [],
      enrollments: (raw.enrollments ?? []).map((enrollment) => ({
        enrollment: enrollment.enrollment,
        program: enrollment.program,
        status: enrollment.status,
        orgUnit: enrollment.orgUnit,
        enrollmentDate: enrollment.enrolledAt,
        incidentDate: enrollment.occurredAt,
        events: (enrollment.events ?? []).map((evento) => ({
          event: evento.event,
          programStage: evento.programStage,
          status: evento.status,
          eventDate: evento.occurredAt,
          dataValues: evento.dataValues ?? [],
        })),
      })),
    };
  }

  /**
   * Cada enrollment del programa dentro del rango equivale a una fila del
   * reporte de analytics (outputType=ENROLLMENT).
   */
  private filtrarEnrollments(
    teis: TrackedEntityInstance[],
    idPrograma: string,
    fechaInicio: Date,
    fechaFin: Date,
  ): Enrollment[] {
    return teis
      .flatMap((tei) => tei.enrollments ?? [])
      .filter((enrollment) => {
        if (enrollment.program !== idPrograma) return false;
        const fecha = new Date(enrollment.enrollmentDate);
        return !isNaN(fecha.getTime()) && fecha >= fechaInicio && fecha <= fechaFin;
      });
  }

  private async getDataElementsDeEnrollments(enrollments: Enrollment[]): Promise<DataElement[]> {
    const idsDataElements = Dhis2ExtraccionUtils.idsUnicos(
      enrollments.flatMap((e) => e.events ?? []).flatMap((evento) => evento.dataValues ?? []),
      (dataValue) => dataValue.dataElement,
    );

    const dataElements: DataElement[] = [];
    for (const lote of Dhis2ExtraccionUtils.dividirEnLotes(idsDataElements, TAMANIO_LOTE_METADATOS)) {
      dataElements.push(...(await this.dhis2DataElementService.getDataElements(lote)));
    }
    return dataElements;
  }

  private async getAtributosDeTeis(
    teis: TrackedEntityInstance[],
  ): Promise<TrackedEntityAttributeMetadata[]> {
    const idsAtributos = Dhis2ExtraccionUtils.idsUnicos(
      teis.flatMap((tei) => tei.attributes ?? []),
      (attribute) => attribute.attribute,
    );

    const atributos: TrackedEntityAttributeMetadata[] = [];
    for (const lote of Dhis2ExtraccionUtils.dividirEnLotes(idsAtributos, TAMANIO_LOTE_METADATOS)) {
      atributos.push(...(await this.dhis2ProgramService.getTrackedEntityAttributesMetadata(lote)));
    }
    return atributos;
  }

  private async getOrganisationUnits(ids: string[]): Promise<OrganisationUnit[]> {
    const baseUrl = this.configService.get<string>('DHIS2_URL');
    const orgUnits: OrganisationUnit[] = [];

    for (const lote of Dhis2ExtraccionUtils.dividirEnLotes(ids, TAMANIO_LOTE_METADATOS)) {
      const uri =
        `${baseUrl}/api/organisationUnits.json?filter=id:in:[${lote.join(',')}]` +
        `&fields=id,name,code&paging=false`;
      const { data } = await firstValueFrom(
        this.httpService.get(uri, await Dhis2ExtraccionUtils.getConfig(this.parametroService, this.configService)).pipe(
          catchError((e: AxiosError) => {
            this.logger.error('Error consultando organisationUnits:', e);
            throw new HttpException(e.response?.data || e.message, e.response?.status || 500);
          }),
        ),
      );
      orgUnits.push(...(data?.organisationUnits ?? []));
    }
    return orgUnits;
  }

  /**
   * Construye un mapa optionSetId -> (código -> nombre) para traducir los códigos
   * que entrega el tracker al nombre de la opción, como lo hace analytics
   * con outputIdScheme=NAME.
   */
  private async getMapaOptionSets(
    dataElements: DataElement[],
    atributos: TrackedEntityAttributeMetadata[],
  ): Promise<Map<string, Map<string, string>>> {
    const idsOptionSets = Dhis2ExtraccionUtils.idsUnicos(
      [...dataElements, ...atributos],
      (item) => item.optionSet?.id,
    );

    const mapa = new Map<string, Map<string, string>>();
    for (const lote of Dhis2ExtraccionUtils.dividirEnLotes(idsOptionSets, TAMANIO_LOTE_METADATOS)) {
      const optionSets = await this.dhis2OptionsService.getOptionSets(lote);
      for (const optionSet of optionSets) {
        mapa.set(
          optionSet.id,
          new Map((optionSet.options ?? []).map((option) => [option.code, option.name])),
        );
      }
    }
    return mapa;
  }

  private construirReporte(
    teis: TrackedEntityInstance[],
    enrollments: Enrollment[],
    dataElements: DataElement[],
    atributos: TrackedEntityAttributeMetadata[],
    orgUnits: OrganisationUnit[],
    mapaOptionSets: Map<string, Map<string, string>>,
  ): IData {
    const mapaDataElements = new Map(dataElements.map((de) => [de.id, de]));
    const mapaAtributos = new Map(atributos.map((attr) => [attr.id, attr]));
    const mapaOrgUnits = new Map(orgUnits.map((ou) => [ou.id, ou]));
    const mapaTeiPorEnrollment = new Map<string, TrackedEntityInstance>();
    for (const tei of teis) {
      for (const enrollment of tei.enrollments ?? []) {
        mapaTeiPorEnrollment.set(enrollment.enrollment, tei);
      }
    }

    // Las columnas replican el nombre que analytics asigna a cada dimensión.
    const columnas: IHeader[] = [
      this.crearHeader('ouname', COLUMNA_ORG_UNIT_NAME, 'TEXT'),
      this.crearHeader('oucode', COLUMNA_ORG_UNIT_CODE, 'TEXT'),
      this.crearHeader('ou', COLUMNA_ORG_UNIT, 'TEXT'),
      this.crearHeader('enrollmentdate', COLUMNA_ENROLLMENT_DATE, 'DATE'),
      this.crearHeader('incidentdate', COLUMNA_INCIDENT_DATE, 'DATE'),
      this.crearHeader('reportdate', COLUMNA_REPORT_DATE, 'DATE'),
      ...atributos.map((attr) => this.crearHeader(attr.id, attr.name, attr.valueType ?? 'TEXT')),
      ...dataElements.map((de) => this.crearHeader(de.id, de.name, de.valueType ?? 'TEXT')),
    ];
    const indicePorColumna = new Map(columnas.map((header, index) => [header.column, index]));

    const rows: (string | null)[][] = enrollments.map((enrollment) => {
      const row: (string | null)[] = new Array(columnas.length).fill(null);
      const setValor = (columna: string, valor: string | null) => {
        const indice = indicePorColumna.get(columna);
        if (indice !== undefined && valor !== null && valor !== undefined && valor !== '') {
          row[indice] = valor;
        }
      };

      const orgUnit = mapaOrgUnits.get(enrollment.orgUnit);
      setValor(COLUMNA_ORG_UNIT_NAME, orgUnit?.name ?? null);
      setValor(COLUMNA_ORG_UNIT_CODE, orgUnit?.code ?? null);
      setValor(COLUMNA_ORG_UNIT, orgUnit?.name ?? enrollment.orgUnit);
      setValor(COLUMNA_ENROLLMENT_DATE, Dhis2ExtraccionUtils.normalizarFecha(enrollment.enrollmentDate));
      setValor(COLUMNA_INCIDENT_DATE, Dhis2ExtraccionUtils.normalizarFecha(enrollment.incidentDate));

      // Atributos de la persona (compartidos por todos los enrollments del TEI)
      const tei = mapaTeiPorEnrollment.get(enrollment.enrollment);
      for (const attribute of tei?.attributes ?? []) {
        const metadato = mapaAtributos.get(attribute.attribute);
        if (!metadato) continue;
        setValor(
          metadato.name,
          Dhis2ExtraccionUtils.normalizarValor(
            attribute.value,
            metadato.valueType,
            metadato.optionSet ? mapaOptionSets.get(metadato.optionSet.id) : undefined,
          ),
        );
      }

      // Data elements: si un stage tiene varios eventos, prevalece el más reciente
      const eventos = [...(enrollment.events ?? [])].sort((a, b) =>
        (a.eventDate ?? '').localeCompare(b.eventDate ?? ''),
      );

      // "Fecha de reporte": fecha del primer evento del enrollment (etapa "Notificación").
      if (eventos.length > 0) {
        setValor(COLUMNA_REPORT_DATE, Dhis2ExtraccionUtils.normalizarFecha(eventos[0].eventDate));
      }

      for (const evento of eventos) {
        for (const dataValue of evento.dataValues ?? []) {
          const metadato = mapaDataElements.get(dataValue.dataElement);
          if (!metadato) continue;
          setValor(
            metadato.name,
            Dhis2ExtraccionUtils.normalizarValor(
              dataValue.value,
              metadato.valueType,
              metadato.optionSet ? mapaOptionSets.get(metadato.optionSet.id) : undefined,
            ),
          );
        }
      }

      return row;
    });

    this.logger.log(
      `Tracker: reporte construido con ${rows.length} enrollments y ${columnas.length} columnas`,
    );
    return { headers: columnas, rows };
  }

  private crearHeader(name: string, column: string, valueType: string): IHeader {
    return {
      name,
      column,
      valueType,
      type: 'java.lang.String',
      hidden: false,
      meta: false,
    };
  }
}
