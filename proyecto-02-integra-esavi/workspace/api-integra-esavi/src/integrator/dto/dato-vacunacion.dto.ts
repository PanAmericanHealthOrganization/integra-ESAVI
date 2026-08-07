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
  /** Respaldo de fechaVacunacion cuando el origen no la entrega. */
  inicioAdministracion: Date;
  // finAdministracion se retiró: FIN_ADMINISTRACION se eliminó de TR_DATO_VACUNACION.
}

export class UpdateDatoVacunacionDto extends PartialType(CreateDatoVacunacionDto) {}
