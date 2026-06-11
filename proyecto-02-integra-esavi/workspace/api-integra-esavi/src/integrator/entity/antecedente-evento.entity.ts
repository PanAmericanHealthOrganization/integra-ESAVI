import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Antecedente } from './antecedente.entity';
import { Catalogo } from './catalogo.entity';

@Entity({ schema: 'dhi_esavi', name: 'TR_ANTECEDENTES_EVENTO_ADVERSO', comment: 'Tabla de antecedentes de eventos adversos' })
export class AntecedenteEvento extends Antecedente {
  @Column({
    name: 'ANTECEDENTES_ADVSIMILAR',
    nullable: true,
    comment: 'Número de antecedentes de eventos adversos similares',
  })
  antecedente: number;
  /*@Column({
    name: 'ALERGIA_VACUNAS',
    nullable: true,
    comment: 'Indica si el paciente tiene alergia conocida a vacunas',
  })
  alergiaVacuna: boolean;*/ //variable no encontrada en los orígenes. En realidad una vacuna es un medicamento.
  /*@Column({
    name: 'ALERGIA_MEDICAMENTOS',
    nullable: true,
    comment: 'Indica si el paciente tiene alergia conocida a medicamentos',
  })
  alergiaMedicamento: string;*/
  @ManyToOne(() => Catalogo)
    @JoinColumn({ name: 'CT_ALERGIA_MEDICAMENTO_ID' })
    alergiaMedicamento: Catalogo;

  /*@Column({
    name: 'ALERGIA_ALIMENTOS',
    nullable: true,
    comment: 'Indica si el paciente tiene alergia conocida a alimentos',
  })
  alergiaAlimentos: boolean;*/
  @ManyToOne(() => Catalogo)
    @JoinColumn({ name: 'CT_ALERGIA_ALIMENTO_ID' })
    alergiaAlimentos: Catalogo;

  /*@Column({
    name: 'ALERGIA_INSECTOS',
    nullable: true,
    comment: 'Indica si el paciente tiene alergia conocida a insectos',
  })
  alergiaInsectos: boolean;*/
  @ManyToOne(() => Catalogo)
    @JoinColumn({ name: 'CT_ALERGIA_INSECTO_ID' })
    alergiaInsectos: Catalogo;
  /*@Column({
    name: 'ALERGIA_POLVO',
    nullable: true,
    comment: 'Indica si el paciente tiene alergia conocida al polvo',
  })
  alergiaPolvo: boolean;*/
  @ManyToOne(() => Catalogo)
    @JoinColumn({ name: 'CT_ALERGIA_POLVO_ID' })
    alergiaPolvo: Catalogo;
  @Column({
    name: 'OTRAS_ALERGIAS',
    nullable: true,
    comment: 'Descripción de otras alergias no contempladas anteriormente',
  })
  otrasAlergias: string;
}
