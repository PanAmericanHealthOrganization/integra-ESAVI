import {PartialType} from "@nestjs/swagger";

export class CreateAntecedenteMedicoDto {
  ensayoClinicoCovid19: string;
  descripcionPrincipal: string;
  descripcionDos: string;
  descripcionTres: string;
  comorbilidadPrincipalCIE10: string;
  comorbilidadDosCIE10: string;
  comorbilidadTresCIE10: string;
  codMeddraLltComorbilidadPrincipal: string;
  codCie10PatologicoAgudo: string;
  codMeddraLltPatologicoAgudo: string;
  codCie10Familiar: string;
  codMeddraLltFamiliar: string;
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
}

export class UpdateAntecedenteMedicoDto extends PartialType(CreateAntecedenteMedicoDto) {}
