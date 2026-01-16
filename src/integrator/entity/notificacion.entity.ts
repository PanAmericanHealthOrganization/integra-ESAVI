import * as moment from 'moment';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Catalogo } from './catalogo.entity';
import { GrupoEtario } from './grupo-etario.entity';
import { Paciente } from './paciente.entity';

@Entity({
  schema: 'dhi_esavi',
  name: 'TR_NOTIFICACION',
  comment: 'Tabla de notificaciones',
})
@TableInheritance({ column: { type: 'varchar', name: 'TIPO_NOTIFICACION' } })
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
  @Column({
    nullable: true,
    comment: 'Provincia de residencia del paciente. FK a catálogo de provincias. En DHIS2 solo hay ubicación geográfica del paciente, no del notificador',
  })
  CTPROVINCIARESIDENCIA_ID: string; //Se utiliza @JoinColumn con columna explícita para registrar el comentario en la columna de la FK.
  @ManyToOne(() => Catalogo,{nullable: true}) //Se agrega ",{nullable: true}" para permitir valores nulos en la relación.
  @JoinColumn({ name: 'CTPROVINCIARESIDENCIA_ID'})
  provinciaResidencia: Catalogo;

  /**
   *
   */
  @Column({
    nullable: true,
    comment: 'Cantón de residencia del paciente. FK a catálogo de cantones. En DHIS2 solo hay ubicación geográfica del paciente, no del notificador',
  })
  CTCANTORESIDENCIA_ID: string; //Se utiliza @JoinColumn con columna explícita para registrar el comentario en la columna de la FK.
  @ManyToOne(() => Catalogo, {nullable: true}) //Se agrega ",{nullable: true}" para permitir valores nulos en la relación.
  @JoinColumn({ name: 'CTCANTORESIDENCIA_ID' })
  cantonResidencia: Catalogo;

  /**
   *
   */
  @Column({
    nullable: true,
    comment: 'Parroquia de residencia del paciente. FK a catálogo de parroquias. En DHIS2 solo hay ubicación geográfica del paciente, no del notificador',
  })
  CTPARROQUIARESIDENCIA_ID: string; //Se utiliza @JoinColumn con columna explícita para registrar el comentario en la columna de la FK.
  @ManyToOne(() => Catalogo, {nullable: true}) //Se agrega ",{nullable: true}" para permitir valores nulos en la relación.
  @JoinColumn({ name: 'CTPARROQUIARESIDENCIA_ID' })
  parroquiaResidencia: Catalogo;

  //-- Cuando la columna de la relación no tiene comentario explícito, su propiedad comentario hereda el comentario de la tabla foránea (de la principal a la cual tiene relación).

  /**
   *
   */
  @Column({
    name: 'OTRAPARROQUIARESIDENCIA',
    nullable: true,
    comment: 'Otra parroquia de residencia del paciente no contemplada en catálogo',
  })
  otraParroquiaResidencia: string;
//--------------------------------------------------------------------------------------------------------------
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
    name: 'FECHA_NACIMIENTO',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha de nacimiento del paciente',
  })
  fechaNacimiento: Date;

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
  @Column({
    name: 'LACTANDO',
    nullable: true,
    comment: 'Indica si la paciente se encuentra lactando. Variable propia de VigiFLow no existente en DHIS2.',
  })
  lactando: string; //boolean; //Variable propia de VigiFLow no existente en DHIS2.

  /**
   *
   */
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTUNIDADEDAD_ID' })
  unidadEdad: Catalogo;

  /**
   *
   */
  @ManyToOne(() => GrupoEtario)
  @JoinColumn({ name: 'CTGRUPOETARIO_ID' })
  grupoEtario: GrupoEtario;

  /**
   *
   */
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTPROFESIONNOTIFICADOR_ID' })
  profesionNotificador: Catalogo;

  /**
   *
   */
  @Column({
    name: 'TITULO_NOTIFICADOR',
    nullable: true,
    comment: 'Título profesional del notificador. Campo exclusivo de VigiFlow.',
  })
  tituloNotificador: string; //El Título aparece únicamente en VigiFlow. La columna que sí tiene en común con DHIS2 es la Profesión, y está integrada mediante FK.

  /**
   *
   */
  @Column({
    name: 'ORGANIZACION_NOTIFICADOR',
    nullable: true,
    comment: 'Organización o institución del notificador',
  })
  organizacionNotificador: string;

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
    name: 'ORGANIZACION_UNIT',
    nullable: true,
    comment: 'Nombre de la unidad organizacional',
  })
  organizacionUnit: string;

  /**
   *
   */
  @Column({
    name: 'NOMBRE_NOTIFICADOR',
    nullable: true,
    comment: 'Nombre completo del profesional notificador',
  })
  nombreNotificador: string;

  /**
   *
   */
  @Column({
    name: 'IDENTIFICACION_NOTIFICADOR',
    nullable: true,
    comment: 'Número de identificación del notificador',
  })
  identificacionNotificador: string;

  /**
   *
   */
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_PROVINCIA_NOTIFICADOR_ID' })
  provinciaNotificador: Catalogo;

  /**
   *
   */
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_CANTON_NOTIFICADOR_ID' })
  cantonNotificador: Catalogo;

  /**
   *
   */
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_PARROQUIA_NOTIFICADOR_ID' })
  parroquiaNotificador: Catalogo;

  /**
   *
   */
  @Column({
    name: 'OTRA_PARROQUIA_NOTIFICADOR',
    nullable: true,
    comment: 'Otra parroquia del notificador no contemplada en catálogo',
  })
  otraParroquia: string;

  /**
   *
   */
  @Column({
    name: 'COMENTARIO_NOTIFICADOR',
    nullable: true,
    comment: 'Comentarios adicionales del notificador',
  })
  comentarioNotificador: string;

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
    name: 'ORGANIZACION_EMISOR',
    nullable: true,
    comment: 'Organización emisora del reporte',
  })
  organizacionEmisor: string;

  /**
   *
   */
  @Column({
    name: 'DELEGADO_ORGANIZACION',
    nullable: true,
    comment: 'Delegado de la organización emisora',
  })
  delegadoOrganizacion: string;

  /**
   *
   */
  @Column({
    name: 'NOMBRE_EMISOR',
    nullable: true,
    comment: 'Nombre del emisor del reporte',
  })
  nombreEmisor: string;

  /**
   *
   */
  @Column({
    name: 'ULTIMA_EDICION_REGISTRADA',
    nullable: true,
    comment: 'Fecha y hora de la última edición registrada',
  })
  ultimaEdicionRegistrada: string;

  /**
   *
   */
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_ESTADO_REGISTRO_ID' })
  estadoRegistro: Catalogo;

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
    nullable: true,
    comment: 'Fecha en que se llenó la ficha de notificación',
  })
  fechaLlenadoFicha: Date;

  /**
   *
   */
  @Column({
    name: 'FECHA_ATENCION',
    nullable: true,
    comment: 'Fecha de atención médica del paciente',
  })
  fechaAtencion: Date; // Variable propia de DHIS2 no existente en VigiFlow.

  /**
   *
   */
  @Column({
    name: 'ANTECEDENTE_EVENTO_PREVIO',
    nullable: true,
    comment: 'Número de antecedentes de eventos adversos previos',
  })
  antecedenteEventoPrevio: number;

  /**
   *
   */
  @Column({
    name: 'ANTECEDENTE_VACUNAL',
    nullable: true,
    comment: 'Número de antecedentes vacunales del paciente',
  })
  antecedenteVacunal: number;

  /**
   *
   */
  @Column({
    name: 'UNICO_CODIGO_UNIDAD_SALUD',
    nullable: true,
    comment: 'Código único de la unidad de salud',
  })
  codigoUnidadSalud: string;

  /**
   *
   */
  @Column({
    name: 'MONITOREO_ESTABLECIMIENTO_SALUD',
    nullable: true,
    comment: 'Indicador de monitoreo del establecimiento de salud',
  })
  monitorioEstablecimientoSalud: number;

  /**
   *
   */
  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }

  /**
   *
   */
  @BeforeUpdate()
  beforeUpdate() {
    this.updatedAt = moment().toDate();
  }
}
