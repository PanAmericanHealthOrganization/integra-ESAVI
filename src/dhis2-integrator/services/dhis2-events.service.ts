import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Dhis2ProgramService } from './dhis2-program.service';
import { Dhis2OptionsService } from './dhis2-options.service';
import { Event } from '../dto/events.interface';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export type ParamsEsavi = {
  program: string;
  paging: {
    paging: boolean;
    page: number;
    pageSize: number;
    isLastPage?: boolean;
  };
};

export const getDHIS2EventsURL = (params: ParamsEsavi): string => {
  const { paging } = params;
  const DHIS2_PAGING = `&paging=${paging.paging}&page=${paging.page}&pageSize=${paging.pageSize}`;
  const DHIS2_EVENTS_FIELDS =
    '&fields=orgUnit,program,event,trackedEntityInstance,status,orgUnitName,eventDate,lastUpdated,dataValues[dataElement,value]';
  const DHIS2_EVENTS_FILTER_PROGRAM = `&program=${params.program}`;
  return `/api/events.json?${DHIS2_EVENTS_FILTER_PROGRAM}&${DHIS2_PAGING}&status=COMPLETED${DHIS2_EVENTS_FIELDS}`;
};

@Injectable()
export class Dhis2EventsService {
  private readonly logger = new Logger(Dhis2EventsService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly dhis2ProgramService: Dhis2ProgramService,
    private readonly dhis2OptionsService: Dhis2OptionsService,
  ) { }

  async getEventos(program: string): Promise<any> {
    // TODO: convertir en parameto
    const pageSize = 100;
    const params: ParamsEsavi = {
      program: program ?? 'NrEU7cRCZd7',
      paging: {
        paging: true,
        page: 1,
        pageSize: pageSize,
        isLastPage: false,
      },
    };
    //
    return await this.getEventPage(params);
  }

  private getConfig() {
    const username = this.configService.get<string>('DHIS2_USERNAME');
    const passwd = this.configService.get<string>('DHIS2_PASSWD');
    return {
      maxBodyLength: Infinity,
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${username}:${passwd}`,
          'utf8',
        ).toString('base64')}`,
      },
    };
  }

  async getEventPage(params: ParamsEsavi): Promise<Event[]> {
    let fullEvents: any[] = [];

    const baseUrl = this.configService.get<string>('DHIS2_URL');
    const uri = baseUrl.concat(getDHIS2EventsURL(params));

    console.log('uri:::: ', uri);
    console.log('params:::: ', params);

    do {
      const { data } = await firstValueFrom(
        this.httpService.get(uri, this.getConfig()).pipe(
          catchError((e: AxiosError) => {
            this.logger.error(e);
            throw new HttpException(e.response.data, e.response.status);
          }),
        ),
      );

      const events = data.events;
      const pager = data.pager;
      await this.procesarEventosCatalogos(events);


      fullEvents = fullEvents.concat(events);

      // STEP
      params.paging.page = pager.page + 1;
      params.paging.isLastPage = pager.isLastPage;
    } while (!params.paging.isLastPage);

    return fullEvents;
  }

  async procesarEventosCatalogos(events: Event[]) {
    //events.forEach(async event => {

    for (const event of events) {
      const teis = await this.dhis2ProgramService.getTrackedEntityInstances(
        event.trackedEntityInstance,
        event.program,
      );



      teis.forEach((tei) => {
        event.dataValues.push({
          dataElement: tei.attribute,
          value: tei.value,
        });
      });
    }

    //

    console.log('llega aca 1.....');
    const values = events
      .map((event) => event.dataValues.map((dataValue) => dataValue.value))
      .flat();
    console.log('llega aca 2:::: ', values);

    const options = await this.dhis2OptionsService.getOptions(values);

    console.log('llega aca 3.....');

    for (const event of events) {
      event.dataValues.forEach((dataValue) => {
        const option = options.find(
          (option) => option.code === dataValue.value,
        );
        if (option) {
          dataValue.value = option?.displayName ?? dataValue.value;
        }
      });
    }
  }
}
