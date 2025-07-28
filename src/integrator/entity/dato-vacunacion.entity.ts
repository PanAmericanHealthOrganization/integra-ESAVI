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
import { Catalogo } from './catalogo.entity';
import * as moment from 'moment/moment';

@Entity({ schema: 'dhi_esavi' , name: 'TR_DATOVACUNACION' })
export class DatoVacunacion extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'DATOVACUNACION_ID' })
  id: string;
  
  @Column({ name: 'NOMBREVACUNATORIO', length: 128 , nullable: true })
  nombreVacunatorio: string;
  @Column({ name: 'FECHAVACUNACION', nullable: true })
  fechaVacunacion: Date;
  @Column({ name: 'HORAVACUNACION', nullable: true })
  horaVacunacion: Date;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTPROVINCIAVACUNATORIO_ID' })
  provincia: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTCANTONNOTIFICADOR_ID' })
  canton: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTPARROQUIANOTIFICADOR_ID' })
  parroquia: Catalogo;
  @Column({ name: 'OTRAPARROQUIANOTIFICADOR', length: 128, nullable: true })
  otraParroquia: string;
  @Column({ name: 'DIRECCIONVACUNATORIO', length: 128, nullable: true })
  direccion: string;
  @Column({ name: 'CODIGOMECANISMOVERIFICACION', length: 16, nullable: true })
  codigoMecanismoVerificacion: string;
  @Column({
    name: 'NOMBREOTROMECANISMOVERIFICACION',
    length: 128,
    nullable: true,
  })
  nombreOtroMecanismo: string;
  @Column({ name: 'FECHARECONSTITUCIONVACUNA', nullable: true })
  fechaReconstitucion: Date;
  @Column({ name: 'HORARECONSTITUCIONVACUNA', nullable: true })
  horaReconstitucion: Date;
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
