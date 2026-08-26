import { utils, WorkBook } from 'xlsx';
import { VigiflowIntegradorService } from 'src/vigiflow-integrator/service/vigiflow-integrador.service';

/**
 * Pruebas de la extracción de pacientes con vacuna J07 desde la hoja "Medicamentos"
 * (hoja índice [2] del reporte dos). El método es privado y no depende del estado de
 * la instancia, por lo que se invoca directamente sobre el prototipo.
 */
describe('VigiflowIntegradorService.extraerPacientesConVacunaJ07', () => {
  const extraer = (workbook: WorkBook): Set<string> =>
    (VigiflowIntegradorService.prototype as any).extraerPacientesConVacunaJ07.call({}, workbook);

  /**
   * Construye un libro con 3 hojas donde la tercera es "Medicamentos".
   * Cada fila: [códigoPaciente(colA), ..., códigoAtc(colG)].
   */
  const crearWorkbook = (filas: Array<{ codigo: string; atc: string }>): WorkBook => {
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, utils.aoa_to_sheet([['hoja AEFI']]), 'AEFI');
    utils.book_append_sheet(workbook, utils.aoa_to_sheet([['hoja intermedia']]), 'Otra');
    const aoa = [
      ['Número de identificación único mundial', 'B', 'C', 'D', 'E', 'F', 'Código(s) ATC'],
      ...filas.map((f) => [f.codigo, '', '', '', '', '', f.atc]),
    ];
    utils.book_append_sheet(workbook, utils.aoa_to_sheet(aoa), 'Medicamentos');
    return workbook;
  };

  it('debe incluir a los pacientes cuya fila tiene un código ATC de vacuna J07', () => {
    const workbook = crearWorkbook([
      { codigo: 'EC-2024-001', atc: 'J07BX03' },
      { codigo: 'EC-2024-002', atc: 'N02BE01' },
    ]);

    const codigos = extraer(workbook);

    expect(codigos.has('EC-2024-001')).toBe(true);
    expect(codigos.has('EC-2024-002')).toBe(false);
  });

  it('debe reconocer el código J07 cuando la celda trae varios códigos separados por salto de línea', () => {
    const workbook = crearWorkbook([{ codigo: 'EC-2024-003', atc: 'N02BE01\nJ07AL02' }]);

    expect(extraer(workbook).has('EC-2024-003')).toBe(true);
  });

  it('no debe incluir pacientes solo con medicamentos no-vacuna', () => {
    const workbook = crearWorkbook([
      { codigo: 'EC-2024-004', atc: 'N02BE01' },
      { codigo: 'EC-2024-004', atc: 'A02BC01' },
    ]);

    expect(extraer(workbook).size).toBe(0);
  });

  it('debe deduplicar al paciente aunque tenga varias filas J07', () => {
    const workbook = crearWorkbook([
      { codigo: 'EC-2024-005', atc: 'J07BX03' },
      { codigo: 'EC-2024-005', atc: 'J07AL02' },
    ]);

    const codigos = extraer(workbook);

    expect(codigos.size).toBe(1);
    expect(codigos.has('EC-2024-005')).toBe(true);
  });

  it('debe ignorar filas sin código de paciente y celdas ATC vacías', () => {
    const workbook = crearWorkbook([
      { codigo: '', atc: 'J07BX03' },
      { codigo: 'EC-2024-006', atc: '' },
    ]);

    expect(extraer(workbook).size).toBe(0);
  });
});
