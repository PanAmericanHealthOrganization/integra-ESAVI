import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Option, OptionSet } from '../dto';

@Injectable()
export class Dhis2OptionsService {
  private readonly logger = new Logger(Dhis2OptionsService.name);
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

  async getOptions(codes: string[]): Promise<Option[]> {
    const baseUrl = this.configService.get<string>('DHIS2_URL');
    /*const uri = baseUrl.concat(
      `/api/options.json?filter=code:in:[${codes.join(
        ',',
      )}]&fields=code,id,displayName&paging=false`,
    );*/
  //const quotedCodes = codes.map(code => `"${code}"`).join(';');
  //const quotedCodes = codes.map(code => `"${code.replace(/"/g, '\\"')}"`).join(',');
  const validOptionCodes = codes.filter(code => /^[A-Z]{3}\d{3}$/.test(code));
  const quotedCodes = validOptionCodes.map(code => `${code.replace(/"/g, '')}`).join(',');
  const uri = `${baseUrl}/api/options.json?filter=code:in:[${quotedCodes}]&fields=code,id,displayName&paging=false`;

    console.log('AQUI ERROR URL: ' + uri);
    
    const { data } = await firstValueFrom(
      this.httpService.get(uri, this.getConfig()).pipe(
        catchError((e: AxiosError) => {
          this.logger.error(e);
          throw new HttpException(e.response.data, e.response.status);
        }),
      ),
    );
    return data.options;
  }

  /**
   * Obtiene los option sets con sus opciones (código y nombre) para traducir
   * los códigos que entrega el API de eventos/tracker al nombre que entrega analytics.
   */
  async getOptionSets(ids: string[]): Promise<OptionSet[]> {
    if (ids.length === 0) {
      return [];
    }
    const baseUrl = this.configService.get<string>('DHIS2_URL');
    const uri = `${baseUrl}/api/optionSets.json?filter=id:in:[${ids.join(
      ',',
    )}]&fields=id,options[code,name]&paging=false`;

    const { data } = await firstValueFrom(
      this.httpService.get(uri, this.getConfig()).pipe(
        catchError((e: AxiosError) => {
          this.logger.error(e);
          throw new HttpException(e.response.data, e.response.status);
        }),
      ),
    );
    return data.optionSets;
  }
}
