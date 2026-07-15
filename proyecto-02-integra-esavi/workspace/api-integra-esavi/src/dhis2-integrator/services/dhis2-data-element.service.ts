import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ParametroService } from '../../integrator/service/parametro.service';
import { DataElement } from '../dto';
import { Dhis2ExtraccionUtils } from '../utils/dhis2-extraccion.utils';

@Injectable()
export class Dhis2DataElementService {
  private readonly logger = new Logger(Dhis2DataElementService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly parametroService: ParametroService,
  ) {}

  async getDataElements(idsDataElemet: string[]): Promise<DataElement[]> {
    const baseUrl = await Dhis2ExtraccionUtils.getBaseUrl(this.parametroService);
    const idsCadena = idsDataElemet.join(',');
    const uri = baseUrl.concat(
      `/api/dataElements.json?fields=id,code,name,shortName,displayFormName,valueType,optionSet[id]&paging=false&filter=id:in:[${idsCadena}]`,
    );
    const { data } = await firstValueFrom(
      this.httpService.get(uri, await Dhis2ExtraccionUtils.getConfig(this.parametroService)).pipe(
        catchError((e: AxiosError) => {
          this.logger.error(e);
          throw new HttpException(e.response.data, e.response.status);
        }),
      ),
    );
    return data.dataElements;
  }
}
