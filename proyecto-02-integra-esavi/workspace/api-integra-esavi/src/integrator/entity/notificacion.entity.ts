import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {Auditoria} from './auditoria.entity';
import {Catalogo} from './catalogo.entity';
import {Notificador} from './notificador.entity';
import {Paciente} from './paciente.entity';
import {SourceEnum} from '../enum/source-enum';

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

  /**
   *
   */
  @ManyToOne(() => Catalogo, { nullable: true })
  @JoinColumn({ name: 'CTPROVINCIARESIDENCIA_ID' })
  provinciaResidencia: Catalogo;

  @ManyToOne(() => Catalogo, { nullable: true })
  @JoinColumn({ name: 'CTCANTORESIDENCIA_ID' })
  cantonResidencia: Catalogo;

  @ManyToOne(() => Catalogo, { nullable: true })
  @JoinColumn({ name: 'CTPARROQUIARESIDENCIA_ID' })
  parroquiaResidencia: Catalogo;

  /**
   *
   */
  @Column({
    name: 'PESO',
    nullable: true,
    comment: 'Peso del paciente en kilogramos',
  })
  peso: number;

  /**
   *
   */
  @Column({
    name: 'ALTURA',
    nullable: true,
    comment: 'Altura del paciente en centímetros',
  })
  altura: number;

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
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTUNIDADEDAD_ID' })
  unidadEdad: Catalogo;


  /**
   *
   */
  @ManyToOne(() => Catalogo, { nullable: true })
  @JoinColumn({ name: 'CTPROFESIONNOTIFICADOR_ID' })
  profesionNotificador: Catalogo;

  @ManyToOne(() => Notificador, { nullable: true, eager: false })
  @JoinColumn({ name: 'NOTIFICADOR_ID', referencedColumnName: 'identificacion' })
  notificador: Notificador;

 

  /**
   *
   */
  @Column({
    name: 'ORGANIZACION_UNIT_CODIGO',
    nullable: true,
    comment: 'Código de la unidad organizacional en DHIS2',
  })
  organizacionUnitCode: string;


  /**
   *
   */
  @Column({
    name: 'CASO_NARRATIVO',
    nullable: true,
    comment: 'Descripción narrativa del caso clínico',
  })
  casoNarrativo: string;

  /**
   *
   */
  @Column({
    name: 'TITULO_REPORTE',
    nullable: true,
    comment: 'Título del reporte de ESAVI',
  })
  tituloReporte: string;

  /**
   *
   */
  @Column({
    name: 'TIPO_REPORTE',
    nullable: true,
    comment: 'Tipo de reporte (inicial, seguimiento, final)',
  })
  tipoReporte: string;

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

  /**
   *
   */
  @Column({
    name: 'TIPO_EMISOR',
    nullable: true,
    comment: 'Tipo de emisor del reporte. 1 = Profesional de la salud, 2 = Paciente / consumidor, 3 = Laboratorio farmacéutico, 4 = Centro regional de farmacovigilancia, 5 = Otro. Para DHIS2 el vlor predeterminado es "1" (Profesional de la salud).',
  })
  tipoEmisor: string;

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

  @Column({
    name: 'CODIGO_ORIGEN_NOTIFICACION',
    nullable: true,
    comment: 'Código único de la notificación en el sistema origen (VigiFlow o DHIS2)',
  })
  codigoOrigenNotificacion: string;

  @Column({
    name: 'ORIGEN',
    type: 'enum',
    enum: SourceEnum,
    nullable: true,
    comment: 'Sistema de origen de la notificación: VIGIFLOW o DHIS2',
  })
  origen: SourceEnum;

}
