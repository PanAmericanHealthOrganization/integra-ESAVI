import { HttpException, Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import * as puppeteer from 'puppeteer';
import * as fsModule from 'fs';
import * as osModule from 'os';
import * as xlsxModule from 'xlsx';
import { VigiflowCrawlerService } from './vigiflow-crawler.service';

// Nunca se debe abrir un navegador real: se mockea puppeteer por completo.
jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

// Se mockea `fs` (existsSync) conservando el resto de la API real.
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return { ...actual, existsSync: jest.fn() };
});

// Se mockea `os` (platform) conservando el resto de la API real.
jest.mock('os', () => {
  const actual = jest.requireActual('os');
  return { ...actual, platform: jest.fn() };
});

// Se mockea `read` de xlsx (parseo de los documentos base64 devueltos por VigiFlow).
jest.mock('xlsx', () => {
  const actual = jest.requireActual('xlsx');
  return { ...actual, read: jest.fn() };
});

describe('VigiflowCrawlerService', () => {
  const mockHttpService = { post: jest.fn() };
  const mockConfigService = { get: jest.fn() };
  const mockParametroService = { getValor: jest.fn() };

  function createService() {
    return new VigiflowCrawlerService(mockHttpService as any, mockConfigService as any, mockParametroService as any);
  }

  function createFakePage(overrides: Record<string, any> = {}) {
    return {
      setRequestInterception: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      setDefaultTimeout: jest.fn(),
      goto: jest.fn().mockResolvedValue(undefined),
      waitForSelector: jest.fn().mockResolvedValue(undefined),
      type: jest.fn().mockResolvedValue(undefined),
      evaluate: jest.fn().mockResolvedValue(undefined),
      waitForResponse: jest.fn(),
      ...overrides,
    };
  }

  function createFakeBrowser(page: any) {
    return {
      newPage: jest.fn().mockResolvedValue(page),
      close: jest.fn().mockResolvedValue(undefined),
    };
  }

  function fakeResponse(authorizationHeader: string | undefined) {
    return {
      request: () => ({
        headers: () => ({ authorization: authorizationHeader }),
      }),
    };
  }

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined as any);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined as any);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined as any);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'VIGIFLOW_URL') return 'https://vigiflow.example.org';
      return undefined;
    });
    mockParametroService.getValor.mockImplementation(async (_modulo: string, clave: string) => {
      if (clave === 'VIGIFLOW_USERNAME') return 'usuario@demo.com';
      if (clave === 'VIGIFLOW_PASSWD') return 'clave-secreta';
      return '';
    });
    (fsModule.existsSync as jest.Mock).mockReturnValue(false);
    (osModule.platform as jest.Mock).mockReturnValue('win32');
  });

  // ---------------------------------------------------------------------------------------
  describe('resolveChromePath (privado)', () => {
    it('retorna la ruta configurada si existe en disco', () => {
      mockConfigService.get.mockImplementation((key: string) =>
        key === 'PATH_BROWSER_PUPPETEER' ? 'C:\\chrome\\chrome.exe' : undefined,
      );
      (fsModule.existsSync as jest.Mock).mockImplementation((p: string) => p === 'C:\\chrome\\chrome.exe');

      const service = createService();
      const result = (service as any).resolveChromePath();

      expect(result).toBe('C:\\chrome\\chrome.exe');
    });

    it('si la ruta configurada no existe, busca en las rutas de fallback de la plataforma', () => {
      mockConfigService.get.mockImplementation((key: string) =>
        key === 'PATH_BROWSER_PUPPETEER' ? 'C:\\ruta\\inexistente.exe' : undefined,
      );
      (osModule.platform as jest.Mock).mockReturnValue('win32');
      (fsModule.existsSync as jest.Mock).mockImplementation(
        (p: string) => p === 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      );

      const service = createService();
      const result = (service as any).resolveChromePath();

      expect(result).toBe('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
    });

    it('retorna undefined si no hay configuración ni rutas de fallback disponibles', () => {
      mockConfigService.get.mockReturnValue(undefined);
      (fsModule.existsSync as jest.Mock).mockReturnValue(false);

      const service = createService();
      const result = (service as any).resolveChromePath();

      expect(result).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------------------
  describe('retrieveJWT', () => {
    it('camino feliz: obtiene el JWT desde la respuesta interceptada y cierra el navegador', async () => {
      const page = createFakePage({
        waitForResponse: jest.fn().mockResolvedValue(fakeResponse('Bearer token-jwt-123')),
      });
      const browser = createFakeBrowser(page);
      (puppeteer.launch as jest.Mock).mockResolvedValue(browser);

      const service = createService();
      const result = await service.retrieveJWT();

      expect(result).toEqual({ jwt: 'token-jwt-123' });
      expect(page.type).toHaveBeenCalledWith('#email', 'usuario@demo.com');
      expect(page.type).toHaveBeenCalledWith('#password', 'clave-secreta');
      expect(browser.close).toHaveBeenCalled();
    });

    it('intercepta y aborta las peticiones de imágenes, pero continúa las demás', async () => {
      const page = createFakePage({
        waitForResponse: jest.fn().mockResolvedValue(fakeResponse('Bearer token-abc')),
      });
      const browser = createFakeBrowser(page);
      (puppeteer.launch as jest.Mock).mockResolvedValue(browser);

      const service = createService();
      await service.retrieveJWT();

      const requestHandler = page.on.mock.calls.find(([event]: [string]) => event === 'request')[1];
      const imageRequest = { resourceType: () => 'image', abort: jest.fn(), continue: jest.fn() };
      const docRequest = { resourceType: () => 'document', abort: jest.fn(), continue: jest.fn() };

      requestHandler(imageRequest);
      requestHandler(docRequest);

      expect(imageRequest.abort).toHaveBeenCalled();
      expect(imageRequest.continue).not.toHaveBeenCalled();
      expect(docRequest.continue).toHaveBeenCalled();
      expect(docRequest.abort).not.toHaveBeenCalled();
    });

    it('lanza error y cierra el navegador si el formulario de login (#email) nunca aparece', async () => {
      const page = createFakePage({
        waitForSelector: jest.fn().mockRejectedValue(new Error('timeout esperando #email')),
      });
      const browser = createFakeBrowser(page);
      (puppeteer.launch as jest.Mock).mockResolvedValue(browser);

      const service = createService();

      await expect(service.retrieveJWT()).rejects.toThrow(/Autenticación VigiFlow fallida/);
      expect(browser.close).toHaveBeenCalled();
    });

    it('lanza error si la respuesta interceptada no trae token de autorización', async () => {
      const page = createFakePage({
        waitForResponse: jest.fn().mockResolvedValue(fakeResponse(undefined)),
      });
      const browser = createFakeBrowser(page);
      (puppeteer.launch as jest.Mock).mockResolvedValue(browser);

      const service = createService();

      await expect(service.retrieveJWT()).rejects.toThrow(
        /VigiFlow no devolvió un token de autorización en la respuesta de login/,
      );
      expect(browser.close).toHaveBeenCalled();
    });

    it('usa executablePath cuando resolveChromePath encuentra una ruta configurada', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'VIGIFLOW_URL') return 'https://vigiflow.example.org';
        if (key === 'PATH_BROWSER_PUPPETEER') return 'C:\\chrome\\chrome.exe';
        return undefined;
      });
      (fsModule.existsSync as jest.Mock).mockImplementation((p: string) => p === 'C:\\chrome\\chrome.exe');
      const page = createFakePage({
        waitForResponse: jest.fn().mockResolvedValue(fakeResponse('Bearer tok')),
      });
      const browser = createFakeBrowser(page);
      (puppeteer.launch as jest.Mock).mockResolvedValue(browser);

      const service = createService();
      await service.retrieveJWT();

      expect(puppeteer.launch).toHaveBeenCalledWith(
        expect.objectContaining({ executablePath: 'C:\\chrome\\chrome.exe' }),
      );
    });
  });

  // ---------------------------------------------------------------------------------------
  describe('retrieveExcelReport', () => {
    it('camino feliz: usa el token recibido, envía el payload correcto y parsea la respuesta', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'VIGIFLOW_RENDER_AEFI_EXCEL_URL') return 'https://vigiflow.example.org/excel';
        return undefined;
      });
      mockHttpService.post.mockReturnValue(of({ data: { renderedDocument: 'BASE64EXCEL' } }));
      const fakeWorkbook = { SheetNames: ['A'], Sheets: {} };
      (xlsxModule.read as jest.Mock).mockReturnValueOnce(fakeWorkbook);

      const service = createService();
      const retrieveJWTSpy = jest.spyOn(service, 'retrieveJWT');

      const result = await service.retrieveExcelReport('20240101', '20240131', 'J07', 'token-directo');

      expect(retrieveJWTSpy).not.toHaveBeenCalled();
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://vigiflow.example.org/excel',
        expect.any(String),
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token-directo' }) }),
      );
      expect(xlsxModule.read).toHaveBeenCalledWith('BASE64EXCEL');
      expect(result).toBe(fakeWorkbook);
    });

    it('si no recibe token, lo obtiene primero mediante retrieveJWT', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'VIGIFLOW_RENDER_AEFI_EXCEL_URL') return 'https://vigiflow.example.org/excel';
        return undefined;
      });
      mockHttpService.post.mockReturnValue(of({ data: { renderedDocument: 'BASE64EXCEL' } }));
      (xlsxModule.read as jest.Mock).mockReturnValueOnce({});

      const service = createService();
      jest.spyOn(service, 'retrieveJWT').mockResolvedValue({ jwt: 'token-obtenido' } as any);

      await service.retrieveExcelReport('20240101', '20240131', 'J07');

      expect(service.retrieveJWT).toHaveBeenCalled();
      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token-obtenido' }) }),
      );
    });

    it('envuelve el error como mensaje genérico cuando la petición HTTP falla con respuesta de error', async () => {
      const axiosError: any = { message: 'Bad Request', response: { data: { detail: 'inválido' }, status: 400 } };
      mockHttpService.post.mockReturnValue(throwError(() => axiosError));

      const service = createService();

      await expect(
        service.retrieveExcelReport('20240101', '20240131', 'J07', 'token-directo'),
      ).rejects.toThrow('Hubo un problema al generar el reporte de Excel');
    });

    it('envuelve el error como mensaje genérico cuando la petición HTTP falla sin respuesta (error de red)', async () => {
      const axiosError: any = { message: 'Network Error' };
      mockHttpService.post.mockReturnValue(throwError(() => axiosError));

      const service = createService();

      await expect(
        service.retrieveExcelReport('20240101', '20240131', 'J07', 'token-directo'),
      ).rejects.toThrow('Hubo un problema al generar el reporte de Excel');
    });
  });

  // ---------------------------------------------------------------------------------------
  describe('retrieveJsonReport', () => {
    it('camino feliz: usa el token recibido y retorna el workbook parseado', async () => {
      mockHttpService.post.mockReturnValue(of({ data: { renderedDocument: 'BASE64JSON' } }));
      const fakeWorkbook = { SheetNames: ['B'], Sheets: {} };
      (xlsxModule.read as jest.Mock).mockReturnValueOnce(fakeWorkbook);

      const service = createService();
      const retrieveJWTSpy = jest.spyOn(service, 'retrieveJWT');

      const result = await service.retrieveJsonReport('20240101', '20240131', 'J07', 'token-directo');

      expect(retrieveJWTSpy).not.toHaveBeenCalled();
      expect(result).toBe(fakeWorkbook);
    });

    it('propaga la HttpException (sin envolverla) cuando la petición HTTP falla', async () => {
      const axiosError: any = { message: 'Server Error', response: { data: { detail: 'falló' }, status: 500 } };
      mockHttpService.post.mockReturnValue(throwError(() => axiosError));

      const service = createService();

      await expect(
        service.retrieveJsonReport('20240101', '20240131', 'J07', 'token-directo'),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('propaga una HttpException de red (503) cuando la petición falla sin respuesta', async () => {
      const axiosError: any = { message: 'Network Error' };
      mockHttpService.post.mockReturnValue(throwError(() => axiosError));

      const service = createService();

      await expect(
        service.retrieveJsonReport('20240101', '20240131', 'J07', 'token-directo'),
      ).rejects.toMatchObject({ status: 503 });
    });
  });

  // ---------------------------------------------------------------------------------------
  describe('getPayload (privado)', () => {
    it('genera el payload JSON con el rango de fechas y el código ATC recibidos', () => {
      const service = createService();
      const raw = (service as any).getPayload('miQuery', '20240101', '20240131', 'J07');
      const payload = JSON.parse(raw);

      expect(payload.queryName).toBe('miQuery');
      expect(payload.dateRangeSearchIcsrsParameters[0]).toEqual(
        expect.objectContaining({ fromValue: '20240101', toValue: '20240131' }),
      );
      expect(payload.textSearchIcsrsParameters[0]).toEqual(expect.objectContaining({ value: 'J07' }));
      expect(typeof payload.printDate).toBe('string');
    });
  });

  // ---------------------------------------------------------------------------------------
  describe('sleep', () => {
    it('resuelve tras el tiempo indicado', async () => {
      const service = createService();
      await expect(service.sleep(1)).resolves.toBeUndefined();
    });
  });
});
