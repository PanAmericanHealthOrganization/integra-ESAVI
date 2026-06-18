import {PartialType} from "@nestjs/swagger";

export class CreateAntecedenteEventoDto {
  antecedente: number;
  alergiaMedicamento: string;
  alergiaAlimentos: string;
  alergiaInsectos: string;
  alergiaPolvo: string;
  otrasAlergias: string;
}

export class UpdateAntecedenteEventoDto extends PartialType(CreateAntecedenteEventoDto) {}
