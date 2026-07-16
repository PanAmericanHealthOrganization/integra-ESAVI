import {PartialType} from "@nestjs/swagger";

export class CreateDatoVacunacionDto {
  nombreVacunatorio: string;
  fechaVacunacion: Date;
  horaVacunacion: Date;
  diasTranscurridosSintomas: number;
  establecimientoUniCodigo: string;
  otraDireccion: string;
  codigoMecanismoVerificacion: string;
  nombreOtroMecanismo: string;
  fechaReconstitucion: Date;
  horaConstitucion: Date;
  usuarioCreacion: string;
  inicioAdministracion: Date;
  finAdministracion: Date;
}

export class UpdateDatoVacunacionDto extends PartialType(CreateDatoVacunacionDto) {}
