import { Column, Entity } from 'typeorm';
import { Antecedente } from './antecedente.entity';

@Entity({ schema: 'dhi_esavi', name: 'TR_ANTECEDENTEEVENTOADVERSO' })
export class AntecedenteEvento extends Antecedente {
  @Column({ name: 'ANTECEDENTESADVSIMILAR', nullable: true })
  antecedente: number;
  @Column({ name: 'ALERGIAVACUNAS', nullable: true })
  alergiaVacuna: boolean;
  @Column({ name: 'ALERGIAMEDICAMENTOS', nullable: true })
  alergiaMedicamento: boolean;

  @Column({ name: 'ALERGIAALIMENTOS', nullable: true })
  alergiaAlimentos: boolean;
  @Column({ name: 'ALERGIAINSECTOS', nullable: true })
  alergiaInsectos: boolean;
  @Column({ name: 'ALERGIAPOLVO', nullable: true })
  alergiaPolvo: boolean;
  @Column({ name: 'OTRASALERGIAS', nullable: true })
  otrasAlergias: string;
}
