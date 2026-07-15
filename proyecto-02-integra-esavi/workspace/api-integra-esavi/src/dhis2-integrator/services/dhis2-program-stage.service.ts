import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ProgramStage, DataElement } from '../dto';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ParametroService } from '../../integrator/service/parametro.service';
import { Dhis2DataElementService } from './dhis2-data-element.service';
import { Dhis2ExtraccionUtils } from '../utils/dhis2-extraccion.utils';

@Injectable()
export class Dhis2ProgramStageService {
  private readonly logger = new Logger(Dhis2ProgramStageService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly dhis2DataElementService: Dhis2DataElementService,
    private readonly parametroService: ParametroService,
  ) {}


  async getEstructuraPrograma(idPrograma: string): Promise<ProgramStage[]> {
    const base = await Dhis2ExtraccionUtils.getBaseUrl(this.parametroService);

    const uri = `/api/programStages.json?fields=*&paging=false&filter=program.id:eq:${idPrograma}`;
    const url = base.concat(uri);

    const { data } = await firstValueFrom(
      this.httpService.get(url, await Dhis2ExtraccionUtils.getConfig(this.parametroService)).pipe(
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
