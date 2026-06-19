import {PartialType} from "@nestjs/swagger";

export class CreateDesenlaceEsaviDto {
  codigo: string;
  fechaMuerte: Date;
  autopsia: number;
  fechaNotificacionMuerte: Date;
  fechaNotififacionMuerteFetal: Date;
  comentarioResultado: string;
  fechaInicioInvestigacion: Date;
  clasificacionFinalCaso: string;
  clasificacionFinalCasoA: string;
  clasificacionFinalCasoB: string;
}

export class UpdateDesenlaceEsaviDto extends PartialType(CreateDesenlaceEsaviDto) {}
