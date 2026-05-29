import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ProgramTrackedEntityAttribute } from '../dto/programTrackedEntityAttribute.interface';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Attribute } from '../dto/attribute.interface';

@Injectable()
export class Dhis2ProgramService {
  private readonly logger = new Logger(Dhis2ProgramService.name);
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

  async getProgramTrackedEntityAttribute(
    idProgram: string,
  ): Promise<ProgramTrackedEntityAttribute[]> {
    const baseUrl = this.configService.get<string>('DHIS2_URL');
    const uri = baseUrl.concat(
      `/api/programs/${idProgram}.json?fields=programTrackedEntityAttributes[id,name,displayName,sortOrder,trackedEntityAttribute]`,
    );
    const { data } = await firstValueFrom(
      this.httpService.get(uri, this.getConfig()).pipe(
        catchError((e: AxiosError) => {
          this.logger.error(e);
          throw new HttpException(e.response.data, e.response.status);
        }),
      ),
    );
    return data.programTrackedEntityAttributes;
  }

  async getTrackedEntityInstances(
    tei: string,
    programId: string,
  ): Promise<Attribute[]> {
    const baseUrl = this.configService.get<string>('DHIS2_URL');
    const uri = baseUrl.concat(
      `/api/trackedEntityInstances/${tei}.json?program=${programId}&fields=attributes`,
    );
    const { data } = await firstValueFrom(
      this.httpService.get(uri, this.getConfig()).pipe(
        catchError((e: AxiosError) => {
          this.logger.error(e);
          throw new HttpException(e.response.data, e.response.status);
        }),
      ),
    );
    return data.attributes;
  }
}
