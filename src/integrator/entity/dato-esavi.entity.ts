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

@Entity({ schema: 'dhi_esavi' , name: 'TR_DATOSESAVI' })
export class DatoEsavi extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'DATOSESAVI_ID' })
  id: string;
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;
  @Column({ name: 'SISTEMADECODIFICACION', nullable: true })
  sistemaCodififacion: string;
  @Column({ name: 'NOMBREESAVI', nullable: true })
  nombre: string;
  // Descripcion de la complicacion
  @Column({ name: 'DESCRIPCION', nullable: true })
  descripcion: string;
  @Column({ name: 'NOMBREESAVIREPORTADO', nullable: true })
  nombreReportado: string;
  //Deberia ser catalogo
  @Column({ name: 'CTLLTMEDDRA_ID', nullable: true })
  CTLLTMEDDRA_ID: number;

  @Column({ name: 'CODIGOLLT', nullable: true })
  codigoLLT: string;

  @Column({ name: 'NAMELLT', nullable: true })
  nameLLT: string;

  @Column({ name: 'CTPTMEDDRA_ID', nullable: true })
  CTPTMEDDRA_ID: number;

  @Column({ name: 'CODIGOPT', nullable: true })
  codigoPT: string;

  @Column({ name: 'NAMEPT', nullable: true })
  namePT: string;

  @Column({ name: 'CODIGOHLT', nullable: true })
  codigoHLT: string;

  @Column({ name: 'NAMEHLT', nullable: true })
  nameHLT: string;

  @Column({ name: 'CODIGOHLGT', nullable: true })
  codigoHLGT: string;
  @Column({ name: 'NAMEHLGT', nullable: true })
  nameHLGT: string;

  @Column({ name: 'CTHLTMEDDRA_ID', nullable: true })
  CTHLTMEDDRA_ID: number;
  @Column({ name: 'CTHLGTMEDDRA_ID', nullable: true })
  CTHLGTMEDDRA_ID: number;
  @Column({ name: 'CTSOCMEDDRA_ID', nullable: true })
  CTSOCMEDDRA_ID: number;

  @Column({ name: 'CODIGOSOC', nullable: true })
  codigoSOC: string;

  @Column({ name: 'NAMESOC', nullable: true })
  nameSOC: string;
  ////////////////////////////////////////////
  @Column({ name: 'CODIGOESAVICIE10', nullable: true })
  codigoEsaviCie10: string;
  @Column({ name: 'FECHAESAVI', nullable: true })
  fechaEsavi: Date;
  @Column({ name: 'FECHAFINALIZACION', nullable: true })
  fechaFinalizacion: Date;
  @Column({ name: 'DURACION', nullable: true })
  duracion: string;
  @Column({ name: 'RESULTADO', nullable: true })
  resultado: string;

  @Column({ name: 'COGIDOCASO', nullable: true })
  codigoCaso: string;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
