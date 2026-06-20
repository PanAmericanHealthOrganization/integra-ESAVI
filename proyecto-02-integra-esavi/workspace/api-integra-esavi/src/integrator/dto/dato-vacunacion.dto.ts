import {PartialType} from "@nestjs/swagger";

export class CreateDatoVacunacionDto {
  nombreVacunatorio: string;
  fechaVacunacion: Date;
  horaVacunacion: Date;
  establecimientoUniCodigo: string;
  otraDireccion: string;
  codigoMecanismoVerificacion: string;
  nombreOtroMecanismo: string;
  fechaReconstitucion: Date;
  horaConstitucion: Date;
  usuarioCreacion: string;
}

export class UpdateDatoVacunacionDto extends PartialType(CreateDatoVacunacionDto) {}
