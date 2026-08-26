import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { ParametroService } from 'src/integrator/service/parametro.service';
import { MeddraHistoryService } from 'src/meddra/services/meddra-history.service';
import { MeddraClientService } from 'src/meddra/services/meddra-client.service';

describe('MeddraClientService', () => {
  let service: MeddraClientService;
  let httpService: jest.Mocked<HttpService>;
  let meddraHistoryService: jest.Mocked<MeddraHistoryService>;
  let parametroService: jest.Mocked<ParametroService>;

  const parametrosPorClave: Record<string, string> = {
    MED_GRANT_TYPE: 'password',
    MED_CLIENT_ID: 'client-1',
    MED_USER_NAME: 'user-1',
    MED_SCOPE: 'scope-1',
    MED_PASSWORD: 'secret',
    MED_URL_TOKEN: 'https://meddra.test/token',
    MED_URL_API: 'https://meddra.test/api',
  };

  const query: any = { searchterms: [{ searchterm: 'headache' }] };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeddraClientService,
        { provide: ConfigService, useValue: {} },
        { provide: MeddraHistoryService, useValue: { getFromHistory: jest.fn(), save: jest.fn() } },
        { provide: HttpService, useValue: { post: jest.fn() } },
        {
          provide: ParametroService,
          useValue: {
            getValor: jest.fn((modulo: string, clave: string) => Promise.resolve(parametrosPorClave[clave])),
          },
        },
      ],
    }).compile();

    service = module.get<MeddraClientService>(MeddraClientService);
    httpService = module.get(HttpService);
    meddraHistoryService = module.get(MeddraHistoryService);
    parametroService = module.get(ParametroService);
    meddraHistoryService.save.mockResolvedValue(undefined as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getQuery ────────────────────────────────────────────────────────────

  describe('getQuery', () => {
    it('retorna la respuesta desde el historial si ya existe, sin llamar al servicio HTTP', async () => {
      meddraHistoryService.getFromHistory.mockResolvedValue({
        response: JSON.stringify({ resultado: 'desde-historial' }),
      } as any);

      const result = await service.getQuery(query);

      expect(result).toEqual({ resultado: 'desde-historial' });
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('cuando no hay historial, obtiene el token y realiza la petición a MedDRA', async () => {
      meddraHistoryService.getFromHistory.mockResolvedValue(null);
      httpService.post
        .mockReturnValueOnce(of({ data: { access_token: 'tok-123' } } as any))
        .mockReturnValueOnce(of({ data: { resultado: 'desde-servicio' } } as any));

      const result = await service.getQuery(query);

      expect(result).toEqual({ resultado: 'desde-servicio' });
      expect(parametroService.getValor).toHaveBeenCalledWith('MEDDRA', 'MED_URL_TOKEN');
      expect(parametroService.getValor).toHaveBeenCalledWith('MEDDRA', 'MED_URL_API');
      expect(httpService.post).toHaveBeenNthCalledWith(
        1,
        'https://meddra.test/token',
        expect.any(URLSearchParams),
        expect.objectContaining({ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }),
      );
      expect(httpService.post).toHaveBeenNthCalledWith(
        2,
        'https://meddra.test/api/',
        query,
        expect.objectContaining({ headers: { Authorization: 'Bearer tok-123' } }),
      );
    });

    it('tras una petición exitosa, guarda la consulta en el historial (fire-and-forget)', async () => {
      meddraHistoryService.getFromHistory.mockResolvedValue(null);
      meddraHistoryService.save.mockResolvedValue(undefined as any);
      httpService.post
        .mockReturnValueOnce(of({ data: { access_token: 'tok-123' } } as any))
        .mockReturnValueOnce(of({ data: { resultado: 'ok' } } as any));

      await service.getQuery(query);
      // Esperar a que se resuelva la promesa fire-and-forget dentro de doRequest
      await Promise.resolve();

      expect(meddraHistoryService.save).toHaveBeenCalledWith(query, { resultado: 'ok' });
    });

    it('lanza UnauthorizedException cuando la obtención del token responde 400', async () => {
      meddraHistoryService.getFromHistory.mockResolvedValue(null);
      httpService.post.mockReturnValueOnce(throwError(() => ({ response: { status: 400 } })));

      await expect(service.getQuery(query)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lanza un Error genérico cuando la obtención del token falla con otro status', async () => {
      meddraHistoryService.getFromHistory.mockResolvedValue(null);
      httpService.post.mockReturnValueOnce(throwError(() => ({ response: { status: 500 } })));

      await expect(service.getQuery(query)).rejects.toThrow();
    });

    it('lanza UnauthorizedException cuando la petición a MedDRA responde 400', async () => {
      meddraHistoryService.getFromHistory.mockResolvedValue(null);
      httpService.post
        .mockReturnValueOnce(of({ data: { access_token: 'tok-123' } } as any))
        .mockReturnValueOnce(throwError(() => ({ response: { status: 400 } })));

      await expect(service.getQuery(query)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  // ─── getHistory ──────────────────────────────────────────────────────────

  describe('getHistory', () => {
    it('delega en meddraHistoryService.getFromHistory', async () => {
      const record = { id: 1 } as any;
      meddraHistoryService.getFromHistory.mockResolvedValue(record);

      const result = await service.getHistory('headache');

      expect(meddraHistoryService.getFromHistory).toHaveBeenCalledWith('headache');
      expect(result).toEqual(record);
    });
  });
});
