import { Antecedente } from './antecedente.entity';
import { BeforeInsert, Column, Entity } from 'typeorm';
import * as moment from 'moment/moment';

@Entity({ schema: 'dhi_esavi', name: 'TR_ANTECEDENTESEMBARAZO' })
export class AntecedenteEmbarazo extends Antecedente {
  @Column({
    name: 'FECHAULTIMAMENSTRUACION',
    type: 'timestamp without time zone',
    nullable: true,
  })
  fechaUltimaMenstruacion: Date;
  @Column({
    name: 'FECHAPARTO',
    type: 'timestamp without time zone',
    nullable: true,
  })
  fechaParto: Date;
  @Column({ name: 'EDADGESTACIONAL', type: 'integer', nullable: true })
  edadGestacional: number;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
