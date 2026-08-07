import {PartialType} from "@nestjs/swagger";
import {SourceEnum} from '../enum/source-enum';

export class CreateDatoVacunaDto {
  /**
   * Origen del registro. Es explícito a propósito: antes la estrategia de mezcla en un
   * reimport se decidía por la presencia de `codigoAtc` ("si tiene ATC es VigiFlow"), lo que
   * dejaba de ser cierto en cuanto DHIS2 también empezó a poblar el ATC vía WHODrug.
   */
  origen: SourceEnum;
  codigoAtc: string;
  rolVacuna: string;
  sistemaDeCodificacion: string;
  /** Nombre original de la fuente, sin homologar. Persiste en NOMBRE_VACUNA_REPORTADO. */
  nombreVacunaReportado: string;
  /** Nombre estandarizado WHODrug. Null si la homologación no encontró coincidencia. */
  drugName: string;
  drugCode: string;
  maHolderJsonb: any;
  maHolder: string;
  maHolderMedicinalProductId: string;
  activeIngredientJson: any;
  acIngredientTranslationJson: any;
  medicinalProductId: string;
  esGenerico: string;
  codigoOtro: string;
  nombreFabricante: string;
  nombreFabricanteWhoDrug: string;
  codigoFabricanteWhoDrug: string;
  numeroDosisVacuna: number;
  dosis: string;
  numeroLote: string;
  fechaVencimientoVacuna: Date;
  nombreDiluyenteVacuna: string;
  numeroLoteDiluyente: string;
  fechaVencimientoDiluyente: Date;
  paisAutorizacionIso3Code: string;
  formaFarmaceutica: string;
  formaFarmaceuticaEDQM: string;
  viaAdministracion: string;
  viaAdministracionEDQM: string;
}

export class UpdateDatoVacunaDto extends PartialType(CreateDatoVacunaDto) {}
