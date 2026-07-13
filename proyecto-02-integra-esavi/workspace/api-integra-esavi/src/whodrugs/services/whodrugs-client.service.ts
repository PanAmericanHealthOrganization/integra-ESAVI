import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ParametroService } from '../../integrator/service/parametro.service';
import { IDrug } from '../models/dtos';
//import { readFile } from 'fs/promises';
/**
 * @description Clase que sentraliza los servicios de la API de whodrugs
 */
@Injectable()
export class WhoDrugsClientService {
  //
  private readonly logger = new Logger(WhoDrugsClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly parametroService: ParametroService,
  ) {}

  /**
   * Obtiene todos los datos desde la API de whodrugs
   * @returns
   */
  public async getDrugs(level: number, ingredientTraslations: string, includeAtc: boolean): Promise<IDrug[]> {
    try {
      const [baseURL, umcLicenseKey, umcClientKey] = await Promise.all([
        this.parametroService.getValor('WHODRUG', 'WHD_API_URL'),
        this.parametroService.getValor('WHODRUG', 'WHD_UMC_LICENSE_KEY'),
        this.parametroService.getValor('WHODRUG', 'WHD_UMC_CLIENT_KEY'),
      ]);

      const { data } = await firstValueFrom(
        this.httpService.get(
          `/whodrug/download/v2/regional-drugs?MedProdLevel=${level}&IngredientTranslations=${ingredientTraslations}&IncludeAtc=${includeAtc}`,
          {
            baseURL,
            headers: {
              'umc-license-key': umcLicenseKey,
              'umc-client-key': umcClientKey,
            },
          },
        ),
      );
      return data;
    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      this.logger.log('Descarga de archivo completada');
    }
  }
}
