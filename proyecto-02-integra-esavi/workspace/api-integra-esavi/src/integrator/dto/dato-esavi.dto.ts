import {PartialType} from "@nestjs/swagger";
import {TipoRegistroEsaviEnum} from '../enum/tipo-registro-esavi.enum';

export class CreateDatoEsaviDto {
  sistemaCodififacion: string;
  /** Término estandarizado (LLT MedDRA). Null si el evento no pudo homologarse. */
  nombre: string;
  /** Texto original de quien notifica, sin homologar. */
  nombreReportado: string;
  /** Bloque de la ficha que originó el evento. Reemplaza al antiguo campo `descripcion`. */
  tipoRegistro: TipoRegistroEsaviEnum;
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
  codigoDxInicialCie10: string;
  codigoDxInicialMeddraLlt: string;
}

export class UpdateDatoEsaviDto extends PartialType(CreateDatoEsaviDto) {}
