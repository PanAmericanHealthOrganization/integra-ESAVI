import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { DataElement } from '../dto';

@Injectable()
export class Dhis2DataElementService {
  private readonly logger = new Logger(Dhis2DataElementService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private getConfig() {
    const token = this.configService.get<string>('DHIS2_API_TOKEN');
    return {
      maxBodyLength: Infinity,
      headers: {
        Authorization: `ApiToken ${token}`,
      },
    };
  }
  async getDataElements(idsDataElemet: string[]): Promise<DataElement[]> {
    const baseUrl = this.configService.get<string>('DHIS2_URL');
    const idsCadena = idsDataElemet.join(',');
    const uri = baseUrl.concat(
      `/api/dataElements.json?fields=id,code,name,shortName,displayFormName&paging=false&filter=id:in:[${idsCadena}]`,
    );
    const { data } = await firstValueFrom(
      this.httpService.get(uri, this.getConfig()).pipe(
        catchError((e: AxiosError) => {
          this.logger.error(e);
          throw new HttpException(e.response.data, e.response.status);
        }),
      ),
    );
    return data.dataElements;
  }
}
