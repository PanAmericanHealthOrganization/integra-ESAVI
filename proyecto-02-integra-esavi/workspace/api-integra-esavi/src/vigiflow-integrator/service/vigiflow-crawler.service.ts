import {HttpService} from '@nestjs/axios';
import {HttpException,Injectable,Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {AxiosError} from 'axios';
import * as fs from 'fs';
import * as os from 'os';
import * as puppeteer from 'puppeteer';
import {catchError,firstValueFrom} from 'rxjs';
import {ParametroService} from '../../integrator/service/parametro.service';
import {read} from 'xlsx';

@Injectable()
export class VigiflowCrawlerService {
  private readonly logger = new Logger(VigiflowCrawlerService.name);
  private _jwtToken: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly parametroService: ParametroService,
  ) {
    this._jwtToken = '';
  }

  /**
   *
   * @returns
   */
  private resolveChromePath(): string | undefined {
    const configured = this.configService.get<string>('PATH_BROWSER_PUPPETEER');
    if (configured && fs.existsSync(configured)) {
      return configured;
    }
    if (configured) {
      this.logger.warn(`PATH_BROWSER_PUPPETEER apunta a una ruta inexistente: "${configured}". Buscando Chrome automáticamente.`);
    }
    const fallbacks: Record<string, string[]> = {
      win32: [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
      ],
      darwin: [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
      ],
      linux: [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
      ],
    };
    const paths = fallbacks[os.platform()] ?? [];
    const found = paths.find((p) => fs.existsSync(p));
    if (found) {
      this.logger.log(`Chrome encontrado en: ${found}`);
    } else {
      this.logger.warn('No se encontró Chrome en rutas estándar. Puppeteer usará su Chromium integrado.');
    }
    return found;
  }

  async retrieveJWT(): Promise<any> {
    const base = this.configService.get<string>('VIGIFLOW_URL');
    const username = await this.parametroService.getValor('VIGIFLOW', 'VIGIFLOW_USERNAME');
    const password = await this.parametroService.getValor('VIGIFLOW', 'VIGIFLOW_PASSWD');
    const chromePath = this.resolveChromePath();

    const queryUserUrl = new URL('/query/user', base).href;

    const browser = await puppeteer.launch({
      headless: 'new',
        ...(chromePath && { executablePath: chromePath }),
        args: [
      '--no-sandbox',                // Vital para entornos Linux/Docker
      '--disable-setuid-sandbox',    // Vital para entornos Linux/Docker
      '--disable-gpu',               // Desactiva la aceleración por hardware (ideal para servidores sin GUI)
      '--disable-dev-shm-usage',     // Evita problemas de memoria compartida en Linux (/dev/shm)
    ],
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
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error('Error al obtener el token JWT de VigiFlow:', message);
      throw new Error(`Autenticación VigiFlow fallida: ${message}`);
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
      printDate: new Date().toISOString(),
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
