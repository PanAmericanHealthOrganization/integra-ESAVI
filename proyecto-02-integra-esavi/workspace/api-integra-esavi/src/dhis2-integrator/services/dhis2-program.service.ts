import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ProgramTrackedEntityAttribute, Attribute, TrackedEntityAttributeMetadata } from '../dto';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Dhis2ExtraccionUtils } from '../utils/dhis2-extraccion.utils';

@Injectable()
export class Dhis2ProgramService {
  private readonly logger = new Logger(Dhis2ProgramService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}


  async getProgramTrackedEntityAttribute(
    idProgram: string,
  ): Promise<ProgramTrackedEntityAttribute[]> {
    const baseUrl = this.configService.get<string>('DHIS2_URL');
    const uri = baseUrl.concat(
      `/api/programs/${idProgram}.json?fields=programTrackedEntityAttributes[id,name,displayName,sortOrder,trackedEntityAttribute]`,
    );
    const { data } = await firstValueFrom(
      this.httpService.get(uri, Dhis2ExtraccionUtils.getConfig(this.configService)).pipe(
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
      this.httpService.get(uri, Dhis2ExtraccionUtils.getConfig(this.configService)).pipe(
        catchError((e: AxiosError) => {
          this.logger.error(e);
          throw new HttpException(e.response.data, e.response.status);
        }),
      ),
    );
    return data.attributes;
  }

  /**
   * Obtiene los metadatos (nombre, tipo de valor y option set) de los atributos
   * de la entidad de seguimiento, para nombrar columnas y normalizar valores
   * igual que lo hace el API de analytics.
   */
  async getTrackedEntityAttributesMetadata(ids: string[]): Promise<TrackedEntityAttributeMetadata[]> {
    if (ids.length === 0) {
      return [];
    }
    const baseUrl = this.configService.get<string>('DHIS2_URL');
    const uri = baseUrl.concat(
      `/api/trackedEntityAttributes.json?filter=id:in:[${ids.join(
        ',',
      )}]&fields=id,name,valueType,optionSet[id]&paging=false`,
    );
    const { data } = await firstValueFrom(
      this.httpService.get(uri, Dhis2ExtraccionUtils.getConfig(this.configService)).pipe(
        catchError((e: AxiosError) => {
          this.logger.error(e);
          throw new HttpException(e.response.data, e.response.status);
        }),
      ),
    );
    return data.trackedEntityAttributes;
  }
}
