import {PartialType} from "@nestjs/swagger";

export class CreateAntecedenteEmbarazoDto {
  uuidNotificacion: string;
  fechaUltimaMenstruacion: Date;
  fechaParto: Date;
  edadGestacional: number;
  descripcionAntecedente: string;
  /** Absorbidos de la antigua TR_PACIENTE_EMBARAZADA. Booleanos como texto: "1" / "0". */
  momentoVacuna: string;
  momentoEsavi: string;
}

export class UpdateAntecedenteEmbarazoDto extends PartialType(CreateAntecedenteEmbarazoDto) {}
