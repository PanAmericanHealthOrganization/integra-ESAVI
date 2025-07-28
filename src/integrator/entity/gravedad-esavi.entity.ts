import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Notificacion } from './notificacion.entity';
import { Auditoria } from './auditoria.entity';
import * as moment from 'moment/moment';

@Entity({ schema: 'dhi_esavi' , name: 'TR_GRAVEDADESAVI' })
export class GravedadEsavi extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'GRAVEDADESAVI_ID' })
  id: string;
  @Column({ name: 'TIPOGRAVEDAD', nullable: true })
  tipo: string;
  @Column({ name: 'GRAVMUERTE', nullable: true })
  muerte: boolean;
  @Column({ name: 'GRAVRIESGOVIDA', nullable: true })
  riesgoVida: boolean;
  @Column({ name: 'GRAVDISCAPACIDAD', nullable: true })
  discapacidad: boolean;
  @Column({ name: 'GRAVHOSPITALIZACION', nullable: true })
  hospitalizacion: boolean;
  @Column({ name: 'GRAVANOMALIACONGENITA', nullable: true })
  anomaliaCongenita: boolean;
  @Column({ name: 'GRAVABORTO', nullable: true })
  aborto: boolean;
  @Column({ name: 'GRAVMUERTEFETAL', nullable: true })
  muerteFetal: boolean;
  @Column({ name: 'OTROSEVENTOSIMPORTANTES', nullable: true })
  eventoImportante: boolean;
  @Column({ name: 'OTROSEVENTOSIMPORTANTESTX', nullable: true, length: 2000 })
  comentarioEventoImportante: string;

  @Column({ name: 'PARTEEVENTOSPREOCUPACION', nullable: true })
  parteEventosPreocupacion: boolean;

  @Column({ name: 'NUEVOEVENTOS', nullable: true })
  nuevoEventos: boolean;

  @Column({ name: 'CONDICIONEGRESO', nullable: true, length: 2000 })
  condicionEgreso: string;


  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
