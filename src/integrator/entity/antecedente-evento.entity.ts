import { Column, Entity } from 'typeorm';
import { Antecedente } from './antecedente.entity';

@Entity({ schema: 'dhi_esavi', name: 'TR_ANTECEDENTES_EVENTO_ADVERSO', comment: 'Tabla de antecedentes de eventos adversos' })
export class AntecedenteEvento extends Antecedente {
  @Column({
    name: 'ANTECEDENTES_ADVSIMILAR',
    nullable: true,
    comment: 'Número de antecedentes de eventos adversos similares',
  })
  antecedente: number;
  @Column({
    name: 'ALERGIA_VACUNAS',
    nullable: true,
    comment: 'Indica si el paciente tiene alergia conocida a vacunas',
  })
  alergiaVacuna: boolean;
  @Column({
    name: 'ALERGIA_MEDICAMENTOS',
    nullable: true,
    comment: 'Indica si el paciente tiene alergia conocida a medicamentos',
  })
  alergiaMedicamento: boolean;

  @Column({
    name: 'ALERGIA_ALIMENTOS',
    nullable: true,
    comment: 'Indica si el paciente tiene alergia conocida a alimentos',
  })
  alergiaAlimentos: boolean;
  @Column({
    name: 'ALERGIA_INSECTOS',
    nullable: true,
    comment: 'Indica si el paciente tiene alergia conocida a insectos',
  })
  alergiaInsectos: boolean;
  @Column({
    name: 'ALERGIA_POLVO',
    nullable: true,
    comment: 'Indica si el paciente tiene alergia conocida al polvo',
  })
  alergiaPolvo: boolean;
  @Column({
    name: 'OTRAS_ALERGIAS',
    nullable: true,
    comment: 'Descripción de otras alergias no contempladas anteriormente',
  })
  otrasAlergias: string;
}
