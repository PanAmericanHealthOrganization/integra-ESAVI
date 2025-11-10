import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Option } from '../dto/options.interface';

@Injectable()
export class Dhis2OptionsService {
  private readonly logger = new Logger(Dhis2OptionsService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
}
