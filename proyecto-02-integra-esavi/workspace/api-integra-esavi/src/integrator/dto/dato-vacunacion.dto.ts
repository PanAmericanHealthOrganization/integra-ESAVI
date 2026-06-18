import {PartialType} from "@nestjs/swagger";

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
