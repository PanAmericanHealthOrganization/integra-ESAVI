import {PartialType} from "@nestjs/swagger";

export class CreateAntecedenteEmbarazoDto {
  uuidNotificacion: string;
  fechaUltimaMenstruacion: Date;
  fechaParto: Date;
  edadGestacional: number;
  descripcionAntecedente: string;
}

export class UpdateAntecedenteEmbarazoDto extends PartialType(CreateAntecedenteEmbarazoDto) {}
