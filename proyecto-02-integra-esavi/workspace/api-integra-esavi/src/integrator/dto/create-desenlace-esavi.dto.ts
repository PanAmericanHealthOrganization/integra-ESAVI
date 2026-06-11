export class CreateDesenlaceEsaviDto {
  codigo: string;
  fechaMuerte: Date;
  autopsia: number; //utiliza dhis2 y vigiflow.
  fechaNotificacionMuerte: Date;
  //autopsiaFetal: number;
  fechaNotififacionMuerteFetal: Date;
  comentarioResultado: string;
  fechaInicioInvestigacion: Date;
  clasificacionFinalCaso: string;
  clasificacionFinalCasoA: string;
  clasificacionFinalCasoB: string;
}
