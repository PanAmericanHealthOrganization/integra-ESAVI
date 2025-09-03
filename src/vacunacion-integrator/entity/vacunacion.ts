import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  schema: 'HCUE_VACUNACION_DEPURADA',
  name: 'DB_VACUNACION_CONSOLIDADA_DEPURADA_COVID',
})
export class VacunacionNominal {
  @PrimaryColumn({ name: 'ID_VAC_DEPU' })
  id_vac_depu: string;
  @Column({ name: 'ANIO_APLICACION' })
  anio_aplicacion: number;
  @Column({ name: 'MES_APLICACION' })
  mes_aplicacion: number;
  @Column({ name: 'DIA_APLICACION' })
  dia_aplicacion: number;
  @Column({ name: 'FECHA_APLICACION' })
  fecha_aplicacion: Date;
  @Column({ name: 'PUNTO_VACUNACION' })
  punto_vacunacion: string;
  @Column({ name: 'UNICODIGO' })
  unicodigo: string;
  @Column({ name: 'UNI_NOMBRE' })
  uni_nombre: string;
  @Column({ name: 'ZONA' })
  zona: string;
  @Column({ name: 'DISTRITO' })
  distrito: string;
  @Column({ name: 'PROVINCIA' })
  provincia: string;
  @Column({ name: 'CANTON' })
  canton: string | null | undefined;
  @Column({ name: 'APELLIDOS' })
  apellidos: string;
  @Column({ name: 'NOMBRES' })
  nombres: string;
  @Column({ name: 'NOMBRES_COMPLETOS' })
  nombres_completos: string;
  @Column({ name: 'TIPO_IDEN' })
  tipo_iden: string;
  @Column({ name: 'NUM_IDEN' })
  num_iden: string;
  @Column({ name: 'SEXO' })
  sexo: string;
  @Column({ name: 'ANIO_NACIMIENTO' })
  anio_nacimiento: number;
  @Column({ name: 'MES_NACIMIENTO' })
  mes_nacimiento: number;
  @Column({ name: 'DIA_NACIMIENTO' })
  dia_nacimiento: number;
  @Column({ name: 'FECHA_NACIMIENTO' })
  fecha_nacimiento: Date;
  @Column({ name: 'NACIONALIDAD' })
  nacionalidad: string;
  @Column({ name: 'ETNIA' })
  etnia: string;
  @Column({ name: 'POBLA_VACUNA' })
  pobla_vacuna: string;
  @Column({ name: 'GRUPO_RIESGO' })
  grupo_riesgo: string;
  @Column({ name: 'NOMBRE_VACUNA' })
  nombre_vacuna: string;
  @Column({ name: 'LOTE_VACUNA' })
  lote_vacuna: string;
  @Column({ name: 'DOSIS_APLICADA' })
  dosis_aplicada: number;
  @Column({ name: 'PROFESIONAL_APLICA' })
  profesional_aplica: string;
  @Column({ name: 'IDEN_PROFESIONAL_APLICA' })
  iden_profesional_aplica: string;
  @Column({ name: 'FASE_VACUNA' })
  fase_vacuna: string;
  @Column({ name: 'FASE_VACUNA_DEPURADA' })
  fase_vacuna_depurada: string;
  @Column({ name: 'GRUPO_RIESGO_DEPURADA' })
  grupo_riesgo_depurada: string;
  @Column({ name: 'EDAD_ANIOS' })
  edad_anios: number;
  @Column({ name: 'SISTEMA' })
  sistema: string;
  @Column({ name: 'REGISTRO_CIVIL' })
  registro_civil: string;
  @Column({ name: 'ID_VAC_CONS' })
  id_vac_cons: string;
}
