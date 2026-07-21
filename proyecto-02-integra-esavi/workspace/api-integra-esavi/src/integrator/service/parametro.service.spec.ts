import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ParametroService } from './parametro.service';
import { Parametro } from '../entity/parametro.entity';
import { encryptValue } from '../utils/parametro-crypto.util';

// Llave de 32 bytes en hexadecimal (64 caracteres) requerida por parametro-crypto.util.
process.env.PROD_ENCRYPTION_KEY = 'a'.repeat(64);

const mockParametroRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  merge: jest.fn(),
};

describe('ParametroService', () => {
  let service: ParametroService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParametroService,
        { provide: getRepositoryToken(Parametro, 'POSTGRES_INTEGRATOR_DS'), useValue: mockParametroRepo },
      ],
    }).compile();
    service = module.get<ParametroService>(ParametroService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getValor', () => {
    it('retorna el valor sin desencriptar cuando es_encriptado es false', async () => {
      mockParametroRepo.findOne.mockResolvedValue({
        modulo: 'DHIS2',
        clave: 'URL',
        valor: 'https://dhis2.example.com',
        es_encriptado: false,
        isEnabled: true,
      });

      const result = await service.getValor('DHIS2', 'URL');

      expect(result).toBe('https://dhis2.example.com');
    });

    it('desencripta el valor cuando es_encriptado es true', async () => {
      const secreto = 'super-secreto';
      mockParametroRepo.findOne.mockResolvedValue({
        modulo: 'DHIS2',
        clave: 'PASSWORD',
        valor: encryptValue(secreto),
        es_encriptado: true,
        isEnabled: true,
      });

      const result = await service.getValor('DHIS2', 'PASSWORD');

      expect(result).toBe(secreto);
    });

    it('usa el cache en llamadas subsecuentes sin volver a consultar la BD', async () => {
      mockParametroRepo.findOne.mockResolvedValue({
        modulo: 'DHIS2',
        clave: 'URL',
        valor: 'https://dhis2.example.com',
        es_encriptado: false,
        isEnabled: true,
      });

      await service.getValor('DHIS2', 'URL');
      await service.getValor('DHIS2', 'URL');

      expect(mockParametroRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('lanza error si el parámetro no existe', async () => {
      mockParametroRepo.findOne.mockResolvedValue(null);
      await expect(service.getValor('DHIS2', 'NOEXISTE')).rejects.toThrow(
        'No se encontró el parámetro "NOEXISTE" del módulo "DHIS2"',
      );
    });
  });

  describe('create', () => {
    it('crea un parámetro nuevo sin encriptar', async () => {
      mockParametroRepo.findOne.mockResolvedValue(null);
      mockParametroRepo.save.mockImplementation((p) => Promise.resolve({ ...p, id: 'p1' }));

      const result = await service.create(
        { clave: 'NUEVA', valor: 'valor1', es_encriptado: false } as any,
        'tester',
      );

      expect(result.valor).toBe('valor1');
      expect(result.id).toBe('p1');
    });

    it('encripta el valor antes de guardar cuando es_encriptado es true', async () => {
      mockParametroRepo.findOne.mockResolvedValue(null);
      mockParametroRepo.save.mockImplementation((p) => Promise.resolve({ ...p, id: 'p2' }));

      const result = await service.create(
        { clave: 'SECRETA', valor: 'plano', es_encriptado: true } as any,
        'tester',
      );

      const savedArg = mockParametroRepo.save.mock.calls[0][0];
      expect(savedArg.valor).not.toBe('plano');
      expect(result.valor).toBe('plano');
    });

    it('lanza error si ya existe un parámetro con la misma clave', async () => {
      mockParametroRepo.findOne.mockResolvedValue({ id: 'existing', clave: 'DUP' });

      await expect(
        service.create({ clave: 'DUP', valor: 'x' } as any, 'tester'),
      ).rejects.toThrow('Ya existe un parámetro con la clave: DUP');
    });
  });

  describe('delete', () => {
    it('deshabilita el parámetro', async () => {
      mockParametroRepo.findOne.mockResolvedValue({
        id: 'p1',
        clave: 'X',
        valor: 'v',
        es_encriptado: false,
        isEnabled: true,
      });
      mockParametroRepo.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.delete('p1', 'tester');

      expect(result.isEnabled).toBe(false);
      expect(result.deletedBy).toBe('tester');
    });
  });

  describe('findAll', () => {
    it('retorna todos los parámetros habilitados desencriptados', async () => {
      mockParametroRepo.find.mockResolvedValue([
        { id: 'p1', valor: 'plano', es_encriptado: false },
        { id: 'p2', valor: encryptValue('secreto2'), es_encriptado: true },
      ]);

      const result = await service.findAll();

      expect(result[0].valor).toBe('plano');
      expect(result[1].valor).toBe('secreto2');
    });
  });

  describe('findOne', () => {
    it('retorna el parámetro desencriptado si existe', async () => {
      mockParametroRepo.findOne.mockResolvedValue({
        id: 'p1',
        valor: 'plano',
        es_encriptado: false,
        isEnabled: true,
      });
      const result = await service.findOne('p1');
      expect(result.valor).toBe('plano');
    });

    it('lanza error si no existe', async () => {
      mockParametroRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('NOEXISTE')).rejects.toThrow('Parámetro no encontrado');
    });
  });

  describe('update', () => {
    it('actualiza el parámetro y limpia el cache', async () => {
      mockParametroRepo.findOne.mockResolvedValue({
        id: 'p1',
        clave: 'X',
        valor: 'viejo',
        es_encriptado: false,
        isEnabled: true,
      });
      mockParametroRepo.merge.mockImplementation((p, dto) => Object.assign(p, dto));
      mockParametroRepo.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.update('p1', { valor: 'nuevo' } as any, 'tester');

      expect(result.valor).toBe('nuevo');
      expect(result.updatedBy).toBe('tester');
    });
  });

  describe('findByKey', () => {
    it('busca por clave', async () => {
      mockParametroRepo.findOne.mockResolvedValue({ id: 'p1', clave: 'X' });
      const result = await service.findByKey('X');
      expect(mockParametroRepo.findOne).toHaveBeenCalledWith({ where: { clave: 'X' } });
      expect(result).toEqual({ id: 'p1', clave: 'X' });
    });
  });
});
