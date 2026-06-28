import { Antecedente } from './antecedente.entity';
import { BeforeInsert, Column, Entity } from 'typeorm';

@Entity({ schema: 'DHI_ESAVI', name: 'TR_ANTECEDENTES_EMBARAZO', comment: 'Tabla de antecedentes de embarazo' })
export class AntecedenteEmbarazo extends Antecedente {
  /**
   *
   */
  @Column({
    name: 'FECHA_ULTIMA_MENSTRUACION',
    type: 'timestamp without time zone',
    nullable: true,
    comment: 'Fecha de la última menstruación de la paciente',
  })
  fechaUltimaMenstruacion: Date;
  /**
   *
   */
  @Column({
    name: 'FECHA_PARTO',
    type: 'timestamp without time zone',
    nullable: true,
    comment: 'Fecha probable o real del parto',
  })
  fechaParto: Date;
  /**
   *
   */
  @Column({
    name: 'EDAD_GESTACIONAL',
    type: 'integer',
    nullable: true,
    comment: 'Edad gestacional de la paciente en semanas',
  })
  edadGestacional: number;

  @Column({
    name: 'DESCRIPCION_ANTECEDENTE',
    type: 'text',
    nullable: true,
    comment: 'Descripción del antecedente de embarazo (caso narrativo del reporte)',
  })
  descripcionAntecedente: string;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
  }
}
