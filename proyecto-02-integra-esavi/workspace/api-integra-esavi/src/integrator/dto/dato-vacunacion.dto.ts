import { PartialType } from '@nestjs/mapped-types';

export class CreateDatoVacunacionDto {
  nombreVacunatorio: string;
  fechaVacunacion: Date;
  horaVacunacion: Date;
  provincia: string;
  canton: string;
  parroquia: string;
  otraParroquia: string;
  direccion: string;
  codigoMecanismoVerificacion: string;
  nombreOtroMecanismo: string;
  fechaReconstitucion: Date;
  horaConstitucion: Date;
  usuarioCreacion: string;
}

export class UpdateDatoVacunacionDto extends PartialType(CreateDatoVacunacionDto) {}
