import { BeforeInsert, Column, Entity } from 'typeorm';
import { Antecedente } from './antecedente.entity';
import * as moment from 'moment/moment';

@Entity({ schema: 'dhi_esavi', name: 'TR_ANTECEDENTES_MEDICO', comment: 'Tabla de antecedentes médicos' })
export class AntecedenteMedico extends Antecedente {
  @Column({
    name: 'ENSAYO_CLINICO_COVID19',
    type: 'integer',
    nullable: true,
    comment: 'Indica si el paciente participó en ensayos clínicos de COVID-19',
  })
  ensayoClinicoCovid19: number;

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

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
