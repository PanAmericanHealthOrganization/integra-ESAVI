import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria, IAuditoria } from './auditoria.entity';

/**
 * Índices compuestos para optimizar consultas comunes de paginación y filtrado
 */
@Index('IDX_VACUNOMETRO_FECHA_NOMBRE', ['fechaAplicacion', 'nombreVacuna'])
@Index('IDX_VACUNOMETRO_UNICODIGO_FECHA', ['unicodigo', 'fechaAplicacion'])
@Index('IDX_VACUNOMETRO_CREATED_AT', ['createdAt'])
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
  @Index('IDX_VACUNOMETRO_UNICODIGO')
  @Column({
    name: 'UNICODE',
    comment: 'Código único del establecimiento de salud',
  })
  unicodigo: string;

  /**
   *
   */
  @Index('IDX_VACUNOMETRO_FECHA_APLICACION')
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
  @Index('IDX_VACUNOMETRO_GRUPO_ETARIO')
  @Column({
    name: 'GRUPO_ETARIO',
    nullable: false,
    comment: 'Grupo etario de las personas vacunada',
  })
  grupoEtario: number;

  /**
   *
   */
  @Index('IDX_VACUNOMETRO_NOMBRE_VACUNA')
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
  grupoEtario: number;
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
  grupoEtario: number;

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
