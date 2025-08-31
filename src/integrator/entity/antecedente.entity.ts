import * as moment from 'moment';
import {
  BeforeInsert,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Notificacion } from './notificacion.entity';

export abstract class Antecedente extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', {
    name: 'NOTIFICACION_ID',
    comment: 'Identificador de la notificación asociada al antecedente',
  })
  id: string;

  /**
   *
   */
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
