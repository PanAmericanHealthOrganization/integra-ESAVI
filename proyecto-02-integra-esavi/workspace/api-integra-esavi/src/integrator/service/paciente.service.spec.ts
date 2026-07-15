import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResolutorService } from 'src/homologator/service/resolutor.service';
import { PacienteService } from './paciente.service';
import { Paciente } from '../entity/paciente.entity';
import { CatalogoPadreService } from './catalogo-padre.service';

const mockPacienteRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
};

const mockCatalogoPadreService = {
  buscarSubcategoriaPorSimilitud: jest.fn(),
  findOne: jest.fn(),
};

const mockResolutorService = {
  resolver: jest.fn(),
};

const makePaciente = (overrides: Partial<Paciente> = {}): Paciente =>
  ({
    id: 'p1',
    codigoOrigen: 'EC-001',
    identificacion: 'OLD-ID',
    fechaNacimiento: new Date('2000-01-15'),
    isActive: true,
    ...overrides,
  } as Paciente);

describe('PacienteService', () => {
  let service: PacienteService;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Por defecto no hay regla de homologación configurada: el resolutor "no coincide"
    // y el flujo cae al match por similitud contra TC_CATALOGO_PADRE (comportamiento previo).
    mockResolutorService.resolver.mockResolvedValue({
      coincidio: false,
      valorOrigen: '',
      valorDestino: '',
      valorCasteado: '',
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PacienteService,
        { provide: getRepositoryToken(Paciente, 'POSTGRES_INTEGRATOR_DS'), useValue: mockPacienteRepo },
        { provide: CatalogoPadreService, useValue: mockCatalogoPadreService },
        { provide: ResolutorService, useValue: mockResolutorService },
      ],
    }).compile();
    service = module.get<PacienteService>(PacienteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findByCodigosOrigen ─────────────────────────────────────────────────

  describe('findByCodigosOrigen', () => {
    it('retorna mapa vacío para arreglo vacío (sin consultar BD)', async () => {
      const result = await service.findByCodigosOrigen([]);

      expect(result).toEqual(new Map());
      expect(mockPacienteRepo.find).not.toHaveBeenCalled();
    });

    it('consulta en bloque y devuelve mapa indexado por codigoOrigen', async () => {
      const p1 = makePaciente({ codigoOrigen: 'EC-001' });
      const p2 = makePaciente({ id: 'p2', codigoOrigen: 'EC-002' });
      mockPacienteRepo.find.mockResolvedValue([p1, p2]);

      const result = await service.findByCodigosOrigen(['EC-001', 'EC-002']);

      expect(mockPacienteRepo.find).toHaveBeenCalledTimes(1);
      expect(result.get('EC-001')).toEqual(p1);
      expect(result.get('EC-002')).toEqual(p2);
    });

    it('una sola consulta para N códigos (evita N+1)', async () => {
      mockPacienteRepo.find.mockResolvedValue([]);
      await service.findByCodigosOrigen(['A', 'B', 'C', 'D']);
      expect(mockPacienteRepo.find).toHaveBeenCalledTimes(1);
    });
  });

  // ─── createFromVigiflow - paciente existente (update path) ───────────────

  describe('createFromVigiflow - actualización de paciente existente', () => {
    it('actualiza identificacion cuando cambia y guarda', async () => {
      const existing = makePaciente({ identificacion: 'OLD-ID' });
      mockPacienteRepo.save.mockResolvedValue({ ...existing, identificacion: 'NEW-ID' });

      const result = await service.createFromVigiflow(
        { codigoVigiflow: 'EC-001', identificacion: 'NEW-ID' } as any,
        existing,
      );

      expect(mockPacienteRepo.save).toHaveBeenCalledTimes(1);
      expect(result.identificacion).toBe('NEW-ID');
    });

    it('guarda null cuando identificacion llega vacía/null (borra el campo)', async () => {
      const existing = makePaciente({ identificacion: 'CEDULA-123' });
      mockPacienteRepo.save.mockResolvedValue({ ...existing, identificacion: null });

      await service.createFromVigiflow(
        { codigoVigiflow: 'EC-001', identificacion: null } as any,
        existing,
      );

      expect(mockPacienteRepo.save).toHaveBeenCalledTimes(1);
      const savedArg: Paciente = mockPacienteRepo.save.mock.calls[0][0];
      expect(savedArg.identificacion).toBeNull();
    });

    it('actualiza fechaNacimiento cuando es diferente', async () => {
      const existing = makePaciente({ fechaNacimiento: new Date('2000-01-15') });
      const newDate = new Date('1990-06-20');
      mockPacienteRepo.save.mockResolvedValue({ ...existing, fechaNacimiento: newDate });

      await service.createFromVigiflow(
        { codigoVigiflow: 'EC-001', fechaNacimiento: newDate } as any,
        existing,
      );

      expect(mockPacienteRepo.save).toHaveBeenCalledTimes(1);
    });

    it('NO guarda cuando identificacion y fechaNacimiento no cambian', async () => {
      const existing = makePaciente({ identificacion: 'SAME-ID', fechaNacimiento: new Date('2000-01-15') });

      const result = await service.createFromVigiflow(
        { codigoVigiflow: 'EC-001', identificacion: 'SAME-ID', fechaNacimiento: new Date('2000-01-15') } as any,
        existing,
      );

      expect(mockPacienteRepo.save).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });

    it('usa el preloaded directamente sin consultar la BD', async () => {
      const existing = makePaciente({ identificacion: 'OLD' });
      mockPacienteRepo.save.mockResolvedValue({ ...existing, identificacion: 'NEW' });

      await service.createFromVigiflow(
        { codigoVigiflow: 'EC-001', identificacion: 'NEW' } as any,
        existing,
      );

      expect(mockPacienteRepo.findOne).not.toHaveBeenCalled();
    });

    it('también actualiza cuando identificacion estaba undefined en la entidad', async () => {
      const existing = makePaciente({ identificacion: undefined });
      mockPacienteRepo.save.mockResolvedValue({ ...existing, identificacion: 'NUEVA' });

      await service.createFromVigiflow(
        { codigoVigiflow: 'EC-001', identificacion: 'NUEVA' } as any,
        existing,
      );

      expect(mockPacienteRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  // ─── createFromVigiflow - nuevo paciente (create path) ───────────────────

  describe('createFromVigiflow - creación de nuevo paciente', () => {
    it('lanza error si codigoVigiflow está vacío', async () => {
      await expect(
        service.createFromVigiflow({ codigoVigiflow: '' } as any),
      ).rejects.toThrow('Vigiflow code is a mandatory field');
    });

    it('lanza error si codigoVigiflow es undefined', async () => {
      await expect(
        service.createFromVigiflow({ codigoVigiflow: undefined } as any),
      ).rejects.toThrow('Vigiflow code is a mandatory field');
    });

    it('crea un nuevo paciente cuando no existe en BD', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      const saved = makePaciente({ id: 'nuevo', codigoOrigen: 'EC-NUEVO' });
      mockPacienteRepo.save.mockResolvedValue(saved);

      const result = await service.createFromVigiflow({ codigoVigiflow: 'EC-NUEVO' } as any);

      expect(mockPacienteRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(saved);
    });

    it('busca sexo en catalogo_padre (GENERO) normalizando sinónimos VigiFlow', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud.mockResolvedValue({ id: 'cp1' });
      mockPacienteRepo.save.mockResolvedValue(makePaciente());

      await service.createFromVigiflow({ codigoVigiflow: 'EC-NEW', sexoPaciente: 'MASCULINO' } as any);

      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).toHaveBeenCalledWith('GENERO', 'HOMBRE');
    });

    it('resuelve sexo vía TR_HOMOLOGADOR (VIGIFLOW) cuando hay regla configurada, sin caer a similitud', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      mockResolutorService.resolver.mockResolvedValue({
        coincidio: true,
        valorOrigen: 'Femenino',
        valorDestino: 'cp-mujer-uuid',
        valorCasteado: 'cp-mujer-uuid',
      });
      mockCatalogoPadreService.findOne.mockResolvedValue({ id: 'cp-mujer-uuid', nombre: 'Mujer' });
      mockPacienteRepo.save.mockResolvedValue(makePaciente());

      await service.createFromVigiflow({ codigoVigiflow: 'EC-NEW', sexoPaciente: 'Femenino' } as any);

      expect(mockResolutorService.resolver).toHaveBeenCalledWith({
        entity: 'Paciente',
        field: 'sexo',
        sourceSystem: 'VIGIFLOW',
        sourceValue: 'Femenino',
      });
      expect(mockCatalogoPadreService.findOne).toHaveBeenCalledWith('cp-mujer-uuid');
      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).not.toHaveBeenCalled();
      const savedArg: Paciente = mockPacienteRepo.save.mock.calls[0][0];
      expect(savedArg.sexo).toEqual({ id: 'cp-mujer-uuid', nombre: 'Mujer' });
    });

    it('cae a similitud contra TC_CATALOGO_PADRE si la regla de homologación apunta a un catálogo inexistente', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      mockResolutorService.resolver.mockResolvedValue({
        coincidio: true,
        valorOrigen: 'Femenino',
        valorDestino: 'id-borrado',
        valorCasteado: 'id-borrado',
      });
      mockCatalogoPadreService.findOne.mockRejectedValue(new Error('not found'));
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud.mockResolvedValue({ id: 'cp1' });
      mockPacienteRepo.save.mockResolvedValue(makePaciente());

      await service.createFromVigiflow({ codigoVigiflow: 'EC-NEW', sexoPaciente: 'Femenino' } as any);

      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).toHaveBeenCalledWith('GENERO', 'MUJER');
    });

    it('busca etnia en catalogo_padre (ETNIA) homologando alias semánticos VigiFlow', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud.mockResolvedValue({ id: 'cp2' });
      mockPacienteRepo.save.mockResolvedValue(makePaciente());

      await service.createFromVigiflow({
        codigoVigiflow: 'EC-NEW',
        autoIdentificacionPaciente: 'Afroecuatoriano',
      } as any);

      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).toHaveBeenCalledWith(
        'ETNIA',
        'AFRODESCENDIENTE',
      );
    });

    it('busca etnia en catalogo_padre (ETNIA) resolviendo el sufijo "/A" de VigiFlow', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud.mockResolvedValue({ id: 'cp3' });
      mockPacienteRepo.save.mockResolvedValue(makePaciente());

      await service.createFromVigiflow({
        codigoVigiflow: 'EC-NEW',
        autoIdentificacionPaciente: 'NEGRO/A',
      } as any);

      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).toHaveBeenCalledWith('ETNIA', 'NEGRO/A');
    });

    it('registra advertencia y deja etnia sin asignar cuando no hay coincidencia en catalogo_padre', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud.mockResolvedValue(null);
      mockPacienteRepo.save.mockResolvedValue(makePaciente());

      const result = await service.createFromVigiflow({
        codigoVigiflow: 'EC-NEW',
        autoIdentificacionPaciente: 'Desconocido',
      } as any);

      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).toHaveBeenCalledWith(
        'ETNIA',
        'Desconocido',
      );
      expect(result).toBeDefined();
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('retorna paciente cuando existe', async () => {
      const p = makePaciente();
      mockPacienteRepo.findOne.mockResolvedValue(p);
      const result = await service.findOne('p1');
      expect(result).toEqual(p);
    });

    it('lanza EntityNotFoundException cuando no existe', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('NOEXISTE')).rejects.toThrow();
    });
  });
});
