import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import * as moment from 'moment/moment';
import * as puppeteer from 'puppeteer';
import { catchError, firstValueFrom } from 'rxjs';
import { read } from 'xlsx';

@Injectable()
export class VigiflowCrawlerService {
  private readonly logger = new Logger(VigiflowCrawlerService.name);
  private _jwtToken: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this._jwtToken = '';
  }

  /**
   *
   * @returns
   */
  async retrieveJWT(): Promise<any> {
    const base = this.configService.get<string>('VIGIFLOW_URL');
    const username = this.configService.get<string>('VIGIFLOW_USERNAME');
    const password = this.configService.get<string>('VIGIFLOW_PASSWD');
    const puppeteerPath = this.configService.get<string>('PATH_BROWSER_PUPPETEER');

    const queryUserUrl = new URL('/query/user', base).href;

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: puppeteerPath,
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.resourceType() === 'image') {
        request.abort();
      } else {
        request.continue();
      }
    });
    page.setDefaultTimeout(120000);

    // domcontentloaded termina en cuanto el DOM inicial carga (antes de que
    // MSAL.js ejecute su redirect a B2C). waitForSelector('#email') se encarga
    // de esperar hasta que la página B2C esté lista después de la redirección.
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });

    try {
      // Esperar a que MSAL.js complete el redirect a B2C y el formulario aparezca.
      await page.waitForSelector('#email', { visible: true, timeout: 90000 });
      await page.type('#email', username);
      await page.type('#password', password);

      // Registrar el listener ANTES del click para no perder la respuesta POST a
      // /query/user que VigiFlow hace tras el callback OAuth (MSAL procesa el código).
      // .catch(() => {}) suprime el unhandled rejection si el browser cierra primero.
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url() === queryUserUrl &&
          response.request().method() === 'POST',
        { timeout: 90000 },
      );
      responsePromise.catch(() => {});

      // JS click evita errores "not clickable" de Puppeteer con elementos B2C
      await page.waitForSelector('#next', { visible: true, timeout: 30000 });
      await page.evaluate(() => {
        const btn = document.querySelector('#next') as HTMLElement;
        if (btn) btn.click();
      });

      // Esperar el POST a /query/user con el JWT en el header Authorization
      const responses = await responsePromise;
      const bearer = responses.request().headers().authorization;
      this._jwtToken = bearer?.substring(7) ?? '';

      if (!this._jwtToken) {
        throw new Error('VigiFlow no devolvió un token de autorización en la respuesta de login');
      }
    } catch (e) {
      this.logger.error('Error al obtener el token JWT de VigiFlow:', e?.message ?? e);
      throw new Error(`Autenticación VigiFlow fallida: ${e?.message ?? e}`);
    } finally {
      await browser.close();
    }
    const obj = { jwt: this._jwtToken };
    return obj;
  }

  /**
   * Descaga el reporte en formato Excel
   * @param fechaInicio
   * @param fechaFin
   * @param codigoATC
   * @returns
   */
  async retrieveExcelReport(fechaInicio: string, fechaFin: string, codigoATC: string, token?: string) {
    try {
      this.logger.log('Iniciando la generación del reporte de Excel...');
      const jwt = token ?? (await this.retrieveJWT()).jwt;
      const url = this.configService.get<string>('VIGIFLOW_RENDER_AEFI_EXCEL_URL');
      const payload = this.getPayload(
        'renderaefiicsrlinelistingexcel',
        fechaInicio,
        fechaFin,
        codigoATC,
      );

      // Realizar la petición HTTP para obtener el documento
      const { data } = await firstValueFrom(
        this.httpService
          .post(url, payload, {
            headers: {
              Authorization: `Bearer ${jwt}`,
              'Content-Type': 'application/json',
            },
          })
          .pipe(
            catchError((e: AxiosError) => {
              this.logger.error('Error al obtener reporte Excel de VigiFlow:', e.message);
              if (e.response) {
                throw new HttpException(e.response.data, e.response.status);
              }
              throw new HttpException('Error de red al conectar con VigiFlow (Excel)', 503);
            }),
          ),
      );
      return read(data.renderedDocument);
    } catch (error) {
      this.logger.error('Error al generar el reporte de Excel:', error);
      throw new Error('Hubo un problema al generar el reporte de Excel');
    }
  }

  /**
   * genera el reporte en formato JSON
   * @param fechaInicio
   * @param fechaFin
   * @param codigoATC
   * @returns
   */
  async retrieveJsonReport(fechaInicio: string, fechaFin: string, codigoATC: string, token?: string) {
    const jwt = token ?? (await this.retrieveJWT()).jwt;
    const url = this.configService.get<string>('VIGIFLOW_RENDER_AEFI_JSON_URL');
    const payload = this.getPayload('rendericsrlistingexcel', fechaInicio, fechaFin, codigoATC);

    const { data } = await firstValueFrom(
      this.httpService
        .post(url, payload, {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
        })
        .pipe(
          catchError((e: AxiosError) => {
            this.logger.error('Error al obtener reporte JSON de VigiFlow:', e.message);
            if (e.response) {
              throw new HttpException(e.response.data, e.response.status);
            }
            throw new HttpException('Error de red al conectar con VigiFlow (JSON)', 503);
          }),
        ),
    );
    const excel = read(data.renderedDocument);
    return excel;
  }

  /**
   * Genera el payload para realizar la consulta
   * @param queryName
   * @param fechaInicio
   * @param fechaFin
   * @param codigoATC
   * @returns
   */
  private getPayload(queryName: string, fechaInicio: string, fechaFin: string, codigoATC: string) {
    return JSON.stringify({
      queryName: queryName,
      booleanSearchIcsrsParameters: [],
      dateRangeSearchIcsrsParameters: [
        {
          searchIcsrsField: 102,
          fromValue: fechaInicio,
          toValue: fechaFin,
        },
      ],
      dictionarySearchIcsrsParameters: [
        {
          dictionaryEnum: 23,   // <-- filtro de Gravedad
          searchIcsrsField: 703,
          values: ['2'],        // <-- "2" corresponde al valor "No" //['2', '4'], // <-- "2" corresponde al valor "No" y "4" a "Si"
        },
        {
          searchIcsrsField: 903,
          dictionaryEnum: 26, // <-- Estado del reporte <-- Reporte <-- filtro AVANZADO
          values: ['0', '1'], //['0', '2', '1'], // <-- "0" corresponde a "Abierto", "2" a "Bajo evaluación" y "1" a "Cerrado"
          // Se recomienda no utilizar el estado del reporte "2" (Bajo evaluación) ya que puede generar inconsistencias en los reportes,
          // por ejemplo, las reacciones pueden ser consideradas como graves en algunos casos y en otros no.
        },
      ],
      dateSearchIcsrsParameters: [],
      medicalTerminologySearchIcsrsParameters: [],
      medicinalTerminologyProductSearchIcsrsParameters: [],
      medicinalTerminologySubstancesSearchIcsrsParameters: [],
      organisationSearchIcsrsParameters: [],
      textSearchIcsrsParameters: [
        {
          searchIcsrsField: 604,
          textSearchIcsrsParameterType: 1,
          value: codigoATC,
        },
      ],
      userSearchIcsrsParameters: [],
      enumSearchIcsrsParameters: [],
      // printDate: '2022-12-02T11:57:03.904Z',
      printDate: moment().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
    });
  }

  /**ç
   * Pausa la ejecución por un tiempo determinado
   * @param milliseconds
   * @returns
   */
  sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
