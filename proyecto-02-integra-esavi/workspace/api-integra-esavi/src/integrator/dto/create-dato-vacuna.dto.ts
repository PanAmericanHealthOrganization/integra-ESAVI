export class CreateDatoVacunaDto {
  codigoAtc: string;
  rolVacuna: string; // Se mantiene como string en el DTO para recibir la descripción
  sistemaDeCodificacion: string;
  
  nombreVacPatenteWHODrug: string;
  //nombreVacunaNormalizada: string;
  //principioActivoWhoDrug: string;

  drugName: string; //nombreVacuna: string;
  drugCode : string;
  maHolderJsonb : any; //mahholdersJson: any
  activeIngredientJson : any;
  acIngredientTranslationJson: any;
  medicinalProductId: string;//identificadorVacuna: string;
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
  paisAutorizacionIso3Code: string;//paisAutorizacion: string;
  strengthPotencia: string;//concentracion: string;
  ingredienteSospechoso: string;
  accionTomada: string;
  informacionAdicionalMedicamento: string;
  indicacionMeddra: string;
  indicacionNotificadorPrimario: string;
  duracion: string;
  inicioAdministracion: Date;
  finAdministracion: Date;
  formaFarmaceutica: string;
  formaFarmaceuticaEDQM: string;
  viaAdministracion: string;
  viaAdministracionEDQM: string;
}
