import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ProgramStage } from '../dto/interfaceprogramStages';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Dhis2DataElementService } from './dhis2-data-element.service';
import { DataElement } from '../dto/dataElemen.interface';

@Injectable()
export class Dhis2ProgramStageService {
  private readonly logger = new Logger(Dhis2ProgramStageService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly dhis2DataElementService: Dhis2DataElementService,
  ) {}

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

  async getEstructuraPrograma(idPrograma: string): Promise<ProgramStage[]> {
    const base = this.configService.get<string>('DHIS2_URL');
    console.log('Base URL: ' + base);
    
    const uri = `/api/programStages.json?fields=*&paging=false&filter=program.id:eq:${idPrograma}`;
    const url = base.concat(uri);

    const { data } = await firstValueFrom(
      this.httpService.get(url, this.getConfig()).pipe(
        catchError((e: AxiosError) => {
          this.logger.error('Error con codigo::: ', e);
          this.logger.error('Error con codigo::: ', e.message);
          throw new HttpException(e.response.data, e.response.status);
        }),
      ),
    );

    const progamsStages = data.programStages.sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    const dataElemens = progamsStages
      .map((programStage) =>
        programStage.programStageDataElements.map(
          (programStageDataElement) => programStageDataElement.dataElement.id,
        ),
      )
      .flat();

    const dataElements = await this.dhis2DataElementService.getDataElements(
      dataElemens,
    );
    progamsStages.forEach((programStage) => {
      programStage.programStageDataElements.forEach(
        (programStageDataElement) => {
          const dataElement = dataElements.find(
            (dataElement: DataElement) =>
              dataElement.id === programStageDataElement.dataElement.id,
          );
          programStageDataElement.dataElement.name = dataElement?.name || '';
        },
      );
    });

    return progamsStages;
  }
}
