export class CreateAntecedenteMedicoDto {
  ensayoClinicoCovid19: number;
  descripcionPrincipal : string;
  descripcionDos : string;
  descripcionTres : string;
  comorbilidadPrincipalCIE10 : string;
  comorbilidadDosCIE10 : string;
  comorbilidadTresCIE10 : string;

  // --------Propiedades nuevas. Referencia: "antecedente-medico.entity.ts"------------
  codigoComorbilidadMeddraLlt: string;
  antecedentePatologicoAgudoCIE10: string;
  antecedentePatologicoAgudoMeddraLlt: string;
  antecedenteFamiliarCIE10: string;
  antecedenteFamiliarMeddraLlt: string;
  antecedenteQuirurgicoCIE10: string;
  antecedenteQuirurgicoMeddraLlt: string;
  antecedenteFarmacologicoWhodrug: string;
  antecedenteFarmacologicoPrevioSintomasWhodrug: string;
  antecedenteDiagnosticoCovid19: string;
  sintomasCovid19: string;
  fechaSintomasCovid19: Date;
  metodoDiagnosticoCovid19: string;
  codigoEnfPreviasCIE10: string;
  codigoEnfPreviasMeddraLlt: string;
  //-----fin de propiedades nuevas------------------------------------------------
  /*@IsOptional()
  @IsNumber()
  id?: number; */

}
