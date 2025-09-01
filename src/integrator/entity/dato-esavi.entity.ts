import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Notificacion } from './notificacion.entity';
import { Auditoria } from './auditoria.entity';
import * as moment from 'moment/moment';

@Entity({ schema: 'dhi_esavi', name: 'TR_DATOS_ESAVI', comment: 'Tabla de datos del ESAVI' })
export class DatoEsavi extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'DATOS_ESAVI_ID' })
  id: string;
  /**
   *
   */
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;
  /**
   *
   */
  @Column({
    name: 'SISTEMA_DE_CODIFICACION',
    nullable: true,
    comment:
      'Sistema de codificación utilizado para el ESAVI (ej: MedDRA, CIE-10)',
  })
  sistemaCodififacion: string;
  @Column({
    name: 'NOMBRE_ESAVI',
    nullable: true,
    comment:
      'Nombre del evento supuestamente atribuido a la vacunación o inmunización',
  })
  nombre: string;
  /**
   *
   */
  @Column({
    name: 'DESCRIPCION',
    nullable: true,
    comment: 'Descripción detallada de la complicación o evento adverso',
  })
  descripcion: string;
  /**
   *
   */
  @Column({
    name: 'NOMBRE_ESAVI_REPORTADO',
    nullable: true,
    comment: 'Nombre del ESAVI tal como fue reportado inicialmente',
  })
  nombreReportado: string;
  /**
   *
   */
  @Column({
    name: 'CT_LLT_MEDDRA_ID',
    nullable: true,
    comment: 'ID del catálogo LLT (Lowest Level Term) de MedDRA',
  })
  CTLLTMEDDRA_ID: number;
  /**
   *
   */
  @Column({
    name: 'CODIGO_LLT',
    nullable: true,
    comment: 'Código del término de nivel más bajo (LLT) en MedDRA',
  })
  codigoLLT: string;

  @Column({
    name: 'NAME_LLT',
    nullable: true,
    comment: 'Nombre del término de nivel más bajo (LLT) en MedDRA',
  })
  nameLLT: string;
  /**
   *
   */
  @Column({
    name: 'CT_PT_MEDDRA_ID',
    nullable: true,
    comment: 'ID del catálogo PT (Preferred Term) de MedDRA',
  })
  CTPTMEDDRA_ID: number;

  @Column({
    name: 'CODIGO_PT',
    nullable: true,
    comment: 'Código del término preferido (PT) en MedDRA',
  })
  codigoPT: string;

  @Column({
    name: 'NAME_PT',
    nullable: true,
    comment: 'Nombre del término preferido (PT) en MedDRA',
  })
  namePT: string;

  @Column({
    name: 'CODIGO_HLT',
    nullable: true,
    comment: 'Código del término de alto nivel (HLT) en MedDRA',
  })
  codigoHLT: string;

  @Column({
    name: 'NAME_HLT',
    nullable: true,
    comment: 'Nombre del término de alto nivel (HLT) en MedDRA',
  })
  nameHLT: string;

  @Column({
    name: 'CODIGO_HLGT',
    nullable: true,
    comment: 'Código del grupo de términos de alto nivel (HLGT) en MedDRA',
  })
  codigoHLGT: string;
  @Column({
    name: 'NAME_HLGT',
    nullable: true,
    comment: 'Nombre del grupo de términos de alto nivel (HLGT) en MedDRA',
  })
  nameHLGT: string;

  @Column({
    name: 'CT_HLT_MEDDRA_ID',
    nullable: true,
    comment: 'ID del catálogo HLT (High Level Term) de MedDRA',
  })
  CTHLTMEDDRA_ID: number;
  @Column({
    name: 'CT_HLGT_MEDDRA_ID',
    nullable: true,
    comment: 'ID del catálogo HLGT (High Level Group Term) de MedDRA',
  })
  CTHLGTMEDDRA_ID: number;
  @Column({
    name: 'CT_SOC_MEDDRA_ID',
    nullable: true,
    comment: 'ID del catálogo SOC (System Organ Class) de MedDRA',
  })
  CTSOCMEDDRA_ID: number;

  @Column({
    name: 'CODIGO_SOC',
    nullable: true,
    comment: 'Código de la clase de sistema orgánico (SOC) en MedDRA',
  })
  codigoSOC: string;

  @Column({
    name: 'NAME_SOC',
    nullable: true,
    comment: 'Nombre de la clase de sistema orgánico (SOC) en MedDRA',
  })
  nameSOC: string;
  ////////////////////////////////////////////
  @Column({
    name: 'CODIGO_ESAVI_CIE10',
    nullable: true,
    comment: 'Código del ESAVI según clasificación CIE-10',
  })
  codigoEsaviCie10: string;
  @Column({
    name: 'FECHA_ESAVI',
    nullable: true,
    comment:
      'Fecha de inicio del evento supuestamente atribuido a la vacunación',
  })
  fechaEsavi: Date;
  @Column({
    name: 'FECHA_FINALIZACION',
    nullable: true,
    comment: 'Fecha de finalización o resolución del ESAVI',
  })
  fechaFinalizacion: Date;
  @Column({
    name: 'DURACION_EVENTO',
    nullable: true,
    comment: 'Duración del evento adverso',
  })
  duracion: string;
  @Column({
    name: 'RESULTADO_EVENTO',
    nullable: true,
    comment: 'Resultado o desenlace del evento adverso',
  })
  resultado: string;

  @Column({
    name: 'COGIDOCASO',
    nullable: true,
    comment: 'Código único del caso reportado',
  })
  codigoCaso: string;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
