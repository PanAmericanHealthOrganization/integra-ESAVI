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
import { Catalogo } from './catalogo.entity';

@Entity({ schema: 'dhi_esavi' , name: 'TR_DESENLACEESAVI' })
export class DesenlaceEsavi extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'DESENLACEESAVI_ID' })
  id: string;

  @Column({ name: 'CODDESENLACEESAVI', nullable: true, length: 16 })
  codigo: string;

  @Column({ name: 'FECHAMUERTE', nullable: true })
  fechaMuerte: Date;

  @Column({ name: 'AUTOPSIA', nullable: true })
  autopsia: number;

  @Column({ name: 'FECHANOTIFICAMUERTE', nullable: true })
  fechaNotificacionMuerte: Date;

  @Column({ name: 'AUTOPSIAFETAL', nullable: true })
  autopsiaFetal: number;

  @Column({ name: 'FECHANOTIFICAMUERTEFETAL', nullable: true })
  fechaNotififacionMuerteFetal: Date;

  @Column({ name: 'COMENTARIOS', type: 'text', nullable: true })
  comentarios: string;

  @Column({ name: 'FECHAINICIOINVESTIGACION', nullable: true })
  fechaInicioInvestigacion: Date;

  @Column({ name: 'CLASIFICACIONFINALCASO', type: 'text', nullable: true })
  clasificacionFinalCaso: string;

  @Column({ name: 'CLASIFICACIONFINALCASOA', type: 'text', nullable: true })
  clasificacionFinalCasoA: string;

  @Column({ name: 'CLASIFICACIONFINALCASOB', type: 'text', nullable: true })
  clasificacionFinalCasoB: string;

  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CAUSALIDADESAVI_ID' })
  causalidadEsavi: Catalogo;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
