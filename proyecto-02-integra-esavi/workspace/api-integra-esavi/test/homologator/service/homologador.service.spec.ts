import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { HomologadorService } from 'src/homologator/service/homologador.service';
import { Homologador } from 'src/homologator/entity/homologador.entity';
import { TipoDato } from 'src/homologator/enum/tipo-dato.enum';

const mockRepository = {
  exist: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const UUID_1 = '11111111-1111-4111-8111-111111111111';
const UUID_2 = '22222222-2222-4222-8222-222222222222';

const makeHomologador = (overrides: Partial<Homologador> = {}): Homologador =>
  ({
    id: UUID_1,
    entity: 'Paciente',
    field: 'sexo',
    description: 'Homologación de sexo',
    targetType: TipoDato.STRING,
    ...overrides,
  } as Homologador);

describe('HomologadorService', () => {
  let service: HomologadorService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomologadorService,
        { provide: getRepositoryToken(Homologador, 'POSTGRES_INTEGRATOR_DS'), useValue: mockRepository },
      ],
    }).compile();
    service = module.get<HomologadorService>(HomologadorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── validarId (a través de los métodos públicos) ────────────────────────

  describe('validación de ID (UUID)', () => {
    it('lanza BadRequestException cuando el id no es un UUID válido', async () => {
      await expect(service.existe('no-es-un-uuid')).rejects.toThrow(BadRequestException);
      expect(mockRepository.exist).not.toHaveBeenCalled();
    });

    it('acepta un UUID válido con espacios y lo normaliza', async () => {
      mockRepository.exist.mockResolvedValue(true);
      const result = await service.existe(`  ${UUID_1}  `);
      expect(result).toBe(true);
      expect(mockRepository.exist).toHaveBeenCalledWith({ where: { id: UUID_1 } });
    });
  });

  // ─── obtenerUno ───────────────────────────────────────────────────────────

  describe('obtenerUno', () => {
    it('retorna el homologador cuando existe', async () => {
      const h = makeHomologador();
      mockRepository.findOne.mockResolvedValue(h);
      const result = await service.obtenerUno(UUID_1);
      expect(result).toEqual(h);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.obtenerUno(UUID_1)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── obtenerVarios ────────────────────────────────────────────────────────

  describe('obtenerVarios', () => {
    it('valida cada id y consulta con In(...)', async () => {
      const lista = [makeHomologador(), makeHomologador({ id: UUID_2 })];
      mockRepository.find.mockResolvedValue(lista);

      const result = await service.obtenerVarios({ ids: [UUID_1, UUID_2] } as any);

      expect(result).toEqual(lista);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it('lanza BadRequestException si alguno de los ids no es válido', async () => {
      await expect(service.obtenerVarios({ ids: [UUID_1, 'invalido'] } as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.find).not.toHaveBeenCalled();
    });
  });

  // ─── obtenerPaginado ────────────────────────────────────────────────────

  describe('obtenerPaginado', () => {
    it('aplica filtros por entity/field/description y orden por defecto (createdAt DESC)', async () => {
      mockRepository.findAndCount.mockResolvedValue([[makeHomologador()], 1]);

      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'noOrdenable', order: 'DESC' },
        filter: { entity: 'Paciente', field: 'sexo', description: 'Homolog' },
      } as any;

      const result = await service.obtenerPaginado(params);

      expect(result.total).toBe(1);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          order: { createdAt: 'DESC' },
        }),
      );
    });

    it('usa el campo de orden solicitado cuando es ordenable y dirección ASC', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      const params = {
        pagination: { page: 2, perPage: 5 },
        sort: { field: 'entity', order: 'ASC' },
        filter: {},
      } as any;

      await service.obtenerPaginado(params);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
          order: { entity: 'ASC' },
        }),
      );
    });
  });

  // ─── crear ────────────────────────────────────────────────────────────────

  describe('crear', () => {
    it('crea un nuevo homologador cuando no existe duplicado por entity/field', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const dto = { entity: 'Paciente', field: 'sexo', createdBy: 'tester' } as any;
      const creado = makeHomologador();
      mockRepository.create.mockReturnValue(creado);
      mockRepository.save.mockResolvedValue(creado);

      const result = await service.crear(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ entity: 'Paciente', field: 'sexo', updatedBy: 'tester' }),
      );
      expect(result).toEqual(creado);
    });

    it('lanza ConflictException si ya existe un homologador con la misma entity/field', async () => {
      mockRepository.findOne.mockResolvedValue(makeHomologador());
      const dto = { entity: 'Paciente', field: 'sexo', createdBy: 'tester' } as any;

      await expect(service.crear(dto)).rejects.toThrow(ConflictException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  // ─── actualizar ─────────────────────────────────────────────────────────

  describe('actualizar', () => {
    it('actualiza y retorna el homologador actualizado', async () => {
      const actualizado = makeHomologador({ description: 'nueva descripcion' });
      mockRepository.findOne.mockResolvedValue(actualizado);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.actualizar(UUID_1, { description: 'nueva descripcion' } as any);

      expect(mockRepository.update).toHaveBeenCalledWith(
        UUID_1,
        expect.objectContaining({ description: 'nueva descripcion' }),
      );
      expect(result).toEqual(actualizado);
    });

    it('lanza NotFoundException si el registro a actualizar no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.actualizar(UUID_1, {} as any)).rejects.toThrow(NotFoundException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  // ─── eliminar ───────────────────────────────────────────────────────────

  describe('eliminar', () => {
    it('marca el registro como inactivo/eliminado usando el usuario de auditoría provisto', async () => {
      mockRepository.findOne.mockResolvedValue(makeHomologador());
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.eliminar(UUID_1, { deletedBy: 'usuario-x' });

      expect(mockRepository.update).toHaveBeenCalledWith(
        UUID_1,
        expect.objectContaining({ isActive: false, isEnabled: false, deletedBy: 'usuario-x' }),
      );
    });

    it('usa "SYSTEM" como deletedBy cuando no se provee auditData', async () => {
      mockRepository.findOne.mockResolvedValue(makeHomologador());
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.eliminar(UUID_1, undefined);

      expect(mockRepository.update).toHaveBeenCalledWith(
        UUID_1,
        expect.objectContaining({ deletedBy: 'SYSTEM' }),
      );
    });
  });
});
