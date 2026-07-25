import {PartialType} from "@nestjs/swagger";

export class CreateDesenlaceEsaviDto {
  resultadoEvento: number;
  codigo: string;
  fechaMuerte: Date;
  autopsia: number;
  fechaNotificacionMuerte: Date;
  fechaNotififacionMuerteFetal: Date;
  fechaInicioInvestigacion: Date;
  clasificacionFinalCaso: string;
  clasificacionFinalCasoA: string;
  clasificacionFinalCasoB: string;
}

export class UpdateDesenlaceEsaviDto extends PartialType(CreateDesenlaceEsaviDto) {}
