import { BeforeInsert, Column, Entity } from 'typeorm';
import { Antecedente } from './antecedente.entity';
import * as moment from 'moment/moment';

@Entity({ schema: 'dhi_esavi' , name: 'TR_ANTECEDENTEMEDICO' })
export class AntecedenteMedico extends Antecedente {
  @Column({ name: 'ENSAYOCLINICOCOVID19', type: 'integer', nullable: true })
  ensayoClinicoCovid19: number;

  @Column({ name: 'COMORBILIDADPRINCIPAL', type: 'text', nullable: true })
  descripcionPrincipal: string;

  @Column({ name: 'COMORBILIDADPRINCIPALCIE10', type: 'text', nullable: true })
  comorbilidadPrincipalCIE10: number;

  @Column({ name: 'COMORBILIDADDOS', type: 'text', nullable: true })
  descripcionDos: string;

  @Column({ name: 'COMORBILIDADDOSCIE10', type: 'text', nullable: true })
  comorbilidadDosCIE10: number;

  @Column({ name: 'COMORBILIDADTRES', type: 'text', nullable: true })
  descripcionTres: string;

  @Column({ name: 'COMORBILIDADTRESCIE10', type: 'text', nullable: true })
  comorbilidadTresCIE10: number;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
