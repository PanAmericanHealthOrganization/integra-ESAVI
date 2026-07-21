import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { PacienteVigiflowService } from './paciente-vigiflow.service';
import { Paciente } from '../entity/paciente.entity';
import { CatalogoPadreService } from './catalogo-padre.service';

const mockPacienteRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  merge: jest.fn(),
};

const mockCatalogoPadreService = {
  buscarSubcategoriaPorSimilitud: jest.fn(),
};

const makeQueryFailedError = (overrides: Record<string, any>) => {
  const err = new QueryFailedError('query', [], new Error('driver error') as any);
  (err as any).driverError = overrides;
  return err;
};

describe('PacienteVigiflowService', () => {
  let service: PacienteVigiflowService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PacienteVigiflowService,
        { provide: getRepositoryToken(Paciente, 'POSTGRES_INTEGRATOR_DS'), useValue: mockPacienteRepo },
        { provide: CatalogoPadreService, useValue: mockCatalogoPadreService },
      ],
    }).compile();
    service = module.get<PacienteVigiflowService>(PacienteVigiflowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('lanza error si el código vigiflow es vacío', async () => {
      await expect(service.create({ codigoVigiflow: '' } as any)).rejects.toThrow(
        'Vigiflow code is a mandatory field',
      );
    });

    it('retorna el paciente existente si ya existe por codigoOrigen', async () => {
      const existing = { id: 'p1', codigoOrigen: 'EC-001' };
      mockPacienteRepo.findOne.mockResolvedValue(existing);

      const result = await service.create({ codigoVigiflow: 'EC-001' } as any);

      expect(result).toEqual(existing);
      expect(mockPacienteRepo.save).not.toHaveBeenCalled();
    });

    it('crea un paciente nuevo homologando sexo y etnia', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud.mockResolvedValue({ id: 'cp1' });
      mockPacienteRepo.save.mockResolvedValue({ id: 'nuevo' });

      const result = await service.create({
        codigoVigiflow: 'EC-NUEVO',
        sexoPaciente: 'Femenino',
        autoIdentificacionPaciente: 'NEGRO/A',
      } as any);

      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).toHaveBeenCalledWith('GENERO', 'MUJER');
      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).toHaveBeenCalledWith('ETNIA', 'NEGRO/A');
      expect(result).toEqual({ id: 'nuevo' });
    });

    it('crea un paciente nuevo sin sexo ni etnia', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      mockPacienteRepo.save.mockResolvedValue({ id: 'nuevo2' });

      await service.create({ codigoVigiflow: 'EC-002' } as any);

      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).not.toHaveBeenCalled();
    });

    it('reutiliza el paciente existente si el guardado falla por duplicado (código de error 23505)', async () => {
      mockPacienteRepo.findOne.mockResolvedValueOnce(null);
      const duplicateErr = makeQueryFailedError({ code: '23505' });
      mockPacienteRepo.save.mockRejectedValue(duplicateErr);
      const existing = { id: 'p1', codigoOrigen: 'EC-DUP' };
      mockPacienteRepo.findOne.mockResolvedValueOnce(existing);

      const result = await service.create({ codigoVigiflow: 'EC-DUP' } as any);

      expect(result).toEqual(existing);
    });

    it('reutiliza el paciente existente si el guardado falla por el constraint nombrado', async () => {
      mockPacienteRepo.findOne.mockResolvedValueOnce(null);
      const duplicateErr = makeQueryFailedError({ constraint: 'UQ_4ff577c8ff2c90720f455400a92' });
      mockPacienteRepo.save.mockRejectedValue(duplicateErr);
      const existing = { id: 'p1', codigoOrigen: 'EC-DUP2' };
      mockPacienteRepo.findOne.mockResolvedValueOnce(existing);

      const result = await service.create({ codigoVigiflow: 'EC-DUP2' } as any);

      expect(result).toEqual(existing);
    });

    it('relanza el error de duplicado si tras el conflicto no se encuentra el paciente existente', async () => {
      mockPacienteRepo.findOne.mockResolvedValueOnce(null);
      const duplicateErr = makeQueryFailedError({ code: '23505' });
      mockPacienteRepo.save.mockRejectedValue(duplicateErr);
      mockPacienteRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.create({ codigoVigiflow: 'EC-DUP3' } as any)).rejects.toThrow();
    });

    it('relanza errores que no son de duplicado', async () => {
      mockPacienteRepo.findOne.mockResolvedValueOnce(null);
      mockPacienteRepo.save.mockRejectedValue(new Error('otro error de BD'));

      await expect(service.create({ codigoVigiflow: 'EC-OTRO' } as any)).rejects.toThrow(
        'otro error de BD',
      );
    });
  });

  describe('delete', () => {
    it('retorna undefined (no implementado)', async () => {
      const result = await service.delete('p1');
      expect(result).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('busca pacientes activos', async () => {
      mockPacienteRepo.find.mockResolvedValue([{ id: 'p1' }]);
      const result = await service.findAll();
      expect(mockPacienteRepo.find).toHaveBeenCalledWith({ where: { isActive: true } });
      expect(result).toEqual([{ id: 'p1' }]);
    });
  });

  describe('findOne', () => {
    it('retorna el paciente si existe', async () => {
      mockPacienteRepo.findOne.mockResolvedValue({ id: 'p1' });
      const result = await service.findOne('p1');
      expect(result).toEqual({ id: 'p1' });
    });

    it('lanza error si no existe', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('NOEXISTE')).rejects.toThrow('Paciente NOEXISTE is not found');
    });
  });

  describe('findByCodigoOrigen', () => {
    it('retorna el paciente encontrado', async () => {
      mockPacienteRepo.findOne.mockResolvedValue({ id: 'p1', codigoOrigen: 'EC-001' });
      const result = await service.findByCodigoOrigen(' EC-001 ');
      expect(mockPacienteRepo.findOne).toHaveBeenCalledWith({ where: { codigoOrigen: 'EC-001' } });
      expect(result).toEqual({ id: 'p1', codigoOrigen: 'EC-001' });
    });

    it('retorna null si no existe', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      const result = await service.findByCodigoOrigen('NOEXISTE');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('actualiza sexo y etnia homologados y guarda', async () => {
      const paciente = { id: 'p1' };
      mockPacienteRepo.findOne.mockResolvedValue(paciente);
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud
        .mockResolvedValueOnce({ id: 'cp-sexo' })
        .mockResolvedValueOnce({ id: 'cp-etnia' });
      mockPacienteRepo.merge.mockImplementation((p, dto) => Object.assign(p, dto));
      mockPacienteRepo.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.update('p1', {
        sexoPaciente: 'MASCULINO',
        autoIdentificacionPaciente: 'Indigenous',
      } as any);

      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).toHaveBeenNthCalledWith(1, 'GENERO', 'HOMBRE');
      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).toHaveBeenNthCalledWith(2, 'ETNIA', 'INDIGENA');
      expect(result.sexo).toEqual({ id: 'cp-sexo' });
      expect(result.autoIdentificacion).toEqual({ id: 'cp-etnia' });
    });
  });
});
