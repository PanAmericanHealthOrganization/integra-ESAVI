import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { firstValueFrom } from 'rxjs';
import { ParametroService } from '../../integrator/service/parametro.service';
import { IDrug } from '../models/dtos';
//import { readFile } from 'fs/promises';

/** Descarga del diccionario junto con la huella de lo que vino en el cuerpo. */
export interface DescargaWhoDrug {
  drugs: IDrug[];
  /** SHA-256 del cuerpo crudo; identifica la versión descargada. */
  sha256: string;
}

/**
 * @description Clase que sentraliza los servicios de la API de whodrugs
 */
@Injectable()
export class WhoDrugsClientService {
  /** Tamaño del tramo con el que se alimenta el hash antes de ceder el turno. */
  private static readonly CARACTERES_POR_TRAMO = 4 * 1024 * 1024;

  //
  private readonly logger = new Logger(WhoDrugsClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly parametroService: ParametroService,
  ) {}

  /**
   * Obtiene todos los datos desde la API de whodrugs, junto con el SHA-256 del cuerpo.
   *
   * El hash se calcula aquí, sobre el texto tal como llegó, y no en el servicio de
   * sincronización a partir del objeto ya parseado: aquello obligaba a volver a serializar
   * el diccionario entero con `JSON.stringify` sólo para hashearlo —una copia más en
   * memoria y un tramo síncrono largo con la API sin responder— para obtener exactamente
   * lo mismo.
   */
  public async getDrugs(
    level: number,
    ingredientTraslations: string,
    includeAtc: boolean,
  ): Promise<DescargaWhoDrug> {
    const ruta = `/whodrug/download/v2/regional-drugs?MedProdLevel=${level}&IngredientTranslations=${ingredientTraslations}&IncludeAtc=${includeAtc}`;
    let baseURL: string;

    try {
      let umcLicenseKey: string;
      let umcClientKey: string;
      [baseURL, umcLicenseKey, umcClientKey] = await Promise.all([
        this.parametroService.getValor('WHODRUG', 'WHD_API_URL'),
        this.parametroService.getValor('WHODRUG', 'WHD_UMC_LICENSE_KEY'),
        this.parametroService.getValor('WHODRUG', 'WHD_UMC_CLIENT_KEY'),
      ]);

      // Las credenciales viven en TC_PARAMETRO, no en el entorno: si el seed no llegó a
      // escribirlas (porque la fila ya tenía un valor propio) la petición sale con el valor
      // de relleno y UMC responde 401. Dejar constancia de con qué se sale evita tener que
      // adivinarlo desde un "Request failed with status code 401" sin contexto.
      this.logger.log(
        `Descargando de ${baseURL}${ruta} · ` +
          `umc-license-key: ${this.describirCredencial(umcLicenseKey)} · ` +
          `umc-client-key: ${this.describirCredencial(umcClientKey)}`,
      );

      const { data } = await firstValueFrom(
        this.httpService.get(ruta, {
          baseURL,
          // El cuerpo se recibe sin parsear para poder hashearlo tal cual llegó. De paso, la
          // respuesta de error también queda como texto, que es lo que `describirFallo`
          // necesita para explicar un 401 de UMC.
          transformResponse: [(cuerpo: string) => cuerpo],
          headers: {
            // La API de UMC está publicada detrás de Azure API Management, que corta la
            // petición en el borde si no trae su cabecera de suscripción: responde
            // "Access denied due to invalid subscription key" sin llegar siquiera a validar
            // la licencia. La subscription key de APIM es el hexadecimal de 32 caracteres,
            // que es lo que UMC entrega como client key.
            'Ocp-Apim-Subscription-Key': umcClientKey,
            // Las conserva el backend detrás del APIM para identificar licencia y cliente.
            'umc-license-key': umcLicenseKey,
            'umc-client-key': umcClientKey,
          },
        }),
      );
      this.logger.log('Descarga de archivo completada');
      return await this.digerir(data);
    } catch (e) {
      throw this.describirFallo(e, `${baseURL ?? '(sin WHD_API_URL)'}${ruta}`);
    }
  }

  /**
   * Calcula el SHA-256 del cuerpo y lo parsea.
   *
   * El hash se alimenta por tramos cediendo el turno entre uno y otro: el diccionario
   * completo son varios MB y `update()` de una sola vez es un tramo síncrono que deja al
   * proceso sin atender peticiones. El `JSON.parse` final sí es indivisible, pero es una
   * sola pasada en lugar de las tres (parse + stringify + hash) que había antes.
   */
  private async digerir(cuerpo: string): Promise<DescargaWhoDrug> {
    const hash = createHash('sha256');
    const tramo = WhoDrugsClientService.CARACTERES_POR_TRAMO;

    for (let desde = 0; desde < cuerpo.length; desde += tramo) {
      hash.update(cuerpo.slice(desde, desde + tramo));
      await new Promise((resolve) => setImmediate(resolve));
    }

    return { drugs: JSON.parse(cuerpo), sha256: hash.digest('hex') };
  }

  /**
   * Descripción de una credencial apta para un log: nunca su contenido, sólo lo necesario
   * para reconocer los dos motivos habituales de un 401 (quedó el valor de relleno del
   * catálogo, o llegó vacía).
   */
  private describirCredencial(valor: string): string {
    if (!valor?.trim()) return 'VACÍA';
    if (valor.startsWith('CAMBIAR_')) return `SIN CONFIGURAR (${valor})`;
    return `configurada (${valor.length} caracteres)`;
  }

  /**
   * Convierte el fallo de la llamada a UMC en un error que dice qué pasó. Un rechazo de
   * credenciales llegaba antes como "Request failed with status code 401", indistinguible a
   * simple vista del 401 que emite el guard de Keycloak sobre nuestro propio endpoint.
   */
  private describirFallo(e: any, url: string): Error {
    const status: number | undefined = e?.response?.status;
    if (status === undefined) {
      this.logger.error(`Fallo al descargar WHODrug desde ${url}: ${e?.message ?? e}`);
      return e;
    }

    // El cuerpo suele traer el motivo real (licencia vencida, key inválida, IP no permitida).
    const cuerpo =
      typeof e.response?.data === 'string'
        ? e.response.data.slice(0, 500)
        : JSON.stringify(e.response?.data ?? {}).slice(0, 500);
    this.logger.error(`UMC respondió ${status} a ${url} · cuerpo: ${cuerpo}`);

    if (status === 401 || status === 403) {
      const error = new Error(
        `WHODrug (UMC) rechazó las credenciales con ${status}. Revise WHD_UMC_LICENSE_KEY y ` +
          `WHD_UMC_CLIENT_KEY en TC_PARAMETRO (módulo WHODRUG): son esos valores los que se ` +
          `envían, no los del archivo .env. Respuesta de UMC: ${cuerpo}`,
      );
      // `cause` es de ES2022 y el target del proyecto es anterior: se adjunta a mano para no
      // perder el AxiosError original.
      (error as any).cause = e;
      return error;
    }
    return e;
  }
}
