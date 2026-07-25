import {PartialType} from "@nestjs/swagger";

export class CreateDatoVacunaDto {
  codigoAtc: string;
  rolVacuna: string;
  sistemaDeCodificacion: string;
  nombreVacPatenteWHODrug: string;
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
  duracion: string;
  formaFarmaceutica: string;
  formaFarmaceuticaEDQM: string;
  viaAdministracion: string;
  viaAdministracionEDQM: string;
}

export class UpdateDatoVacunaDto extends PartialType(CreateDatoVacunaDto) {}
