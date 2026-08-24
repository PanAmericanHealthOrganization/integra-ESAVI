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

/**
 * Codificación WHODrug de una vacuna, tal como la devuelve la consulta que recorre
 * INGREDIENT_TRANSLATION → ACTIVE_INGREDIENTS → DRUG → COUNTRY_SALES → MAHOLDER.
 *
 * Los dos identificadores de producto son distintos y vienen de tablas distintas; se
 * nombran aquí igual que las columnas de TR_DATO_VACUNA a las que alimentan para que no
 * puedan intercambiarse por descuido al asignarlos.
 */
export interface ICodificacionVacunaWhodrug {
  /** DRUG.DRU_CODE → TR_DATO_VACUNA.DRUG_CODE */
  drugCode: string;
  /** DRUG.DRU_NAME → TR_DATO_VACUNA.DRUG_NAME */
  drugName: string;
  /** COUNTRY_SALES.COS_MEDICINAL_PRODUCT_ID → TR_DATO_VACUNA.MEDICINAL_PRODUCT_ID */
  medicinalProductId: string;
  /** MAHOLDER.NAME → TR_DATO_VACUNA.MA_HOLDER */
  maHolder: string;
  /** MAHOLDER.MEDICINAL_PRODUCT_ID → TR_DATO_VACUNA.MA_HOLDER_MEDI_PROD_ID */
  maHolderMedicinalProductId: string;
}

/**
 * La misma codificación, más el DRUG.ID.
 *
 * El identificador interno del medicamento no se persiste en TR_DATO_VACUNA —por eso no está
 * en `ICodificacionVacunaWhodrug`—, pero hace falta para derivar después el código ATC con
 * `DrugService.getAtcCodeOfDrug()`, que trabaja con la clave del diccionario y no con
 * DRU_CODE. Lo usa la homologación de DHIS2, que sí puebla CODIGO_ATC.
 */
export interface ICodificacionVacunaWhodrugConDrugId extends ICodificacionVacunaWhodrug {
  /** DRUG.ID, clave interna del diccionario; no se persiste. */
  drugId: string;
}

/**
 * La codificación, más la traza de cómo se llegó a ella.
 *
 * `buscarCodificacionVacuna` decide en dos fases y con varios criterios encadenados; sin
 * dejar constancia de cuáles actuaron, una codificación correcta y una que se sostiene sólo
 * en la cobertura parcial de principios activos son indistinguibles a posteriori. Estos
 * campos no se persisten en TR_DATO_VACUNA: existen para el log de la importación y para
 * poder auditar un lote sin volver a ejecutarlo.
 */
export interface ICodificacionVacunaWhodrugDetallada extends ICodificacionVacunaWhodrug {
  /**
   * COUNTRY_SALES.COS_COUNTRY de la fila de la que salieron MEDICINAL_PRODUCT_ID,
   * MA_HOLDER y MA_HOLDER_MEDI_PROD_ID. `null` cuando el medicamento se identificó pero no
   * tiene venta registrada en el país pedido, en cuyo caso esos tres campos van también en
   * `null` y sólo se conservan DRUG_CODE y DRUG_NAME.
   */
  paisRegistro: string | null;
  /** Cuántos de los principios activos reportados cubre el medicamento identificado. */
  cobertura: number;
  /** Cuántos principios activos traía la columna F. */
  principiosReportados: number;
  /** Criterios que estrecharon la búsqueda, en el orden en que actuaron. */
  criterios: string[];
}
