import {PartialType} from "@nestjs/swagger";

export class CreateDatoEsaviDto {
  sistemaCodififacion: string;
  // NOMBRE_ESAVI y DESCRIPCION dejaron de poblarse desde VigiFlow por no ser variables
  // priorizadas, pero se conservan porque el integrador DHIS2 sí las utiliza para los
  // diagnósticos inicial/final y la sintomatología.
  nombre: string;
  descripcion: string;
  nombreReportado: string;
  CTLLTMEDDRA_ID: number;
  CTPTMEDDRA_ID: number;
  CTHLTMEDDRA_ID: number;
  CTHLGTMEDDRA_ID: number;
  CTSOCMEDDRA_ID: number;
  codigoLLT: string;
  codigoPT: string;
  codigoHLT: string;
  codigoHLGT: string;
  codigoSOC: string;
  nameLLT: string;
  namePT: string;
  nameHLT: string;
  nameHLGT: string;
  nameSOC: string;
  codigoEsaviCie10: string;
  fechaEsavi: Date;
  fechaFinalizacion: Date;
  duracion: string;
  codigoCaso: string;
  codigoDxInicialCie10: string;
  codigoDxInicialMeddraLlt: string;
}

export class UpdateDatoEsaviDto extends PartialType(CreateDatoEsaviDto) {}
