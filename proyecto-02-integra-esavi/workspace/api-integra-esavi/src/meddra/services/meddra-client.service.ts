import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

import { ConfigService } from '@nestjs/config';
import { ParametroService } from '../../integrator/service/parametro.service';
import { MeddraHistoryService } from './meddra-history.service';
import { IMeddraJWTResponse, IMeddraQueryRequest, IMeddraResponse } from '../models/dto';
import { MeddraQuery } from '../models/meddraquerys.entity';

@Injectable()
export class MeddraClientService {
  constructor(
    private readonly configService: ConfigService,
    private readonly meddraHistoryService: MeddraHistoryService,
    private readonly httpService: HttpService,
    private readonly parametroService: ParametroService,
  ) {}

  private readonly logger = new Logger(MeddraClientService.name);

  public async getQuery(query: IMeddraQueryRequest): Promise<IMeddraResponse> {
    try {
      const myResponse = await this.getHistory(query.searchterms[0].searchterm);
      if (myResponse) {
        this.logger.log('Respuesta desde base de datos');
        return JSON.parse(myResponse.response) as IMeddraResponse;
      }
      // get token
      const token = await this.getToken();
      // get response
      this.logger.log('Respuesta desde servicio de meddra');
      return await this.doRequest(query, token.access_token);
    } catch (e) {
      throw e;
    }
  }

  public async getHistory(searchTerm: string): Promise<MeddraQuery> {
    return await this.meddraHistoryService.getFromHistory(searchTerm);
  }

  private async getToken(): Promise<IMeddraJWTResponse> {
    // add headers
    const requestConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    // add query params
    const [grantType, clientId, username, scope, password, urlToken] = await Promise.all([
      this.parametroService.getValor('MEDDRA', 'MED_GRANT_TYPE'),
      this.parametroService.getValor('MEDDRA', 'MED_CLIENT_ID'),
      this.parametroService.getValor('MEDDRA', 'MED_USER_NAME'),
      this.parametroService.getValor('MEDDRA', 'MED_SCOPE'),
      this.parametroService.getValor('MEDDRA', 'MED_PASSWORD'),
      this.parametroService.getValor('MEDDRA', 'MED_URL_TOKEN'),
    ]);
    const data = new URLSearchParams({
      grant_type: grantType,
      client_id: clientId,
      username: username,
      scope: scope,
      password: password,
    });

    // request
    const request = this.httpService.post<IMeddraJWTResponse>(urlToken, data, requestConfig);

    try {
      const { data } = await lastValueFrom(request);
      return data;
    } catch (e) {
      this.logger.error(e);
      if (e.response.status === 400) throw new UnauthorizedException('No autorizado');
      else throw new Error(e);
    }
  }

  private async doRequest(query: IMeddraQueryRequest, token: string): Promise<IMeddraResponse> {
    // add headers
    const headers = { Authorization: `Bearer ${token}` };
    // build request
    const urlApi = await this.parametroService.getValor('MEDDRA', 'MED_URL_API');
    const request = this.httpService.post<IMeddraResponse>(`${urlApi}/`, query, {
      headers,
    });

    try {
      const { data } = await lastValueFrom(request);
      // save query
      this.meddraHistoryService
        .save(query, data)
        .then((res) => {
          this.logger.log(res);
        })
        .catch((err) => {
          this.logger.error(err);
        });
      // return data
      return data;
    } catch (e) {
      this.logger.error(e);
      if (e.response.status === 400) throw new UnauthorizedException('No autorizado');
      else throw new Error(e);
    }
  }
}
