import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Notificacion } from './notificacion.entity';
import * as moment from 'moment/moment';

@Entity({
  schema: 'dhi_esavi',
  name: 'TR_PACIENTEEMBARAZADA',
  comment: 'Tabla de pacientes embarazadas',
})
export class PacienteEmbarazada extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;
  @Column({
    name: 'EMBARAZADA_MOMENTO_VACUNA',
    nullable: true,
    comment:
      'Indica si la paciente estaba embarazada al momento de la vacunación',
  })
  momentoVacuna: boolean;
  @Column({
    name: 'EMBARAZADA_MOMENTO_ESAVI',
    default: false,
    comment: 'Indica si la paciente estaba embarazada al momento del ESAVI',
  })
  momentoEsavi: boolean;
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
