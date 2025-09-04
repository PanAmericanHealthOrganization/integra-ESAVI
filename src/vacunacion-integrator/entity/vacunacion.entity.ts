import { Column, Entity, PrimaryColumn } from 'typeorm';

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
  @Column({ name: 'ANIO_APLICACION' })
  anio_aplicacion: number;

  /**
   *
   */
  @Column({ name: 'MES_APLICACION' })
  mes_aplicacion: number;

  /**
   * Column  of vacunacion nominal
   */
  @Column({ name: 'DOSIS_APLICADA' })
  dosis_aplicada: number;

  /**
   *
   */
  @Column({ name: 'FECHA_APLICACION' })
  fecha_aplicacion: Date;

  /**
   * Column  of vacunacion nominal
   */
  @Column({ name: 'NOMBRE_VACUNA' })
  nombre_vacuna: string;

  /**
   * Column  of vacunacion nominal
   */
  @Column({ name: 'UNICODIGO' })
  unicodigo: string;

  @Column({ name: 'SEXO' })
  sexo: string;

  @Column({ name: 'LOTE_VACUNA' })
  lote_vacuna: string;

  @Column({ name: 'UNI_NOMBRE' })
  uni_nombre: string;
}
