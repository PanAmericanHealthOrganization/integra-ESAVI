import {PartialType} from "@nestjs/swagger";

export class CreateDatoVacunaDto {
  codigoAtc: string;
  rolVacuna: string;
  sistemaDeCodificacion: string;
  nombreVacPatenteWHODrug: string;
  drugName: string;
  drugCode: string;
  maHolderJsonb: any;
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
  dosis1: string;
  intervaloDosificacion: string;
  numeroLote: string;
  fechaVencimientoVacuna: Date;
  nombreDiluyenteVacuna: string;
  fechaVencimientoDiluyente: Date;
  paisAutorizacionIso3Code: string;
  strengthPotencia: string;
  ingredienteSospechoso: string;
  accionTomada: string;
  informacionAdicionalMedicamento: string;
  indicacionMeddra: string;
  indicacionNotificadorPrimario: string;
  duracion: string;
  formaFarmaceutica: string;
  formaFarmaceuticaEDQM: string;
  viaAdministracion: string;
  viaAdministracionEDQM: string;
}

export class UpdateDatoVacunaDto extends PartialType(CreateDatoVacunaDto) {}
