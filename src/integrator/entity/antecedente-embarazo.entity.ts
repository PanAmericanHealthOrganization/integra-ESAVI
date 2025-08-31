import { Antecedente } from './antecedente.entity';
import { BeforeInsert, Column, Entity } from 'typeorm';
import * as moment from 'moment/moment';

@Entity({ schema: 'dhi_esavi', name: 'TR_ANTECEDENTES_EMBARAZO' })
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
  /**
   *
   */
  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
