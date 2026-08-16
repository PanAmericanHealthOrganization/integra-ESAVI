import { Drug } from '../drug.entity';
export interface IDrug {
  id?: string;
  drugName: string;
  drugCode: string;
  medicinalProductID: number;
  isGeneric: boolean;
  isPreferred: boolean;
  syncId: string;
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
 *
 * Devolvía además `drugCode`, `medicinalProductId` y `maHolderMedicinalProductId`, con los
 * que se poblaban las columnas homónimas de TR_DATO_VACUNA. Se retiraron del contrato —y no
 * sólo de quien los asignaba— para que ningún consumidor pueda volver a escribir esas
 * columnas por este camino mientras se define la nueva forma de identificarlas.
 */
export interface IWhodrugVaccineMatch {
  drugName: string;
  maHolder: string;
}
