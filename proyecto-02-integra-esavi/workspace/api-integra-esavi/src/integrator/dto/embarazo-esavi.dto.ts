import {PartialType} from "@nestjs/swagger";

export class CreateEmbarazoEsaviDto {
  codigo: string;
  edadGestacional: number;
  fechaUltimaMenstruacion: Date;
  fechaParto: Date;
  codigoMonitoreoPosterioVacuna: string;
  codigoTipoComplicacion: string;
  nombreComplicacion: string;
  codigoMedraComplicacionEmbarazo: string;
  otroCodigoComplicacionEmbarazo: string;
}

export class UpdateEmbarazoEsaviDto extends PartialType(CreateEmbarazoEsaviDto) {}
