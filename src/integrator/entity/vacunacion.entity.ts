import { OmitType } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Catalogo } from './catalogo.entity';
import { Notificacion } from './notificacion.entity';

/**
 * Entity for vacunacion
 */
@Entity({
  schema: 'dhi_esavi',
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
   * Column  of vacunacion
   */
  @Column({ nullable: true, name: 'DIRECCION_VACUNATORIO', comment: 'Dirección del vacunatorio' })
  direccionVacunatorio: string;

  /**
   * Many to one of vacunacion
   */
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_PROVINCIA_VACUNATORIO_ID' })
  provincia: Catalogo;

  /**
   * Many to one of vacunacion
   */
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_CANTON_VACUNATORIO_ID' })
  canton: Catalogo;

  /**
   * Many to one of vacunacion
   */
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_PARROQUIA_VACUNATORIO_ID' })
  parroquia: Catalogo;

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
  direccionVacunatorio: string;
  provincia: Catalogo;
  canton: Catalogo;
  parroquia: Catalogo;
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
  direccionVacunatorio: string;
  provincia: Catalogo;
  canton: Catalogo;
  parroquia: Catalogo;
  notificacion: Notificacion;
}

/**
 *
 */
export class VacunacionCreateDto extends OmitType(VacunacionDto, ['id']) {}
