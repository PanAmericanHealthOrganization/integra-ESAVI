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
    name: 'VACUNOMETRO_ID',
    comment: 'ID de la vacuna',
  })
  id: string;

  /**
   *
   */
  @Column({
    name: 'UNICODE',
    comment: 'Código único del establecimiento de salud',
  })
  unicode: string;

  /** */

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
    name: 'DOSIS_APLICADA',
    nullable: true,
    comment: 'Dosis aplicada',
  })
  dosisAplicada: string;
  /**
   *
   */
  @Column({
    name: 'DIA_APLICACION',
    nullable: true,
    comment: 'Día de aplicación',
  })
  diaAplicacion: number;
  /**
   *
   */
  @Column({
    name: 'MES_APLICACION',
    nullable: true,
    comment: 'Mes de aplicación',
  })
  mesAplicacion: number;
  /**
   *
   */
  @Column({
    name: 'ANIO_APLICACION',
    nullable: true,
    comment: 'Año de aplicación',
  })
  anioAplicacion: number;
  /**
   *
   */
  @Column({
    name: 'FECHA_APLICACION',
    nullable: true,
    comment: 'Fecha de aplicación',
  })
  fechaAplicacion: Date;
  /**
   *
   */
  @Column({
    name: 'SEXO',
    nullable: true,
    comment: 'Sexo de la persona vacunada',
  })
  sexo: string;
  /**
   *
   */
  @Column({
    name: 'CANTIDAD_VACUNAS',
    nullable: true,
    comment: 'Cantidad de vacunas aplicadas',
  })
  total: number;
}

export interface IVacunometro extends IAuditoria {
  id: string;
  unicode: string;
  nombreVacuna: string;
  dosisAplicada: string;
  diaAplicacion: number;
  mesAplicacion: number;
  anioAplicacion: number;
  fechaAplicacion: Date;
  sexo: string;
  total: number;
}

export class VacunometroDto extends Auditoria implements IVacunometro {
  @ApiProperty()
  id: string;
  @ApiProperty()
  unicode: string;
  @ApiProperty()
  nombreVacuna: string;
  @ApiProperty()
  dosisAplicada: string;
  @ApiProperty()
  diaAplicacion: number;
  @ApiProperty()
  mesAplicacion: number;
  @ApiProperty()
  anioAplicacion: number;
  @ApiProperty()
  fechaAplicacion: Date;
  @ApiProperty()
  sexo: string;
  @ApiProperty()
  total: number;
}

/**
 *
 */

export class VacunometroCreateDto extends OmitType(VacunometroDto, ['id']) {}
