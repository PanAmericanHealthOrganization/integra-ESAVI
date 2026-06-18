import { PartialType } from '@nestjs/mapped-types';

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
