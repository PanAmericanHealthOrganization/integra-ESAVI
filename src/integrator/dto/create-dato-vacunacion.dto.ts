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
  fechaConstitucion: Date;
  horaConstitucion: Date;
  usuarioCreacion : string
}
