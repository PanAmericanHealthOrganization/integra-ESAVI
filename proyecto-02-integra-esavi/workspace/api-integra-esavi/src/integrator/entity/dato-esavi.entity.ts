import {Column,Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn} from 'typeorm';
import {Auditoria} from './auditoria.entity';
import {Notificacion} from './notificacion.entity';

@Entity({ schema: 'DHI_ESAVI', name: 'TR_DATOS_ESAVI', comment: 'Tabla de datos del ESAVI' })
export class DatoEsavi extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador PK de la tabla TR_DATOS_ESAVI' })
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
    default: 'MedDRA',
    nullable: true,
    comment: 'Sistema de codificación utilizado para el ESAVI (ej: MedDRA, CIE-10)',
  })
  sistemaCodififacion: string;
  /**
   *
   */
  @Column({
    name: 'NOMBRE_ESAVI',
    nullable: true,
    comment: 'Nombre del evento supuestamente atribuido a la vacunación o inmunización',
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
    name: 'CODIGO_CIE10',
    nullable: true,
    comment: 'Código del ESAVI según clasificación CIE-10',
  })
  codigoEsaviCie10: string; 
  
  /**
   * 
   */
  @Column({
    name: 'CODIGO_LLT',
    nullable: true,
    comment: 'Código llt',
  })
  codigoLlt: string; 

  /**
   * 
   */
  @Column({
    name: 'FECHA_ESAVI',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha de inicio del evento supuestamente atribuido a la vacunación',
  })
  fechaEsavi: Date;
  
  /**
   * 
   */
  @Column({
    name: 'FECHA_FINALIZACION',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha de finalización o resolución del ESAVI',
  })
  fechaFinalizacion: Date;
  
  /**
   * 
   */
  @Column({
    name: 'DURACION_EVENTO',
    nullable: true,
    comment: 'Duración del evento adverso',
  })
  duracion: string;
  
  /**
   * 
   */
  @Column({
    name: 'RESULTADO_EVENTO',
    nullable: true,
    comment: 'Resultado o desenlace del evento adverso',
  })
  resultado: string;

  
  /**
   * 
   */
  @Column({
    name: 'COGIDO_CASO',
    nullable: true,
    comment: 'Código único del caso reportado',
  })
  codigoCaso: string;

  /**
   * 
   */
  @Column({
    name: 'GRAVEDAD',
    nullable: true,
    comment: 'Gravedad del caso',
  })
  gravedad: string;
}
