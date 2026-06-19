import {PartialType} from "@nestjs/swagger";

export class CreateGravedadEsaviDto {
  tipo: string;
  muerte: string;
  riesgoVida: string;
  discapacidad: string;
  hospitalizacion: string;
  anomaliaCongenita: string;
  aborto: string;
  muerteFetal: string;
  parteEventosPreocupacion: string;
  sonEventosNuevos: string;
  descripcionEventoNuevo: string;
  condicionEgreso: string;
}

export class UpdateGravedadEsaviDto extends PartialType(CreateGravedadEsaviDto) {}
