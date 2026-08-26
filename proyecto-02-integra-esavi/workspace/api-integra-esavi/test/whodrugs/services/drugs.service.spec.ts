import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Drug } from 'src/whodrugs/models/drug.entity';
import { DrugService } from 'src/whodrugs/services/drugs.service';

describe('DrugService.getDrugsPaginated', () => {
  let service: DrugService;
  let drugRepository: any;

  /** 25 medicamentos: VACUNA-00 … VACUNA-24. */
  const catalogo = Array.from({ length: 25 }, (_, i) => ({
    id: `id-${i}`,
    drugName: `VACUNA-${String(i).padStart(2, '0')}`,
    drugCode: `COD-${i}`,
  }));

  beforeEach(async () => {
    drugRepository = { find: jest.fn().mockResolvedValue(catalogo.map((d) => ({ ...d }))) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DrugService, { provide: getRepositoryToken(Drug, 'WHO_DRUG'), useValue: drugRepository }],
    }).compile();

    service = module.get<DrugService>(DrugService);
  });

  it('devuelve la primera página completa', async () => {
    const resultado = await service.getDrugsPaginated({ page: 0, size: 10 } as any, null, null, 'EC', null);

    expect(resultado.data).toHaveLength(10);
    expect(resultado.data[0].drugName).toBe('VACUNA-00');
    expect(resultado.data[9].drugName).toBe('VACUNA-09');
  });

  it('devuelve la segunda página en vez de una lista vacía', async () => {
    // El bug: slice(page * size, size) -> slice(10, 10) = [] para cualquier página > 0.
    const resultado = await service.getDrugsPaginated({ page: 1, size: 10 } as any, null, null, 'EC', null);

    expect(resultado.data).toHaveLength(10);
    expect(resultado.data[0].drugName).toBe('VACUNA-10');
    expect(resultado.data[9].drugName).toBe('VACUNA-19');
  });

  it('la última página devuelve solo el remanente', async () => {
    const resultado = await service.getDrugsPaginated({ page: 2, size: 10 } as any, null, null, 'EC', null);

    expect(resultado.data).toHaveLength(5);
    expect(resultado.data[0].drugName).toBe('VACUNA-20');
  });

  it('una página fuera de rango devuelve vacío pero conserva el total', async () => {
    const resultado = await service.getDrugsPaginated({ page: 99, size: 10 } as any, null, null, 'EC', null);

    expect(resultado.data).toHaveLength(0);
    expect(resultado.total).toBe(25);
  });

  it('el total es el universo filtrado, no el tamaño de la página', async () => {
    const resultado = await service.getDrugsPaginated({ page: 0, size: 10 } as any, null, null, 'EC', null);

    expect(resultado.total).toBe(25);
  });

  it('el total refleja el filtro por nombre, no el catálogo completo', async () => {
    // "VACUNA-1" coincide con VACUNA-10 … VACUNA-19: 10 registros de los 25.
    const resultado = await service.getDrugsPaginated({ page: 0, size: 5 } as any, 'VACUNA-1', null, 'EC', null);

    expect(resultado.total).toBe(10);
    expect(resultado.data).toHaveLength(5);
    expect(resultado.data[0].drugName).toBe('VACUNA-10');
  });
});
