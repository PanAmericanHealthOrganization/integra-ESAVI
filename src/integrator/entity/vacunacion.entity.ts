import { Auditoria } from './auditoria.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Notificacion } from './notificacion.entity';
import { Catalogo } from './catalogo.entity';
import * as moment from 'moment/moment';

@Entity({ schema: 'dhi_esavi' , name: 'TR_DATOVACUNACION' })
export class Vacunacion extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'DATOVACUNACION_ID' })
  id: string;
  @Column({ name: 'FECHAVACUNACION' , nullable : true })
  fechaVacunacion: Date;
  @Column({ name: 'HORAVACUNACION' ,  nullable : true})
  horaVacunacion: Date;
  @Column({ name: 'FECHARECONSTITUCIONVACUNA' , nullable : true })
  fechaReconstitucion: Date;
  @Column({ name: 'HORARECONSTITUCIONVACUNA'  , nullable : true })
  horaReconstitucion: Date;
  /////////////////Se puede crear una entidad llamada vacunatorio/////////
  // @Column()
  // nombreVacunatorio: string;
  @Column({nullable : true})
  direccionVacunatorio: string;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTPROVINCIAVACUNATORIO_ID' })
  provincia: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTCANTONNOTIFICADOR_ID' })
  canton: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTPARROQUIANOTIFICADOR_ID' })
  parroquia: Catalogo;
  ////////////////////////////////////
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
