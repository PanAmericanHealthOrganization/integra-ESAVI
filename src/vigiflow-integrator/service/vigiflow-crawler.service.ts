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

  async retrieveJWT(): Promise<any> {
    const base = this.configService.get<string>('VIGIFLOW_URL');
    const username = this.configService.get<string>('VIGIFLOW_USERNAME');
    const password = this.configService.get<string>('VIGIFLOW_PASSWD');
    const puppeteerPath = this.configService.get<string>('DIR_CHROME_PUPPETEER');

    //const browser = await puppeteer.launch({ headless: false });
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: puppeteerPath, // Ruta al ejecutable de Chrome
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    //Avoid loading the images
    page.on('request', (request) => {
      if (request.resourceType() === 'image') {
        request.abort();
      } else {
        request.continue();
      }
    });
    page.setDefaultTimeout(0);
    await page.goto(base, { waitUntil: 'networkidle0' });
    try {
      // Navigate to the login page
      //page.goto(base, { waitUntil: 'networkidle0' });
      // Fill in the login form
      console.log('Setting up parameters to login');
      await page.type('input[id=email]', username);
      await page.type('input[id=password]', password);
      // Submit the form
      console.log('Making click on submit button');
      // Submit the form
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('button[type="submit"]'),
      ]);
      // Current page
      const url = page.url();
      console.log(`This is the current page ${url}`);
      //console.timeLog('START');
      /*--await page.on('response', async (response) => {
        //console.log(response.request().url());
        if (response.request().url() === 'https://vigiflow.who-umc.org/query/user') {
          const bearer = response.request().headers().authorization;
          this._jwtToken = bearer.substring(7);
          await browser.close();
        }
      });*/
      const responses = await page.waitForResponse(
        (response) => response.url() === 'https://vigiflow.who-umc.org/query/user'
        && response.request().method() === 'POST',
        { timeout: 15000 },
      );
      const bearer = responses.request().headers().authorization;
      this._jwtToken = bearer?.substring(7) ?? '';
    } catch (e) {
      console.log('error al obtener el tokeb', e);
      console.log('error al obtener el tokeb', e.message);
      await browser.close();
    }
    //Workaround solution

    /*--await this.sleep(15000);*/
    const obj = { jwt: this._jwtToken };
    console.log('obj TOKEN:::: ', obj);
    return obj;
  }

  async retrieveExcelReport(fechaInicio: string, fechaFin: string, codigoATC: string) {
    try {
      console.log('fechaInicio:::. ', fechaInicio);
      console.log('fechaFin:::. ', fechaFin);
      console.log('codigoATC:::. ', codigoATC);

      // Obtener el token JWT
      const token = await this.retrieveJWT();

      // TOKEN::  { jwt: '' }
      console.log('TOKEN:: ', token);

      const url = this.configService.get<string>('VIGIFLOW_RENDER_AEFI_EXCEL_URL');
      console.log('url:::: ', url);

      const payload = this.getPayload(
        'renderaefiicsrlinelistingexcel',
        fechaInicio,
        fechaFin,
        codigoATC,
      );
      console.log('payload::: ', payload);

      // Realizar la petición HTTP para obtener el documento
      const { data } = await firstValueFrom(
        this.httpService
          .post(url, payload, {
            headers: {
              Authorization: `Bearer ${token.jwt}`,
              'Content-Type': 'application/json',
            },
          })
          .pipe(
            catchError((e: AxiosError) => {
              this.logger.error(e);
              throw new HttpException(e.response.data, e.response.status);
            }),
          ),
      );

      // Leer el archivo recibido y devolverlo
      return read(data.renderedDocument);
    } catch (error) {
      // Manejo de errores
      this.logger.error('Error al generar el reporte de Excel:', error);
      throw new Error('Hubo un problema al generar el reporte de Excel');
    }
  }

  async retrieveJsonReport(fechaInicio: string, fechaFin: string, codigoATC: string) {
    const token = await this.retrieveJWT();

    const url = this.configService.get<string>('VIGIFLOW_RENDER_AEFI_JSON_URL');

    console.log('url2:: ', url);
    const payload = this.getPayload('rendericsrlistingexcel', fechaInicio, fechaFin, codigoATC);
    console.log('payload2:: ', payload);

    const { data } = await firstValueFrom(
      this.httpService
        .post(url, payload, {
          headers: {
            Authorization: `Bearer ${token.jwt}`,
            'Content-Type': 'application/json',
          },
        })
        .pipe(
          catchError((e: AxiosError) => {
            this.logger.error(e);
            throw new HttpException(e.response.data, e.response.status);
          }),
        ),
    );
    const excel = read(data.renderedDocument);
    const sheetsNames = excel.SheetNames;
    return excel;
  }

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
          searchIcsrsField: 903,
          dictionaryEnum: 26,
          values: ['0', '2', '1'], //Que significa esto
          // values: ['0'],
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

  sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
