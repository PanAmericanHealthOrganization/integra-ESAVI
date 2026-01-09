import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Dhis2DataElementService } from './dhis2-data-element.service';

@Injectable()
export class Dhis2AnalyticsService {
  private readonly logger = new Logger(Dhis2AnalyticsService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly dhis2DataElementService: Dhis2DataElementService,
  ) {}

  private getConfig() {
    const username = this.configService.get<string>('DHIS2_USERNAME');
    const passwd = this.configService.get<string>('DHIS2_PASSWD');

    return {
      maxBodyLength: Infinity,
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${passwd}`, 'utf8').toString('base64')}`,
      },
    };
  }

  async getEventsReports(idPrograma: string, fechaInicio?, fechaFin?): Promise<any> {
    const base = this.configService.get<string>('DHIS2_URL');
    const currentYear = new Date().getFullYear();

    // Calcular las fechas dinámicamente
    const endDate = `${currentYear}-12-31`;
    const startDate = `${currentYear - 5}-01-01`;

    // Comienza en la página 1
    let currentPage = 1;
    let allData = { headers: [], rows: [] };
    let hasMoreData = true;

    // --------EXTRACCIÓN USANDO EL MÉTODO GET (la versión 29 no soporta POST):
    // Bucle que continuará hasta que no haya más datos
    while (hasMoreData) {
      // Construcción de la URI con los parámetros necesarios
      // const uri = `/api/29/analytics/enrollments/query/NrEU7cRCZd7.json?startDate=2020-01-01&endDate=2024-12-31&dimension=ou:CcPKoI4rpPZ&dimension=d8PiRnvGHEN&dimension=s8zAZcXZCt9.Z6FiWqPS5of&dimension=h0zzlWpQr5E&dimension=aZ18xLVTHwh&dimension=cEb5FvyVzfw&dimension=MiZMsOXYy0h&dimension=lwTNuRsSGYb&dimension=YNPgKL4Fe4S.lGZvbh067zp&dimension=s8zAZcXZCt9.fHn6kWO65zS&dimension=s8zAZcXZCt9.QnTmov25vZB&dimension=s8zAZcXZCt9.eLf6OfzxVnD&dimension=YNPgKL4Fe4S.YGyOYXtk5zS&dimension=s8zAZcXZCt9.zEfNaTusvkK&dimension=s8zAZcXZCt9.OF69ZkbdcU9&dimension=VP7XYKUIrO8.v815reutsgq&dimension=s8zAZcXZCt9.Z6FiWqPS5of&dimension=s8zAZcXZCt9.NRoDp2vXWEN&dimension=s8zAZcXZCt9.WKHwHedoiFt&dimension=s8zAZcXZCt9.OjJ4UDVQl2U&dimension=VP7XYKUIrO8.OBB1SoIN5il&dimension=VP7XYKUIrO8.b5mq97nFnOw&dimension=VP7XYKUIrO8.kUy4QdYuuDi&dimension=VP7XYKUIrO8.dFM8g5r2Wqd&dimension=VP7XYKUIrO8.jLjulX3TekT&dimension=VP7XYKUIrO8.ptpsOF2TqPm&dimension=VP7XYKUIrO8.prSGoJCLk3c&dimension=VP7XYKUIrO8.AEPccDDSukH&dimension=VP7XYKUIrO8.gnK5UTXIKUy&dimension=VP7XYKUIrO8.wmmgogfGCuR&dimension=VP7XYKUIrO8.yNly1ff8dUy&dimension=VP7XYKUIrO8.sWejbJuZOmx&dimension=VP7XYKUIrO8.L5tVd1WhOWD&dimension=VP7XYKUIrO8.p85K6pFiBjt&dimension=VP7XYKUIrO8.PFBQPhd9u0k&dimension=VP7XYKUIrO8.XneOpUsRpwp&dimension=VP7XYKUIrO8.Ishxh21WNfS&dimension=VP7XYKUIrO8.Yv3z0SMscgM&dimension=VP7XYKUIrO8.yb5YMOCpxmu&dimension=VP7XYKUIrO8.VCIdNTGz7Q5&dimension=VP7XYKUIrO8.nARUulPj97f&dimension=VP7XYKUIrO8.omQ4NywxBzN&dimension=VP7XYKUIrO8.Gp6yV8jsDAW&dimension=YNPgKL4Fe4S.c0WBIfGcS7j&dimension=YNPgKL4Fe4S.N0jXyOzkY71&dimension=YNPgKL4Fe4S.YIk7r0m1cAA&dimension=VP7XYKUIrO8.VMOTHtV1oVB&dimension=VP7XYKUIrO8.UU75ppNydbI&dimension=VP7XYKUIrO8.qsXXKamK8oS&dimension=VP7XYKUIrO8.Ct5Lq1mHJ8h&dimension=VP7XYKUIrO8.huGD0AF9rmA&dimension=s8zAZcXZCt9.ouDdIzt7SMV&dimension=s8zAZcXZCt9.LvOgL2NWvSt&dimension=s8zAZcXZCt9.yO8m0nW2eDh&dimension=s8zAZcXZCt9.zbrF1XdJobC&dimension=s8zAZcXZCt9.LbP32iaAF2i&dimension=s8zAZcXZCt9.Q95VprtBLEP&dimension=s8zAZcXZCt9.FqD8GXs9Gvf&dimension=s8zAZcXZCt9.LxGx2ExbZ6F&dimension=s8zAZcXZCt9.dcsxtuVCy6M&dimension=s8zAZcXZCt9.yjtX7lMBXEc&dimension=YNPgKL4Fe4S.lGZvbh067zp&dimension=YNPgKL4Fe4S.YGyOYXtk5zS&dimension=YNPgKL4Fe4S.RyYY9NUP7in&dimension=VP7XYKUIrO8.xOmjbhsK5mn&dimension=YNPgKL4Fe4S.AR6DnBgPQzp&dimension=YNPgKL4Fe4S.UoYpbHtoVgG&dimension=YNPgKL4Fe4S.SPURWAIsaGV&dimension=h0zzlWpQr5E&dimension=LkgcmIRlM0h&dimension=VP7XYKUIrO8.divNYZcYdub&dimension=VP7XYKUIrO8.ZAKQ4p0mtPZ&dimension=VP7XYKUIrO8.cdzPHEdeRYf&dimension=VP7XYKUIrO8.tEsq9B4Krxi&dimension=VP7XYKUIrO8.dBbl2htBBkf&dimension=VP7XYKUIrO8.ZOoUkmx46tZ&dimension=VP7XYKUIrO8.Vfzvx4emYNq&dimension=VP7XYKUIrO8.i1jGHehzXz3&dimension=VP7XYKUIrO8.f0DUuJnIhli&dimension=VP7XYKUIrO8.fO0l7SZBbUB&dimension=VP7XYKUIrO8.ZNkylerJSH6&dimension=VP7XYKUIrO8.puTvXo5K8A9&dimension=VP7XYKUIrO8.amZDDQBfVGF&dimension=VP7XYKUIrO8.nUbIeGMXx2e&dimension=VP7XYKUIrO8.lqRiwzJNRyH&dimension=VP7XYKUIrO8.kLlcEvGUYHG&dimension=VP7XYKUIrO8.kUF0YTGM6pi&dimension=VP7XYKUIrO8.WOTz2xwG4Y6&dimension=VP7XYKUIrO8.Glz6T5Nl79n&dimension=VP7XYKUIrO8.OpKXHXBAeXv&dimension=VP7XYKUIrO8.ouNGHI4uUTi&dimension=VP7XYKUIrO8.y76qnSjy5bX&dimension=VP7XYKUIrO8.sM5oiw9RjUI&dimension=VP7XYKUIrO8.Ishxh21WNfS&dimension=VP7XYKUIrO8.Yv3z0SMscgM&dimension=VP7XYKUIrO8.hDI4LFx1uaB&dimension=VP7XYKUIrO8.NSGIkhx2Eml&dimension=VP7XYKUIrO8.OIE4NW5r5oW&dimension=VP7XYKUIrO8.vIicyDR0mUi&dimension=VP7XYKUIrO8.cjiwvazmMBx&dimension=VP7XYKUIrO8.eTR55fq0QPj&dimension=VP7XYKUIrO8.s34BgoVanjI&dimension=VP7XYKUIrO8.ThMB0AGvxxW&dimension=VP7XYKUIrO8.immTvkYBYGA&dimension=VP7XYKUIrO8.pzwszwqO9lp&dimension=VP7XYKUIrO8.zhlnUF2meDW&dimension=VP7XYKUIrO8.cO2wj8skEUz&dimension=VP7XYKUIrO8.gXpRKBJxC0m&dimension=VP7XYKUIrO8.cZuU3YXIytv&dimension=VP7XYKUIrO8.cIDf4wnmkbu&dimension=VP7XYKUIrO8.nARUulPj97f&dimension=VP7XYKUIrO8.NYKUhkHzl9S&dimension=VP7XYKUIrO8.L6moQXPiEAZ&dimension=VP7XYKUIrO8.p3sukz69kw1&dimension=VP7XYKUIrO8.RMz8GdGbAAc&dimension=VP7XYKUIrO8.YBFxAVjsSJo&dimension=VP7XYKUIrO8.XIHPtoMnqzO&dimension=VP7XYKUIrO8.IQqhPmgLyq4&dimension=VP7XYKUIrO8.nsJOySU7q39&dimension=VP7XYKUIrO8.ZPPmqAmtVNA&dimension=VP7XYKUIrO8.nGuGUPpQTvX&dimension=VP7XYKUIrO8.a8KHCenr46E&dimension=VP7XYKUIrO8.hJxjcUMO6eN&dimension=VP7XYKUIrO8.yE8zZGNSfiG&dimension=VP7XYKUIrO8.z33hrKUcPdA&dimension=VP7XYKUIrO8.ouXvK5UtZ2s&dimension=VP7XYKUIrO8.ImDTFf0nVOo&dimension=VP7XYKUIrO8.nCwAamLzhIP&dimension=VP7XYKUIrO8.Ke4Ml2rdfjo&dimension=VP7XYKUIrO8.gEEJvfcWj8e&dimension=VP7XYKUIrO8.eKOvqrzU0IC&dimension=VP7XYKUIrO8.divNYZcYdub&dimension=VP7XYKUIrO8.aZq9xTX6ZlL&dimension=VP7XYKUIrO8.wMTmpdmYjUv&dimension=VP7XYKUIrO8.Y8rxSNcFfac&dimension=VP7XYKUIrO8.F6RkpicDfL1&dimension=s8zAZcXZCt9.qtjDk1qk2kD&&dimension=s8zAZcXZCt9.uub6PETeymq&&dimension=s8zAZcXZCt9.G8bNtmb6XrN&stage=YNPgKL4Fe4S&displayProperty=NAME&totalPages=false&outputType=ENROLLMENT&desc=enrollmentdate&pageSize=100&page=${currentPage}&outputIdScheme=NAME&dimension=s8zAZcXZCt9.d8PiRnvGHEN:EQ:933175516`;
      const uri = `/api/29/analytics/enrollments/query/${idPrograma}.json?startDate=${
        fechaInicio ? fechaInicio.toISOString().slice(0, 10) : startDate
      }&endDate=${
        fechaFin ? fechaFin.toISOString().slice(0, 10) : endDate
      }&dimension=ou:CcPKoI4rpPZ&dimension=d8PiRnvGHEN&dimension=s8zAZcXZCt9.Z6FiWqPS5of&dimension=h0zzlWpQr5E&dimension=aZ18xLVTHwh&dimension=cEb5FvyVzfw&dimension=MiZMsOXYy0h&dimension=lwTNuRsSGYb&dimension=YNPgKL4Fe4S.lGZvbh067zp&dimension=s8zAZcXZCt9.fHn6kWO65zS&dimension=s8zAZcXZCt9.QnTmov25vZB&dimension=s8zAZcXZCt9.eLf6OfzxVnD&dimension=YNPgKL4Fe4S.YGyOYXtk5zS&dimension=s8zAZcXZCt9.zEfNaTusvkK&dimension=s8zAZcXZCt9.OF69ZkbdcU9&dimension=VP7XYKUIrO8.v815reutsgq&dimension=s8zAZcXZCt9.Z6FiWqPS5of&dimension=s8zAZcXZCt9.NRoDp2vXWEN&dimension=s8zAZcXZCt9.WKHwHedoiFt&dimension=s8zAZcXZCt9.OjJ4UDVQl2U&dimension=VP7XYKUIrO8.OBB1SoIN5il&dimension=VP7XYKUIrO8.b5mq97nFnOw&dimension=VP7XYKUIrO8.kUy4QdYuuDi&dimension=VP7XYKUIrO8.dFM8g5r2Wqd&dimension=VP7XYKUIrO8.jLjulX3TekT&dimension=VP7XYKUIrO8.ptpsOF2TqPm&dimension=VP7XYKUIrO8.prSGoJCLk3c&dimension=VP7XYKUIrO8.AEPccDDSukH&dimension=VP7XYKUIrO8.gnK5UTXIKUy&dimension=VP7XYKUIrO8.wmmgogfGCuR&dimension=VP7XYKUIrO8.yNly1ff8dUy&dimension=VP7XYKUIrO8.sWejbJuZOmx&dimension=VP7XYKUIrO8.L5tVd1WhOWD&dimension=VP7XYKUIrO8.p85K6pFiBjt&dimension=VP7XYKUIrO8.PFBQPhd9u0k&dimension=VP7XYKUIrO8.XneOpUsRpwp&dimension=VP7XYKUIrO8.Ishxh21WNfS&dimension=VP7XYKUIrO8.Yv3z0SMscgM&dimension=VP7XYKUIrO8.yb5YMOCpxmu&dimension=VP7XYKUIrO8.VCIdNTGz7Q5&dimension=VP7XYKUIrO8.omQ4NywxBzN&dimension=VP7XYKUIrO8.Gp6yV8jsDAW&dimension=YNPgKL4Fe4S.c0WBIfGcS7j&dimension=YNPgKL4Fe4S.N0jXyOzkY71&dimension=YNPgKL4Fe4S.YIk7r0m1cAA&dimension=VP7XYKUIrO8.VMOTHtV1oVB&dimension=VP7XYKUIrO8.UU75ppNydbI&dimension=VP7XYKUIrO8.qsXXKamK8oS&dimension=VP7XYKUIrO8.Ct5Lq1mHJ8h&dimension=VP7XYKUIrO8.huGD0AF9rmA&dimension=s8zAZcXZCt9.ouDdIzt7SMV&dimension=s8zAZcXZCt9.LvOgL2NWvSt&dimension=s8zAZcXZCt9.yO8m0nW2eDh&dimension=s8zAZcXZCt9.zbrF1XdJobC&dimension=s8zAZcXZCt9.LbP32iaAF2i&dimension=s8zAZcXZCt9.Q95VprtBLEP&dimension=s8zAZcXZCt9.FqD8GXs9Gvf&dimension=s8zAZcXZCt9.LxGx2ExbZ6F&dimension=s8zAZcXZCt9.dcsxtuVCy6M&dimension=s8zAZcXZCt9.yjtX7lMBXEc&dimension=YNPgKL4Fe4S.lGZvbh067zp&dimension=YNPgKL4Fe4S.YGyOYXtk5zS&dimension=YNPgKL4Fe4S.RyYY9NUP7in&dimension=VP7XYKUIrO8.xOmjbhsK5mn&dimension=YNPgKL4Fe4S.AR6DnBgPQzp&dimension=YNPgKL4Fe4S.UoYpbHtoVgG&dimension=YNPgKL4Fe4S.SPURWAIsaGV&dimension=YNPgKL4Fe4S.VDatG6TsBKE&dimension=YNPgKL4Fe4S.LPttcTLpOVt&dimension=YNPgKL4Fe4S.AR6DnBgPQzp&dimension=YNPgKL4Fe4S.UoYpbHtoVgG&dimension=YNPgKL4Fe4S.SPURWAIsaGV&dimension=h0zzlWpQr5E&dimension=LkgcmIRlM0h&dimension=VP7XYKUIrO8.divNYZcYdub&dimension=VP7XYKUIrO8.ZAKQ4p0mtPZ&dimension=VP7XYKUIrO8.cdzPHEdeRYf&dimension=VP7XYKUIrO8.tEsq9B4Krxi&dimension=VP7XYKUIrO8.dBbl2htBBkf&dimension=VP7XYKUIrO8.ZOoUkmx46tZ&dimension=VP7XYKUIrO8.Vfzvx4emYNq&dimension=VP7XYKUIrO8.i1jGHehzXz3&dimension=VP7XYKUIrO8.f0DUuJnIhli&dimension=VP7XYKUIrO8.fO0l7SZBbUB&dimension=VP7XYKUIrO8.ZNkylerJSH6&dimension=VP7XYKUIrO8.puTvXo5K8A9&dimension=VP7XYKUIrO8.amZDDQBfVGF&dimension=VP7XYKUIrO8.nUbIeGMXx2e&dimension=VP7XYKUIrO8.lqRiwzJNRyH&dimension=VP7XYKUIrO8.kLlcEvGUYHG&dimension=VP7XYKUIrO8.kUF0YTGM6pi&dimension=VP7XYKUIrO8.WOTz2xwG4Y6&dimension=VP7XYKUIrO8.Glz6T5Nl79n&dimension=VP7XYKUIrO8.OpKXHXBAeXv&dimension=VP7XYKUIrO8.ouNGHI4uUTi&dimension=VP7XYKUIrO8.y76qnSjy5bX&dimension=VP7XYKUIrO8.sM5oiw9RjUI&dimension=VP7XYKUIrO8.Yv3z0SMscgM&dimension=VP7XYKUIrO8.hDI4LFx1uaB&dimension=VP7XYKUIrO8.NSGIkhx2Eml&dimension=VP7XYKUIrO8.OIE4NW5r5oW&dimension=VP7XYKUIrO8.vIicyDR0mUi&dimension=VP7XYKUIrO8.cjiwvazmMBx&dimension=VP7XYKUIrO8.eTR55fq0QPj&dimension=VP7XYKUIrO8.s34BgoVanjI&dimension=VP7XYKUIrO8.ThMB0AGvxxW&dimension=VP7XYKUIrO8.immTvkYBYGA&dimension=VP7XYKUIrO8.pzwszwqO9lp&dimension=VP7XYKUIrO8.zhlnUF2meDW&dimension=VP7XYKUIrO8.cO2wj8skEUz&dimension=VP7XYKUIrO8.gXpRKBJxC0m&dimension=VP7XYKUIrO8.cZuU3YXIytv&dimension=VP7XYKUIrO8.cIDf4wnmkbu&dimension=VP7XYKUIrO8.nARUulPj97f&dimension=VP7XYKUIrO8.NYKUhkHzl9S&dimension=VP7XYKUIrO8.L6moQXPiEAZ&dimension=VP7XYKUIrO8.p3sukz69kw1&dimension=VP7XYKUIrO8.RMz8GdGbAAc&dimension=VP7XYKUIrO8.YBFxAVjsSJo&dimension=VP7XYKUIrO8.XIHPtoMnqzO&dimension=VP7XYKUIrO8.EioClpCGSeW&dimension=VP7XYKUIrO8.QiK0IDIhgsT&dimension=VP7XYKUIrO8.zx3Ru24u29Q&dimension=VP7XYKUIrO8.yYbiVLliiuC&dimension=VP7XYKUIrO8.R1IFk22hvjp&dimension=VP7XYKUIrO8.IQqhPmgLyq4&dimension=VP7XYKUIrO8.nsJOySU7q39&dimension=VP7XYKUIrO8.ZPPmqAmtVNA&dimension=VP7XYKUIrO8.nGuGUPpQTvX&dimension=VP7XYKUIrO8.a8KHCenr46E&dimension=VP7XYKUIrO8.hJxjcUMO6eN&dimension=VP7XYKUIrO8.yE8zZGNSfiG&dimension=VP7XYKUIrO8.z33hrKUcPdA&dimension=VP7XYKUIrO8.ouXvK5UtZ2s&dimension=VP7XYKUIrO8.ImDTFf0nVOo&dimension=VP7XYKUIrO8.nCwAamLzhIP&dimension=VP7XYKUIrO8.Ke4Ml2rdfjo&dimension=VP7XYKUIrO8.gEEJvfcWj8e&dimension=VP7XYKUIrO8.eKOvqrzU0IC&dimension=VP7XYKUIrO8.divNYZcYdub&dimension=VP7XYKUIrO8.aZq9xTX6ZlL&dimension=VP7XYKUIrO8.wMTmpdmYjUv&dimension=VP7XYKUIrO8.Y8rxSNcFfac&dimension=VP7XYKUIrO8.F6RkpicDfL1&dimension=VP7XYKUIrO8.UWPfTHFYpTo&dimension=VP7XYKUIrO8.ldsXgZosabT&dimension=VP7XYKUIrO8.K0dVyWddf0N&dimension=VP7XYKUIrO8.Q2UzvXdMc1B&dimension=VP7XYKUIrO8.N1o6Pb8hWky&dimension=VP7XYKUIrO8.LewOZjUQPB2&dimension=VP7XYKUIrO8.AOabQxSHc0P&dimension=VP7XYKUIrO8.QONyDiWqf1q&dimension=s8zAZcXZCt9.qtjDk1qk2kD&&dimension=s8zAZcXZCt9.uub6PETeymq&&dimension=s8zAZcXZCt9.G8bNtmb6XrN&dimension=s8zAZcXZCt9.imesY6LzkTu&stage=YNPgKL4Fe4S&displayProperty=NAME&totalPages=false&outputType=ENROLLMENT&desc=enrollmentdate&pageSize=100&page=${currentPage}&outputIdScheme=NAME`;

      const url = base.concat(uri);

      try {
        const { data } = await firstValueFrom(
          this.httpService.get(url, this.getConfig()).pipe(// USO DE GET de API REST DHIS2
            catchError((e: AxiosError) => {
              this.logger.error('Error con la API:', e);
              throw new HttpException(e.response?.data || e.message, e.response?.status || 500);
            }),
          ),
        );

        if (!data || !Array.isArray(data.rows) || !Array.isArray(data.headers)) {
          console.error('Estructura de datos inesperada:', data);
          break; // Si no hay datos o no están en el formato esperado, salir del ciclo
        }

        if (data.rows.length === 0) {
          console.log('No hay más datos disponibles.');
          break; // Si no hay filas de datos, terminar el ciclo
        }

        // Almacenar los datos obtenidos en la respuesta
        allData.rows.push(...data.rows);
        allData.headers = data.headers; // Guardamos los headers una vez

        // Verificar si hay más datos
        hasMoreData = data.rows.length === 100;
        currentPage++;
      } catch (error) {
        console.error('Error al obtener datos de la API:', error);
        break;
      }
    }

    // Retornar los datos obtenidos (headers y rows)
    return allData;
  }
}
