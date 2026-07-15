import { Drug } from '../drug.entity';
import { DrugSync } from '../drugSync.entity';
export interface IDrug {
  id?: string;
  drugName: string;
  drugCode: string;
  medicinalProductID: number;
  isGeneric: boolean;
  isPreferred: boolean;
  drugSync: DrugSync;
}

export interface IDrugPaginated {
  drugs: IDrug[];
  total: number;
}

export interface IDrugResponse {
  drugName: string;
  drugCode: string;
  medicinalProductID?: number;
  isGeneric?: boolean;
  isPreferred?: boolean;
  countryOfSales?: ICountryOfSale[];
  activeIngredients?: IActiveIngredient[];
  atcs?: IATC[];
}

export interface IDrugProcces extends IDrugResponse {
  drug: Drug;
}

export interface ICountryOfSale {
  iso3Code: string;
  medicinalProductID: number;
  maHolders?: IMaHolder[];
}

export interface IMaHolder {
  name: string;
  medicinalProductID: number;
}

export interface IActiveIngredient {
  ingredient: string;
  ingredientTranslations?: IIngredientTranslation[];
}

export interface IIngredientTranslation {
  languageCode: string;
  ingredient: string;
}

export interface IATC {
  code: string;
  text: string;
  officialFlag: string;
}

/**
 * Resultado de la búsqueda de una vacuna en WHODrug por principio activo
 * (INGREDIENT_TRANSLATION.INT_INGREDIENT) + laboratorio titular (MAHOLDER.NAME).
 */
export interface IWhodrugVaccineMatch {
  drugCode: string;
  drugName: string;
  medicinalProductId: string;
  maHolder: string;
  maHolderMedicinalProductId: string;
}
