import { PartialType } from '@nestjs/mapped-types';

export class CreateEmbarazoEsaviDto {
  codigo: string;
  fechaUltimaMenstruacion: Date;
  fechaParto: Date;
  codigoMonitoreoPosterioVacuna: string;
  codigoTipoComplicacion: string;
  nombreComplicacion: string;
  codigoMedraComplicacionEmbarazo: string;
  otroCodigoComplicacionEmbarazo: string;
}

export class UpdateEmbarazoEsaviDto extends PartialType(CreateEmbarazoEsaviDto) {}
