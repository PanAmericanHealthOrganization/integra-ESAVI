import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 *
 */
@Entity({
  name: 'DB_VACUNACION_CONSOLIDADA_DEPURADA_COVID',
  schema: 'HCUE_VACUNACION_DEPURADA',
})
export class VacunacionNominal {
  /**
   *
   */
  @PrimaryColumn({ name: 'ID_VAC_DEPU' })
  id_vac_depu: string;

  /**
   *
   */
  @Column({ name: 'ANIO_APLICACION', comment: 'Año de aplicación' })
  anio_aplicacion: number;

  /**
   *
   */
  @Column({ name: 'MES_APLICACION', comment: 'Mes de aplicación' })
  mes_aplicacion: number;

  /**
   *
   */
  @Column({ name: 'DIA_APLICACION', comment: 'Día de aplicación' })
  dia_aplicacion: number;

  /**
   * Column  of vacunacion nominal
   */
  @Column({ name: 'DOSIS_APLICADA', comment: 'Dosis aplicada' })
  dosis_aplicada: number;

  /**
   *
   */
  @Column({ name: 'FECHA_APLICACION', comment: 'Fecha de aplicación' })
  fecha_aplicacion: Date;

  /**
   * Column  of vacunacion nominal
   */
  @Column({ name: 'NOMBRE_VACUNA', comment: 'Nombre de la vacuna' })
  nombre_vacuna: string;

  /**
   * Column  of vacunacion nominal
   */
  @Column({ name: 'UNICODIGO', comment: 'Código único' })
  unicodigo: string;

  /**
   *
   */
  @Column({ name: 'SEXO', comment: 'Sexo' })
  sexo: string;

  /**
   *
   */
  @Column({ name: 'LOTE_VACUNA', comment: 'Lote de vacuna' })
  lote_vacuna: string;

  /**
   *
   */
  @Column({ name: 'UNI_NOMBRE', comment: 'Nombre de la unidad' })
  uni_nombre: string;
}
