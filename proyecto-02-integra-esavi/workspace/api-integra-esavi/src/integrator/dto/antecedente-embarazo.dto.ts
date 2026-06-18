import { PartialType } from '@nestjs/mapped-types';

export class CreateAntecedenteEmbarazoDto {
  uuidNotificacion: string;
  fechaUltimaMenstruacion: Date;
  fechaParto: Date;
  edadGestacional: number;
}

export class UpdateAntecedenteEmbarazoDto extends PartialType(CreateAntecedenteEmbarazoDto) {}
