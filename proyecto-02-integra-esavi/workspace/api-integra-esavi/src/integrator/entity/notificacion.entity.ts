import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {SourceEnum} from '../enum/source-enum';
import {Auditoria} from './auditoria.entity';
import {CatalogoPadre} from './catalogo-padre.entity';
import {Establecimiento} from './establecimiento.entity';
import {GravedadEsavi} from './gravedad-esavi.entity';
import {Notificador} from './notificador.entity';
import {Paciente} from './paciente.entity';
import {Parroquia} from './parroquia.entity';

@Entity({
  schema: 'DHI_ESAVI',
  name: 'TR_NOTIFICACION',
  comment: 'Tabla de notificaciones',
})
export class Notificacion extends Auditoria {
  /**
   * Primary generated column of notificacion
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador único de la notificación' })
  id: string;

  /**
   *
   */
  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'PACIENTE_ID' })
  paciente: Paciente;

  @ManyToOne(() => Parroquia, { nullable: true })
  @JoinColumn({ name: 'CTPARROQUIA_CODIGO', referencedColumnName: 'codigo' })
  parroquiaResidencia: Parroquia;

  /**
   * De dónde salió la parroquia de residencia.
   *
   * No todas las residencias valen lo mismo. La declarada en el formulario es un dato del
   * paciente; la derivada del establecimiento es una aproximación —la gente suele atenderse
   * cerca de casa, pero no siempre—. Mezclarlas sin distinguirlas haría que un brote
   * aparente pudiera ser, en realidad, la parroquia donde está el centro de salud.
   *
   * Se propaga hasta `datos_procesados` del datamart para que el tablero pueda separarlas.
   * Valores en TC_CATALOGO_PADRE bajo el código padre ORIGEN_RESIDENCIA.
   */
  @ManyToOne(() => CatalogoPadre, { nullable: true, eager: false })
  @JoinColumn({ name: 'CT_ORIGEN_RESIDENCIA_ID' })
  origenResidencia: CatalogoPadre;



  /**
   *
   */
  @Column({
    name: 'EDAD',
    nullable: true,
    comment: 'Edad del paciente al momento de la notificación',
  })
  edad: number;

  /**
   *
   */
  @ManyToOne(() => CatalogoPadre, { nullable: true, eager: false })
  @JoinColumn({ name: 'CTUNIDADEDAD_ID' })
  unidadEdad: CatalogoPadre;

/**
 * 
 */
  @ManyToOne(() => Notificador, { nullable: true, eager: false })
  @JoinColumn({ name: 'NOTIFICADOR_ID', referencedColumnName: 'identificacion' })
  notificador: Notificador;

  @OneToMany(() => GravedadEsavi, (g) => g.notificacion, { eager: false })
  gravedadEsavi: GravedadEsavi[];

 

  @ManyToOne(() => Establecimiento, { nullable: true })
  @JoinColumn({ name: 'ESTABLECIMIENTO_ID' })
  establecimiento: Establecimiento;

  /**
   *
   */
  @Column({
    name: 'CASO_NARRATIVO',
    nullable: true,
    comment: 'Descripción narrativa del caso clínico',
  })
  casoNarrativo: string;


  @ManyToOne(() => CatalogoPadre, { nullable: true, eager: false })
  @JoinColumn({ name: 'CT_TIPO_REPORTE_ID' })
  tipoReporte: CatalogoPadre;

  /**
   *
   */
  @Column({
    name: 'MEDIO_NOTIFICACION',
    nullable: true,
    default: 'Medio electrónico',
    comment: 'Medio por el cual se realizó la notificación',
  })
  medioNotificacion: string;

  @ManyToOne(() => CatalogoPadre, { nullable: true, eager: false })
  @JoinColumn({ name: 'CT_TIPO_EMISOR_ID' })
  tipoEmisor: CatalogoPadre;

  /**
   *
   */
  @Column({
    name: 'FECHA_NOTIFICACION',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha en que se realizó la notificación. Se asigna para el caso de VigiFlow, desde la columna "Fecha de recepción inicial"',
  })
  fechaNotificacion: Date;

  /**
   *
   */
  @Column({
    name: 'FECHA_REPORTE_NACIONAL',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha del reporte a nivel nacional',
  })
  fechaReporteNacional: Date;

  /**
   *
   */
  @Column({
    name: 'FECHA_LLENADO_FICHA',
    type: 'timestamptz', // con el tipo 'type: 'timestamptz', se forza a UTC.
    nullable: true,
    comment: 'Fecha en que se llenó la ficha de notificación',
  })
  fechaLlenadoFicha: Date;

  /**
   *
   */
  @Column({
    name: 'FECHA_ATENCION',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha de atención médica del paciente',
  })
  fechaAtencion: Date; // Variable propia de DHIS2 no existente en VigiFlow.

  /**
   * 
   */
  @Column({
    name: 'CODIGO_ORIGEN_NOTIFICACION',
    nullable: true,
    comment: 'Código único de la notificación en el sistema origen (VigiFlow o DHIS2)',
  })
  codigoOrigenNotificacion: string;

  /**
   *
   */
  @Column({
    name: 'ORIGEN',
    type: 'enum',
    enum: SourceEnum,
    nullable: true,
    comment: 'Sistema de origen de la notificación: VIGIFLOW o DHIS2',
  })
  origen: SourceEnum;

  // ORIGEN_ORIGINAL se eliminó de esta tabla: el integrador escribía exactamente el mismo
  // objeto en TR_PACIENTE y en TR_NOTIFICACION, y su contenido es demográfico del paciente.
  // El snapshot crudo queda una sola vez, en TR_PACIENTE.PAYLOAD_ORIGEN. La fuente de la
  // notificación se identifica con ORIGEN y CODIGO_ORIGEN_NOTIFICACION, arriba.
}
