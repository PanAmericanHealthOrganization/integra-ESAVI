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

@Entity({ schema: 'dhi_esavi', name: 'TR_MEDICAMENTO' })
export class Medicamento extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'MEDICAMENTO_ID' })
  id: string;
  @Column({ name: 'ROLMEDICAMENTO', nullable: true })
  rolMedicamento: string;
  @Column({ name: 'CODIGOATC', nullable: true })
  codigoATC: string;
  @Column({ name: 'SISTEMADECODIFICACION', nullable: true })
  sistemaCodificacion: string;

  @Column({ name: 'CODIGOMEDICAMENTO', nullable: true })
  codigo: string;
  @Column({ name: 'NOMBREMEDICAMENTO', nullable: true })
  nombre: string;
  @Column({ name: 'NOMBRENORMALIZADOMEDICAMENTO', nullable: true })
  nombreNormalizado: string;

  @Column({ name: 'CODIGOFORMAFARMACEUTICA', nullable: true, length: 64 })
  codigoFormaFarmaceutica: string;
  @Column({ name: 'NOMBREFORMAFARMACEUTICA', nullable: true, length: 128 })
  nombreFormaFarmaceutica: string;

  @Column({ name: 'CODIGOVIAADMINISTRACION', nullable: true, length: 64 })
  codigoViaAdministracion: string;
  @Column({ name: 'NOMBREVIAADMINISTRACION', nullable: true, length: 64 })
  nombreViaAdministracion: string;

  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
