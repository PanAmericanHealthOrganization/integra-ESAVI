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

@Entity({
  schema: 'dhi_esavi',
  name: 'TR_DATO_VACUNACION',
  comment: 'Tabla de datos de vacunación',
})
export class Vacunacion extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;
  @Column({ 
    name: 'FECHA_VACUNACION', 
    nullable: true,
    comment: 'Fecha de vacunación',
   })
  fechaVacunacion: Date;

  @Column({ 
    name: 'HORA_VACUNACION', 
    nullable: true,
    comment: 'Hora de vacunación',
   })
  horaVacunacion: Date;

  @Column({ 
    name: 'FECHA_RECONSTITUCION_VACUNA', 
    nullable: true,
    comment: 'Fecha de reconstitución de la vacuna',
  })
  fechaReconstitucion: Date;

  @Column({ 
    name: 'HORA_RECONSTITUCION_VACUNA', 
    nullable: true, 
    comment: 'Hora de reconstitución de la vacuna', 
  })
  horaReconstitucion: Date;
  /////////////////Se puede crear una entidad llamada vacunatorio/////////
  // @Column()
  // nombreVacunatorio: string;
  @Column({ nullable: true })
  direccionVacunatorio: string;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_PROVINCIA_VACUNATORIO_ID' })
  provincia: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_CANTON_VACUNATORIO_ID' })
  canton: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_PARROQUIA_VACUNATORIO_ID' })
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
