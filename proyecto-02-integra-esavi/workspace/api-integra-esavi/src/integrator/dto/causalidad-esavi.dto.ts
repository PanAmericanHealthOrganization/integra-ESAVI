import {PartialType} from "@nestjs/swagger";

export class CreateCausalidadEsaviDto {
  datoEsavi: string;
  datoVacuna: string;
  fechaCausalidadEsavi: Date;
  sistemaClasificacionCausalidad: string;
  otroSistemaClasificacionCausalidad: string;
  clasificacionCausaEsavi: string;
  clasificacionCausalidadWHOAEFI: string;
  clasificacionCausalidadWHOUMC: string;
  referenciaIdentificadorVacuna: string;
  clasificacionCausalidadNaranjo: string;
  codigoCie10DxFinal1: string;
  codMeddraLltDxFinal1: string;
  codigoCie10DxFinal2: string;
  codMeddraLltDxFinal2: string;
  codigoCie10DxFinal3: string;
  codMeddraLltDxFinal3: string;
}

export class UpdateCausalidadEsaviDto extends PartialType(CreateCausalidadEsaviDto) {}
