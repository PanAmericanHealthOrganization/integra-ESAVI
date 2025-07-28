import { BeforeInsert, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Notificacion } from './notificacion.entity';
import { Auditoria } from './auditoria.entity';
import * as moment from 'moment';



export abstract class Antecedente extends Auditoria {
  @PrimaryColumn({ name: 'NOTIFICACION_ID' })
  id: string;
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
