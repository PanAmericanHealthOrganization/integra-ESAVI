import { CustomBaseEntity } from 'src/utils/interfaces/baseEntity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 *
 */
@Entity({
  schema: 'dhi_esavi',
  name: 'TR_VACUNOMETRO',
  comment: 'Conteo de vacunas para el analisis de los datos',
})
export class Vacunometro extends CustomBaseEntity implements IVacunometro {
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
  dosisAplicada: number;
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

export interface IVacunometro {
  id: string;
  unicode: string;
  nombreVacuna: string;
  dosisAplicada: number;
  diaAplicacion: number;
  mesAplicacion: number;
  anioAplicacion: number;
  fechaAplicacion: Date;
  sexo: string;
  total: number;
}
