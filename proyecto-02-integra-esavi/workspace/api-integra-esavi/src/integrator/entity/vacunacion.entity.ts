import { OmitType } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Establecimiento } from './establecimiento.entity';
import { Notificacion } from './notificacion.entity';

/**
 * Entity for vacunacion
 */
@Entity({
  schema: 'DHI_ESAVI',
  name: 'TR_DATO_VACUNACION',
  comment: 'Tabla de datos de vacunación',
})
export class Vacunacion extends Auditoria implements IVacunacion {
  /**
   * Primary generated column of vacunacion
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador único de la vacunación' })
  id: string;

  /**
   * Column  of vacunacion
   */
  @Column({
    name: 'FECHA_VACUNACION',
    nullable: true,
    comment: 'Fecha de vacunación',
  })
  fechaVacunacion: Date;

  /**
   * Column  of vacunacion
   */
  @Column({
    name: 'HORA_VACUNACION',
    nullable: true,
    comment: 'Hora de vacunación',
  })
  horaVacunacion: Date;

  /**
   * Column  of vacunacion
   */
  @Column({
    name: 'FECHA_RECONSTITUCION_VACUNA',
    nullable: true,
    comment: 'Fecha de reconstitución o dilución de la vacuna',
  })
  fechaReconstitucion: Date;

  /**
   * Column  of vacunacion
   */
  @Column({
    name: 'HORA_RECONSTITUCION_VACUNA',
    nullable: true,
    comment: 'Hora de reconstitución o dilución de la vacuna',
  })
  horaReconstitucion: Date;

  /**
   * Establecimiento donde se administró la vacuna (referenciado por unicodigo).
   * Cuando el vacunatorio no está en el catálogo de establecimientos, usar otraDireccion.
   */
  @ManyToOne(() => Establecimiento, { nullable: true, eager: false })
  @JoinColumn({ name: 'ESTABLECIMIENTO_UNI_CODIGO', referencedColumnName: 'uniCodigo' })
  establecimiento: Establecimiento;

  /**
   * Dirección libre del vacunatorio cuando no corresponde a un establecimiento registrado
   */
  @Column({
    name: 'OTRA_DIRECCION_VACUNATORIO',
    type: 'varchar',
    length: 1200,
    nullable: true,
    comment: 'Dirección del vacunatorio cuando no está registrado como establecimiento',
  })
  otraDireccion: string;

  /**
   * Many to one of vacunacion
   */
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;
}

/**
 *
 */
export interface IVacunacion {
  id: string;
  fechaVacunacion: Date;
  horaVacunacion: Date;
  fechaReconstitucion: Date;
  horaReconstitucion: Date;
  establecimiento: Establecimiento;
  otraDireccion: string;
  notificacion: Notificacion;
}

/**
 *
 */
export class VacunacionDto implements IVacunacion {
  id: string;
  fechaVacunacion: Date;
  horaVacunacion: Date;
  fechaReconstitucion: Date;
  horaReconstitucion: Date;
  establecimiento: Establecimiento;
  otraDireccion: string;
  notificacion: Notificacion;
}

/**
 *
 */
export class VacunacionCreateDto extends OmitType(VacunacionDto, ['id']) {}
