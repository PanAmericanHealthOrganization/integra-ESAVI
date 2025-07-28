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

@Entity({ schema: 'dhi_esavi', name: 'TR_PACIENTEEMBARAZADA' })
export class PacienteEmbarazada extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'PACIENTEEMBARAZADA_ID' })
  id: string;
  @Column({ name: 'EMBARAZADAMOMENTOVACUNA', nullable: true })
  momentoVacuna: boolean;
  @Column({ name: 'EMBARAZADAMOMENTOESAVI', default: false })
  momentoEsavi: boolean;
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
