import { IDrugResponse } from '../dtos';
import { DrugSchemaAdapter } from './drug.build';

describe('DrugSchemaAdapter', () => {
  // Id de la corrida en TR_SYNC_PROCESS: ahora Drug guarda sólo el uuid, sin FK.
  const syncId = 'a3f1c2d4-0000-4000-8000-000000000001';

  const makeDrugResponse = (overrides: Partial<IDrugResponse> = {}): IDrugResponse => ({
    drugCode: 'DRU001',
    drugName: 'GARDASIL 9',
    medicinalProductID: 123,
    isGeneric: false,
    isPreferred: true,
    activeIngredients: [],
    countryOfSales: [],
    atcs: [],
    ...overrides,
  });

  it('arma el drug principal a partir de la respuesta de WHODrug', () => {
    const drugResponse = makeDrugResponse();
    const adapter = new DrugSchemaAdapter(drugResponse, syncId);

    const { drug, activeIngredients, countryOfSales, atcs } = adapter.getEntities();

    expect(drug).toBeDefined();
    expect(typeof drug.id).toBe('string');
    expect(drug.id).toHaveLength(11);
    expect(drug.drugCode).toBe('DRU001');
    expect(drug.drugName).toBe('GARDASIL 9');
    expect(drug.medicinalProductID).toBe(123);
    expect(drug.isGeneric).toBe(false);
    expect(drug.isPreferred).toBe(true);
    expect(drug.syncId).toBe(syncId);
    expect(activeIngredients).toEqual([]);
    expect(countryOfSales).toEqual([]);
    expect(atcs).toEqual([]);
  });

  it('arma los principios activos y sus traducciones, enlazando la FK al drug', () => {
    const drugResponse = makeDrugResponse({
      activeIngredients: [
        {
          ingredient: 'PARACETAMOL',
          ingredientTranslations: [
            { languageCode: 'es', ingredient: 'PARACETAMOL' },
            { languageCode: 'en', ingredient: 'ACETAMINOPHEN' },
          ],
        },
      ],
    });

    const adapter = new DrugSchemaAdapter(drugResponse, syncId);
    const { drug, activeIngredients, ingredientTranslations } = adapter.getEntities();

    expect(activeIngredients).toHaveLength(1);
    expect(activeIngredients[0].ingredient).toBe('PARACETAMOL');
    expect(activeIngredients[0].drug).toBe(drug);

    expect(ingredientTranslations).toHaveLength(2);
    expect(ingredientTranslations[0].languageCode).toBe('es');
    expect(ingredientTranslations[0].activeIngredient).toBe(activeIngredients[0]);
    expect(ingredientTranslations[1].languageCode).toBe('en');
  });

  it('no falla y deja las traducciones vacías cuando ingredientTranslations es undefined', () => {
    const drugResponse = makeDrugResponse({
      activeIngredients: [{ ingredient: 'IBUPROFENO' }],
    });

    const adapter = new DrugSchemaAdapter(drugResponse, syncId);
    const { activeIngredients, ingredientTranslations } = adapter.getEntities();

    expect(activeIngredients).toHaveLength(1);
    expect(ingredientTranslations).toEqual([]);
  });

  it('arma los países de venta y sus maholders, enlazando las FKs correspondientes', () => {
    const drugResponse = makeDrugResponse({
      countryOfSales: [
        {
          iso3Code: 'ECU',
          medicinalProductID: 111,
          maHolders: [
            { name: 'Merck Sharp & Dohme', medicinalProductID: 555 },
            { name: 'Pfizer', medicinalProductID: 777 },
          ],
        },
      ],
    });

    const adapter = new DrugSchemaAdapter(drugResponse, syncId);
    const { drug, countryOfSales, maholders } = adapter.getEntities();

    expect(countryOfSales).toHaveLength(1);
    expect(countryOfSales[0].iso3Code).toBe('ECU');
    expect(countryOfSales[0].drug).toBe(drug);

    expect(maholders).toHaveLength(2);
    expect(maholders[0].name).toBe('Merck Sharp & Dohme');
    expect(maholders[0].countrySale).toBe(countryOfSales[0]);
    expect(maholders[1].name).toBe('Pfizer');
  });

  it('arma los ATCs enlazando la FK al drug', () => {
    const drugResponse = makeDrugResponse({
      atcs: [
        { code: 'J07BM03', text: 'papillomavirus (human) vaccines', officialFlag: 'Y' },
      ],
    });

    const adapter = new DrugSchemaAdapter(drugResponse, syncId);
    const { drug, atcs } = adapter.getEntities();

    expect(atcs).toHaveLength(1);
    expect(atcs[0].code).toBe('J07BM03');
    expect(atcs[0].text).toBe('papillomavirus (human) vaccines');
    expect(atcs[0].officialFlag).toBe('Y');
    expect(atcs[0].drug).toBe(drug);
  });

  it('arma correctamente una respuesta completa con múltiples elementos en cada rama', () => {
    const drugResponse = makeDrugResponse({
      activeIngredients: [
        { ingredient: 'A', ingredientTranslations: [{ languageCode: 'es', ingredient: 'A-ES' }] },
        { ingredient: 'B' },
      ],
      countryOfSales: [
        { iso3Code: 'ECU', medicinalProductID: 1, maHolders: [{ name: 'MH1', medicinalProductID: 10 }] },
        { iso3Code: 'PER', medicinalProductID: 2, maHolders: [] },
      ],
      atcs: [
        { code: 'C01', text: 'texto 1', officialFlag: 'Y' },
        { code: 'C02', text: 'texto 2', officialFlag: 'N' },
      ],
    });

    const adapter = new DrugSchemaAdapter(drugResponse, syncId);
    const entities = adapter.getEntities();

    expect(entities.activeIngredients).toHaveLength(2);
    expect(entities.ingredientTranslations).toHaveLength(1);
    expect(entities.countryOfSales).toHaveLength(2);
    expect(entities.maholders).toHaveLength(1);
    expect(entities.atcs).toHaveLength(2);
  });
});
