export class CreateDatoEsaviDto {
  sistemaCodififacion: string;
  nombre: string;
  descripcion: string;
  nombreReportado: string;
  //Deberia ser catalogo
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
  ////////////////////////////////////////////
  codigoEsaviCie10: string;
  fechaEsavi: Date;
  fechaFinalizacion: Date;
  duracion: string;
  resultado: string;
  //////////
  codigoCaso: string;
}
