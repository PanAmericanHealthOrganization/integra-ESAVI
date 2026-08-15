import {HttpService} from '@nestjs/axios';
import {Test,TestingModule} from '@nestjs/testing';
import {createHash} from 'node:crypto';
import {of,throwError} from 'rxjs';
import {ParametroService} from '../../integrator/service/parametro.service';
import {WhoDrugsClientService} from './whodrugs-client.service';

describe('WhoDrugsClientService', () => {
  let service: WhoDrugsClientService;
  let httpGet: jest.Mock;
  let getValor: jest.Mock;

  /** Valores de TC_PARAMETRO por clave; cada prueba ajusta los que le interesan. */
  const parametros: Record<string, string> = {};

  /** Cuerpo tal como lo devuelve UMC: JSON sin parsear. */
  const CUERPO_CRUDO = JSON.stringify([{ drugName: 'PARACETAMOL' }]);
  /** SHA-256 de CUERPO_CRUDO; el cliente lo calcula sobre esos mismos bytes. */
  const SHA_CUERPO = createHash('sha256').update(CUERPO_CRUDO).digest('hex');

  const errorHttp = (status: number, data: unknown) =>
    Object.assign(new Error(`Request failed with status code ${status}`), {
      response: { status, data },
    });

  beforeEach(async () => {
    parametros.WHD_API_URL = 'https://api.who-umc.org/';
    parametros.WHD_UMC_LICENSE_KEY = 'licencia-real-1234';
    parametros.WHD_UMC_CLIENT_KEY = 'cliente-real-5678';

    // El cliente pide el cuerpo sin parsear (transformResponse) para poder hashearlo tal
    // como llega, así que el transporte entrega texto, no un objeto.
    httpGet = jest.fn().mockReturnValue(of({ data: CUERPO_CRUDO }));
    getValor = jest.fn(async (_modulo: string, clave: string) => parametros[clave]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhoDrugsClientService,
        { provide: HttpService, useValue: { get: httpGet } },
        { provide: ParametroService, useValue: { getValor } },
      ],
    }).compile();

    service = module.get(WhoDrugsClientService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Armado de la petición ────────────────────────────────────────────────

  it('envía los tres parámetros de consulta y las credenciales en las cabeceras', async () => {
    const { drugs, sha256 } = await service.getDrugs(3, 'es-ES', true);

    expect(drugs).toEqual([{ drugName: 'PARACETAMOL' }]);
    // El hash sale del cuerpo crudo, no de volver a serializar lo ya parseado.
    expect(sha256).toBe(SHA_CUERPO);
    expect(httpGet).toHaveBeenCalledWith(
      '/whodrug/download/v2/regional-drugs?MedProdLevel=3&IngredientTranslations=es-ES&IncludeAtc=true',
      {
        baseURL: 'https://api.who-umc.org/',
        transformResponse: [expect.any(Function)],
        headers: {
          'Ocp-Apim-Subscription-Key': 'cliente-real-5678',
          'umc-license-key': 'licencia-real-1234',
          'umc-client-key': 'cliente-real-5678',
        },
      },
    );
  });

  it('manda la client key también como subscription key del APIM que publica la API', async () => {
    // Sin esta cabecera Azure API Management corta en el borde con
    // "Access denied due to invalid subscription key", aunque la licencia sea válida.
    await service.getDrugs(3, 'es-ES', true);

    const { headers } = httpGet.mock.calls[0][1];
    expect(headers['Ocp-Apim-Subscription-Key']).toBe('cliente-real-5678');
  });

  it('toma las credenciales de TC_PARAMETRO, no del entorno', async () => {
    await service.getDrugs(3, 'es-ES', true);

    expect(getValor).toHaveBeenCalledWith('WHODRUG', 'WHD_API_URL');
    expect(getValor).toHaveBeenCalledWith('WHODRUG', 'WHD_UMC_LICENSE_KEY');
    expect(getValor).toHaveBeenCalledWith('WHODRUG', 'WHD_UMC_CLIENT_KEY');
  });

  // ─── Diagnóstico ──────────────────────────────────────────────────────────

  it('registra el estado de cada credencial sin escribir su contenido', async () => {
    const log = jest.spyOn((service as any).logger, 'log').mockImplementation();
    parametros.WHD_UMC_CLIENT_KEY = 'CAMBIAR_WHD_UMC_CLIENT_KEY';

    await service.getDrugs(3, 'es-ES', true);

    const mensaje = log.mock.calls.map((c) => String(c[0])).join('\n');
    expect(mensaje).toContain('umc-license-key: configurada (18 caracteres)');
    expect(mensaje).toContain('umc-client-key: SIN CONFIGURAR (CAMBIAR_WHD_UMC_CLIENT_KEY)');
    // La licencia real no debe aparecer nunca en el log.
    expect(mensaje).not.toContain('licencia-real-1234');
  });

  it('marca como VACÍA una credencial en blanco', async () => {
    const log = jest.spyOn((service as any).logger, 'log').mockImplementation();
    parametros.WHD_UMC_LICENSE_KEY = '   ';

    await service.getDrugs(3, 'es-ES', true);

    expect(log.mock.calls.map((c) => String(c[0])).join('\n')).toContain(
      'umc-license-key: VACÍA',
    );
  });

  // ─── Errores ──────────────────────────────────────────────────────────────

  it.each([401, 403])(
    'convierte un %s de UMC en un error que apunta a TC_PARAMETRO',
    async (status) => {
      jest.spyOn((service as any).logger, 'error').mockImplementation();
      const original = errorHttp(status, { message: 'License expired' });
      httpGet.mockReturnValue(throwError(() => original));

      await expect(service.getDrugs(3, 'es-ES', true)).rejects.toThrow(
        /rechazó las credenciales con \d+/,
      );
      await expect(service.getDrugs(3, 'es-ES', true)).rejects.toThrow(/TC_PARAMETRO/);
      await expect(service.getDrugs(3, 'es-ES', true)).rejects.toThrow(/License expired/);
    },
  );

  it('adjunta el error original como causa', async () => {
    jest.spyOn((service as any).logger, 'error').mockImplementation();
    const original = errorHttp(401, 'no autorizado');
    httpGet.mockReturnValue(throwError(() => original));

    await expect(service.getDrugs(3, 'es-ES', true)).rejects.toMatchObject({
      cause: original,
    });
  });

  it('registra el cuerpo de la respuesta de UMC para saber el motivo real', async () => {
    const error = jest.spyOn((service as any).logger, 'error').mockImplementation();
    httpGet.mockReturnValue(throwError(() => errorHttp(401, { detail: 'IP not allowed' })));

    await expect(service.getDrugs(3, 'es-ES', true)).rejects.toThrow();

    expect(String(error.mock.calls[0][0])).toContain('IP not allowed');
  });

  it('propaga sin reinterpretar los errores que no son de credenciales', async () => {
    jest.spyOn((service as any).logger, 'error').mockImplementation();
    const original = errorHttp(500, 'boom');
    httpGet.mockReturnValue(throwError(() => original));

    await expect(service.getDrugs(3, 'es-ES', true)).rejects.toBe(original);
  });

  it('propaga el fallo de TC_PARAMETRO cuando el parámetro no existe', async () => {
    jest.spyOn((service as any).logger, 'error').mockImplementation();
    getValor.mockRejectedValue(new Error('No se encontró el parámetro "WHD_API_URL"'));

    await expect(service.getDrugs(3, 'es-ES', true)).rejects.toThrow(
      'No se encontró el parámetro "WHD_API_URL"',
    );
    expect(httpGet).not.toHaveBeenCalled();
  });
});
