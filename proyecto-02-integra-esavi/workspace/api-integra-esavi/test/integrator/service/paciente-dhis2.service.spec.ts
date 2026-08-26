import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PacienteDhis2Service } from 'src/integrator/service/paciente-dhis2.service';
import { Paciente } from 'src/integrator/entity/paciente.entity';
import { CatalogoPadreService } from 'src/integrator/service/catalogo-padre.service';

const mockPacienteRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
};

const mockCatalogoPadreService = {
  buscarSubcategoriaPorSimilitud: jest.fn(),
};

describe('PacienteDhis2Service', () => {
  let service: PacienteDhis2Service;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PacienteDhis2Service,
        { provide: getRepositoryToken(Paciente, 'POSTGRES_INTEGRATOR_DS'), useValue: mockPacienteRepo },
        { provide: CatalogoPadreService, useValue: mockCatalogoPadreService },
      ],
    }).compile();
    service = module.get<PacienteDhis2Service>(PacienteDhis2Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('actualiza el paciente existente cuando ya existe por codigoDhis2', async () => {
      const existing = { id: 'p1', codigoOrigen: 'EC-001' };
      mockPacienteRepo.findOne.mockResolvedValue(existing);
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud.mockResolvedValue({ id: 'cp1' });
      mockPacienteRepo.update.mockResolvedValue(undefined);
      // update() llama internamente a findByCodigoOrigen -> findOne otra vez
      mockPacienteRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValue(existing);

      const result = await service.create({
        codigoDhis2: 'EC-001',
        sexoPaciente: 'MASCULINO',
      } as any);

      expect(mockPacienteRepo.update).toHaveBeenCalled();
      expect(result).toEqual(existing);
    });

    it('crea un paciente nuevo cuando no existe, homologando sexo y etnia', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud.mockResolvedValue({ id: 'cp1' });
      mockPacienteRepo.create.mockImplementation((p) => p);
      mockPacienteRepo.save.mockResolvedValue({ id: 'nuevo' });

      const result = await service.create({
        codigoDhis2: ' EC-NUEVO ',
        sexoPaciente: 'MASCULINO',
        autoIdentificacionPaciente: 'Afroecuatoriano',
      } as any);

      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).toHaveBeenCalledWith('GENERO', 'HOMBRE');
      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).toHaveBeenCalledWith(
        'ETNIA',
        'AFRODESCENDIENTE',
      );
      expect(result).toEqual({ id: 'nuevo' });
    });

    it('crea un paciente nuevo sin sexo ni etnia', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      mockPacienteRepo.create.mockImplementation((p) => p);
      mockPacienteRepo.save.mockResolvedValue({ id: 'nuevo2' });

      await service.create({ codigoDhis2: 'EC-002' } as any);

      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).not.toHaveBeenCalled();
    });

    it('propaga un error genérico cuando falla el guardado', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      mockPacienteRepo.create.mockImplementation((p) => p);
      mockPacienteRepo.save.mockRejectedValue(new Error('DB down'));

      await expect(service.create({ codigoDhis2: 'EC-003' } as any)).rejects.toThrow(
        'Hubo un problema al crear o actualizar el paciente',
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
    it('retorna el paciente si existe y está activo', async () => {
      mockPacienteRepo.findOne.mockResolvedValue({ id: 'p1' });
      const result = await service.findOne('p1');
      expect(result).toEqual({ id: 'p1' });
    });

    it('lanza error si no existe', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('NOEXISTE')).rejects.toThrow('Paciente NOEXISTE is not found');
    });
  });

  describe('update', () => {
    it('lanza error si no se define sexoPaciente', async () => {
      await expect(service.update('p1', {} as any)).rejects.toThrow('Sexo del paciente no definido');
    });

    it('actualiza el sexo del paciente y retorna el paciente por codigoOrigen', async () => {
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud.mockResolvedValue({ id: 'cp-mujer' });
      mockPacienteRepo.findOne
        .mockResolvedValueOnce({ id: 'p1', isActive: true }) // findOne('p1')
        .mockResolvedValueOnce({ id: 'p1', codigoOrigen: 'p1', sexo: { id: 'cp-mujer' } }); // findByCodigoOrigen
      mockPacienteRepo.update.mockResolvedValue(undefined);

      const result = await service.update('p1', { sexoPaciente: 'FEMENINO' } as any);

      expect(mockPacienteRepo.update).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ sexo: { id: 'cp-mujer' } }),
      );
      expect(result).toEqual({ id: 'p1', codigoOrigen: 'p1', sexo: { id: 'cp-mujer' } });
    });

    it('propaga el error si el paciente no existe', async () => {
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud.mockResolvedValue({ id: 'cp1' });
      mockPacienteRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('NOEXISTE', { sexoPaciente: 'MASCULINO' } as any),
      ).rejects.toThrow('Paciente NOEXISTE is not found');
    });
  });

  describe('findByCodigoOrigen', () => {
    it('retorna el paciente encontrado', async () => {
      mockPacienteRepo.findOne.mockResolvedValue({ id: 'p1', codigoOrigen: 'EC-001' });
      const result = await service.findByCodigoOrigen('EC-001');
      expect(result).toEqual({ id: 'p1', codigoOrigen: 'EC-001' });
    });

    it('retorna null si no existe', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      const result = await service.findByCodigoOrigen('NOEXISTE');
      expect(result).toBeNull();
    });
  });
});
