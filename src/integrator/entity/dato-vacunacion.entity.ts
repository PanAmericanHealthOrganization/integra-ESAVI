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

@Entity({
  schema: 'dhi_esavi',
  name: 'TR_DATOVACUNACION',
  comment: 'Tabla de datos de vacunación',
})
export class DatoVacunacion extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', { name: 'DATOVACUNACION_ID' })
  id: string;

  /**
   *
   */
  @Column({
    name: 'NOMBRE_VACUNATORIO',
    length: 128,
    nullable: true,
    comment: 'Nombre del establecimiento donde se aplicó la vacuna',
  })
  nombreVacunatorio: string;
  /**
   *
   */
  @Column({
    name: 'FECHA_VACUNACION',
    nullable: true,
    comment: 'Fecha en que se administró la vacuna',
  })
  fechaVacunacion: Date;
  /**
   *
   */
  @Column({
    name: 'HORA_VACUNACION',
    nullable: true,
    comment: 'Hora en que se administró la vacuna',
  })
  horaVacunacion: Date;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_PROVINCIA_VACUNATORIO_ID' })
  provincia: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_CANTON_NOTIFICADOR_ID' })
  canton: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_PARROQUIA_NOTIFICADOR_ID' })
  parroquia: Catalogo;

  /**
   *
   */
  @Column({
    name: 'OTRAPARROQUIANOTIFICADOR',
    length: 128,
    nullable: true,
    comment:
      'Otra parroquia no contemplada en catálogo donde se ubica el vacunatorio',
  })
  otraParroquia: string;
  /**
   *
   */
  @Column({
    name: 'DIRECCIONVACUNATORIO',
    length: 128,
    nullable: true,
    comment: 'Dirección completa del vacunatorio',
  })
  direccion: string;
  /**
   *
   */
  @Column({
    name: 'CODIGOMECANISMOVERIFICACION',
    length: 16,
    nullable: true,
    comment: 'Código del mecanismo utilizado para verificar la vacunación',
  })
  codigoMecanismoVerificacion: string;

  /**
   *
   */
  @Column({
    name: 'NOMBREOTROMECANISMOVERIFICACION',
    length: 128,
    nullable: true,
    comment: 'Nombre de otro mecanismo de verificación no contemplado',
  })
  nombreOtroMecanismo: string;
  /**
   *
   */
  @Column({
    name: 'FECHARECONSTITUCIONVACUNA',
    nullable: true,
    comment: 'Fecha de reconstitución de la vacuna',
  })
  fechaReconstitucion: Date;
  /**
   *
   */
  @Column({
    name: 'HORARECONSTITUCIONVACUNA',
    nullable: true,
    comment: 'Hora de reconstitución de la vacuna',
  })
  horaReconstitucion: Date;

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
