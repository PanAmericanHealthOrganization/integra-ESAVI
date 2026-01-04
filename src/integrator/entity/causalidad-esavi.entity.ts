import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { DatoEsavi } from './dato-esavi.entity';
import { DatoVacuna } from './dato-vacuna.entity';
import { Notificacion } from './notificacion.entity';

@Entity({ schema: 'dhi_esavi', name: 'TR_CAUSALIDAD_ESAVI', comment: 'Tabla de causalidad del ESAVI' })
export class CausalidadEsavi extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @ManyToOne(() => DatoEsavi)
  @JoinColumn({ name: 'DATOSESAVI_ID' })
  datoEsavi: DatoEsavi;

  @ManyToOne(() => DatoVacuna)
  @JoinColumn({ name: 'DATOVACUNA_ID' })
  datoVacuna: DatoVacuna;

  @Column({
    name: 'FECHA_CAUSALIDAD_ESAVI',
    nullable: true,
    comment: 'Fecha de evaluación de la causalidad del ESAVI',
  })
  fechaCausalidadEsavi: Date;

  @Column({
    name: 'SISTEMA_CLASF_CAUSALIDAD',
    length: 16,
    nullable: true,
    comment: 'Sistema de clasificación de causalidad utilizado',
  })
  sistemaClasificacionCausalidad: string;

  @Column({
    name: 'OTRO_SISTEMA_CLASF_CAUSALIDAD',
    length: 16,
    nullable: true,
    comment: 'Otro sistema de clasificación de causalidad no contemplado',
  })
  otroSistemaClasificacionCausalidad: string;

  @Column({
    name: 'CLASIFICACION_CAUSA_ESAVI',
    type: 'text', //En el origen se captura como boolean pero en dhis2 se almacena como texto true=1 y false=0
    nullable: true,
    comment: 'Variable booleana que almacena la respuesta a la pregunta: ¿Caso analizado por comité ESAVI?',
  })
  clasificacionCausaEsavi: string; //Recordar que desde dhis2 ya viene el texto true=1 y false=0

  @Column({
    name: 'CLASIFICACION_DE_CAUSALIDAD_WHO_AEFI',
    type: 'text',//length: 16,
    nullable: true,
    comment: 'Clasificación de causalidad según WHO-AEFI',
  })
  clasificacionCausalidadWHOAEFI: string;

  @Column({
    name: 'CLASIFICACION_DE_CAUSALIDAD_WHO_UMC',
    length: 16,
    nullable: true,
    comment: 'Clasificación de causalidad según WHO-UMC',
  })
  clasificacionCausalidadWHOUMC: string;

  @Column({
    name: 'REFERENCIA_IDENTIFICADOR_VACUNA',
    nullable: true,
    comment: 'Referencia al identificador de la vacuna evaluada',
  })
  referenciaIdentificadorVacuna: number;

  @Column({
    name: 'CLASIFICACION_DE_CAUSALIDAD_NARANJO',
    length: 16,
    nullable: true,
    comment: 'Clasificación de causalidad según escala de Naranjo',
  })
  clasificacionCausalidadNaranjo: string;

  //Campos nuevos: CODIGO_DXFINAL_CIE10, CODIGO_DXFINAL_MEDDRA_LLT
  @Column({
    name: 'CODIGO_DXFINAL_CIE10',
    nullable: true,
    comment: 'Código CIE-10 del diagnóstico final.',
  })
  codigoDxFinalCie10: string;
  @Column({
    name: 'CODIGO_DXFINAL_MEDDRA_LLT',
    nullable: true,
    comment: 'Código LLT MedDRA del diagnóstico final.',
  })
  codigoDxFinalMeddraLlt: string;

  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;
}
