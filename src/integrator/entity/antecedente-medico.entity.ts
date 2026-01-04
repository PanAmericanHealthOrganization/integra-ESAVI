import { BeforeInsert, Column, Entity } from 'typeorm';
import { Antecedente } from './antecedente.entity';
import * as moment from 'moment/moment';

@Entity({ schema: 'dhi_esavi', name: 'TR_ANTECEDENTES_MEDICO', comment: 'Tabla de antecedentes médicos' })
export class AntecedenteMedico extends Antecedente {
  @Column({
    name: 'ENSAYO_CLINICO_COVID19',
    type: 'varchar',
    nullable: true,
    comment: 'Indica si el paciente participó en ensayos clínicos de COVID-19. En el origen es tipo BOOLEANO, dhis2 ya entrega de forma preestablecida true=1, false=0 (valores numéricos en tipo texto). Si no está marcada ninguna opción entrega NULL.',
  })
  ensayoClinicoCovid19: string; //En el origen es tipo BOOLEANO, dhis2 ya entrega de forma preestablecida true=1, false=0 (valores numéricos en tipo texto). Si no está marcada ninguna opción entrega NULL.

  @Column({
    name: 'COMORBILIDAD_PRINCIPAL',
    type: 'text',
    nullable: true,
    comment: 'Descripción de la comorbilidad principal del paciente',
  })
  descripcionPrincipal: string;

  @Column({
    name: 'COMORBILIDAD_PRINCIPAL_CIE10',
    type: 'text',
    nullable: true,
    comment: 'Código CIE-10 de la comorbilidad principal',
  })
  comorbilidadPrincipalCIE10: number;

  @Column({
    name: 'COMORBILIDAD_DOS',
    type: 'text',
    nullable: true,
    comment: 'Descripción de la segunda comorbilidad del paciente',
  })
  descripcionDos: string;

  @Column({
    name: 'COMORBILIDAD_DOS_CIE10',
    type: 'text',
    nullable: true,
    comment: 'Código CIE-10 de la segunda comorbilidad',
  })
  comorbilidadDosCIE10: number;

  @Column({
    name: 'COMORBILIDAD_TRES',
    type: 'text',
    nullable: true,
    comment: 'Descripción de la tercera comorbilidad del paciente',
  })
  descripcionTres: string;

  @Column({
    name: 'COMORBILIDAD_TRES_CIE10',
    type: 'text',
    nullable: true,
    comment: 'Código CIE-10 de la tercera comorbilidad',
  })
  comorbilidadTresCIE10: number;

  //----------Nuevos campos agregados ----------
  // NUEVOS CAMPOS: 
  // CODIGO_COMORBILIDAD_MEDDRA_LLT, 
  // ANTECEDENTE_PATOLOGICO_AGUDO_CIE10,
  // ANTECEDENTE_PATOLOGICO_AGUDO_MEDDRA_LLT,
  // ANTECEDENTE_FAMILIAR_CIE10,
  // ANTECEDENTE_FAMILIAR_MEDDRA_LLT,
  // ANTECEDENTE_QUIRURGICO_CIE10,
  // ANTECEDENTE_QUIRURGICO_MEDDRA_LLT,
  // ANTECEDENTE_FARMACOLOGICO_WHODRUG,
  // ANTECEDENTE_FARMACOLOGICO_PREVIO_SINTOMAS_WHODRUG,
  // ANTECEDENTE_DIAGNOSTICO_COVID19,
  // SINTOMAS_COVID19,
  // FECHA_SINTOMAS_COVID19,
  // METODO_DIAGNOSTICO_COVID19,
  // CODIGO_ENF_PREVIAS_CIE10,
  // CODIGO_ENF_PREVIAS_MEDDRA_LLT
//--------------------------------------------------
  @Column({
    name: 'CODIGO_COMORBILIDAD_MEDDRA_LLT',
    type: 'text',
    nullable: true,
    comment: 'Código CIE-10 de la comorbilidad principal, 2 y 3',
  })
  codigoComorbilidadMeddraLlt: string;

  @Column({
    name: 'ANTECEDENTE_PATOLOGICO_AGUDO_CIE10',
    type: 'text',
    nullable: true,
    comment: 'Código CIE-10 del antecedente patológico agudo. Código CIE-10 de DNVE ESAVI TRK - Antecedente patológico agudo previo a las 72 horas de ocurrido el evento 1 - 3',
  })
  antecedentePatologicoAgudoCIE10: string;

  @Column({
    name: 'ANTECEDENTE_PATOLOGICO_AGUDO_MEDDRA_LLT',
    type: 'text',
    nullable: true,
    comment: 'Código LLT MedDRA del antecedente patológico agudo. Código MedDRA LLT de DNVE ESAVI TRK - Antecedente patológico agudo previo a las 72 horas de ocurrido el evento 1 - 3',
  })
  antecedentePatologicoAgudoMeddraLlt: string;

  @Column({
    name: 'ANTECEDENTE_FAMILIAR_CIE10',
    type: 'text',
    nullable: true,
    comment: 'Código CIE-10 del antecedente familiar.',
  })
  antecedenteFamiliarCIE10: string;

  @Column({
    name: 'ANTECEDENTE_FAMILIAR_MEDDRA_LLT',
    type: 'text',
    nullable: true,
    comment: 'Código MedDRA LLT del antecedente familiar.',
  })
  antecedenteFamiliarMeddraLlt: string;

  @Column({
    name: 'ANTECEDENTE_QUIRURGICO_CIE10',
    type: 'text',
    nullable: true,
    comment: 'Código CIE-10 del antecedente quirúrgico.',
  })
  antecedenteQuirurgicoCIE10: string;

  @Column({
    name: 'ANTECEDENTE_QUIRURGICO_MEDDRA_LLT',
    type: 'text',
    nullable: true,
    comment: 'Código MedDRA LLT del antecedente quirúrgico.',
  })
  antecedenteQuirurgicoMeddraLlt: string;

  @Column({
    name: 'ANTECEDENTE_FARMACOLOGICO_WHODRUG',
    type: 'text',
    nullable: true,
    comment: 'Código WHODRUG del antecedente farmacológico.',
  })
  antecedenteFarmacologicoWhodrug: string;

  @Column({
    name: 'ANTECEDENTE_FARMACOLOGICO_PREVIO_SINTOMAS_WHODRUG',
    type: 'text',
    nullable: true,
    comment: 'Código WHODrug del antecedente farmacológico reciente, previo al inicio de síntomas.',
  })
  antecedenteFarmacologicoPrevioSintomasWhodrug: string;

  @Column({
    name: 'ANTECEDENTE_DIAGNOSTICO_COVID19',
    type: 'text',
    nullable: true,
    comment: 'Antecedente de diagnóstico de infección por SARS-CoV-2 antes de la vacunación.',
  })
  antecedenteDiagnosticoCovid19: string;

  @Column({
    name: 'SINTOMAS_COVID19',
    type: 'text',
    nullable: true,
    comment: 'Presencia de síntomas de COVID-19.',
  })
  sintomasCovid19: string;

  @Column({
    name: 'FECHA_SINTOMAS_COVID19',
    type: 'date',
    nullable: true,
    comment: 'Fecha de inicio de los síntomas de COVID-19. En caso de presentar síntomas coloque la fecha que presentó los síntomas.',
  })
  fechaSintomasCovid19: Date;

  @Column({
    name: 'METODO_DIAGNOSTICO_COVID19',
    type: 'text',
    nullable: true,
    comment: 'Corresponde al método mediante el cual se confirmó el diagnóstico de COVID-19.',
  })
  metodoDiagnosticoCovid19: string;

  @Column({
    name: 'CODIGO_ENF_PREVIAS_CIE10',
    type: 'text',
    nullable: true,
    comment: 'Código CIE-10 de la enfermedad previa.',
  })
  codigoEnfPreviasCIE10: string;

  @Column({
    name: 'CODIGO_ENF_PREVIAS_MEDDRA_LLT',
    type: 'text',
    nullable: true,
    comment: 'Código MedDRA LLT de la enfermedad previa.',
  })
  codigoEnfPreviasMeddraLlt: string;
  
  //-------fin de los campos nuevos -------

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
