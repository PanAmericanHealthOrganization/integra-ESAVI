import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria, IAuditoria } from './auditoria.entity';

/**
 *
 */
@Entity({
  schema: 'dhi_esavi',
  name: 'TR_VACUNOMETRO',
  comment: 'Conteo de vacunas para el analisis de los datos',
})
export class Vacunometro extends Auditoria implements IVacunometro {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador único del registro de vacunómetro',
  })
  id: string;

  /**
   *
   */
  @Column({
    name: 'UNICODE',
    comment: 'Código único del establecimiento de salud',
  })
  unicodigo: string;

  /**
   *
   */
  @Column({
    name: 'FECHA_APLICACION',
    nullable: false,
    comment: 'Fecha de aplicación',
    type: 'timestamp',
  })
  fechaAplicacion: Date;

  /**
   *
   */
  @Column({
    name: 'NOMBRE_VACUNA',
    comment: 'Nombre de la vacuna',
  })
  nombreVacuna: string;
  /**
   *
   */
  @Column({
    name: 'TOTAL_HOMBRES',
    nullable: false,
    comment: 'Sexo de la persona vacunada',
  })
  totalHombres: number;
  /**
   *
   */
  @Column({
    name: 'TOTAL_MUJERES',
    nullable: false,
    comment: 'Sexo de la persona vacunada',
  })
  totalMujeres: number;
  /**
   *
   */
  @Column({
    name: 'TOTAL_VACUNADOS',
    nullable: false,
    comment: 'Cantidad de vacunas aplicadas',
  })
  total: number;
}

export interface IVacunometro extends IAuditoria {
  id: string;
  unicodigo: string;
  nombreVacuna: string;
  fechaAplicacion: Date;
  totalHombres: number;
  totalMujeres: number;
  total: number;
}

/**
 *
 */
export class VacunometroDto extends Auditoria implements IVacunometro {
  /**
   *
   */
  @ApiProperty()
  id: string;

  /**
   *
   */
  @ApiProperty()
  unicodigo: string;

  /**
   *
   */
  @ApiProperty()
  nombreVacuna: string;

  /**
   *
   */
  @ApiProperty()
  fechaAplicacion: Date;

  /**
   *
   */
  @ApiProperty()
  totalHombres: number;

  /**
   *
   */
  @ApiProperty()
  totalMujeres: number;

  /**
   *
   */
  @ApiProperty()
  total: number;
}

/**
 *
 */

export class VacunometroCreateDto extends OmitType(VacunometroDto, [
  'id',
  //Se deben omitir los campos de CustomBaseEntity, que son implementados desde "IBaseEntity" que no se envían al crear
  'isEnabled',
  'isActive',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'deletedAt',
  'deletedBy',
] as const) {}

export class VacunometroUpdateDto extends OmitType(VacunometroDto, [
  'id',
  //Se deben omitir los campos de CustomBaseEntity, que son implementados desde "IBaseEntity" que no se envían al crear
  'isEnabled',
  'isActive',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'deletedAt',
  'deletedBy',
] as const) {}
