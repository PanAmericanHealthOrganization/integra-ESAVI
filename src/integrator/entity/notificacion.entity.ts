import * as moment from 'moment';
import {
  BeforeInsert,
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
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;
  /**
   *
   */
  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'PACIENTE_ID' })
  paciente: Paciente;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTPROVINCIARESIDENCIA_ID' })
  provinciaResidencia: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTCANTORESIDENCIA_ID' })
  cantonResidencia: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTPARROQUIARESIDENCIA_ID' })
  parroquiaResidencia: Catalogo;
  @Column({
    name: 'OTRAPARROQUIARESIDENCIA',
    nullable: true,
    comment:
      'Otra parroquia de residencia del paciente no contemplada en catálogo',
  })
  otraParroquiaResidencia: string;
  ////////////////////////////////////////////////////////////////////
  @Column({
    name: 'PESO',
    nullable: true,
    comment: 'Peso del paciente en kilogramos',
  })
  peso: number;
  @Column({
    name: 'ALTURA',
    nullable: true,
    comment: 'Altura del paciente en centímetros',
  })
  altura: number;
  @Column({
    name: 'FECHA_NACIMIENTO',
    nullable: true,
    comment: 'Fecha de nacimiento del paciente',
  })
  fechaNacimiento: Date;
  @Column({
    name: 'EDAD',
    nullable: true,
    comment: 'Edad del paciente al momento de la notificación',
  })
  edad: number;
  @Column({
    name: 'LACTANDO',
    nullable: true,
    comment: 'Indica si la paciente se encuentra lactando',
  })
  lactando: boolean;

  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTUNIDADEDAD_ID' })
  unidadEdad: Catalogo;
  @ManyToOne(() => GrupoEtario)
  @JoinColumn({ name: 'CTGRUPOETARIO_ID' })
  grupoEtario: GrupoEtario;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTPROFESIONNOTIFICADOR_ID' })
  profesionNotificador: Catalogo;
  @Column({
    name: 'TITULO_NOTIFICADOR',
    nullable: true,
    comment: 'Título profesional del notificador',
  })
  tituloNotificador: string;
  @Column({
    name: 'ORGANIZACION_NOTIFICADOR',
    nullable: true,
    comment: 'Organización o institución del notificador',
  })
  organizacion: string;
  @Column({
    name: 'ORGANIZACION_UNIT_CODIGO',
    nullable: true,
    comment: 'Código de la unidad organizacional en DHIS2',
  })
  organizacionUnitCode: string;
  @Column({
    name: 'ORGANIZACION_UNIT',
    nullable: true,
    comment: 'Nombre de la unidad organizacional',
  })
  organizacionUnit: string;
  @Column({
    name: 'NOMBRE_NOTIFICADOR',
    nullable: true,
    comment: 'Nombre completo del profesional notificador',
  })
  nombreNotificador: string;
  @Column({
    name: 'IDENTIFICACION_NOTIFICADOR',
    nullable: true,
    comment: 'Número de identificación del notificador',
  })
  identificacionNotificador: string;
  /////////////////Clase residencia sirve para paciente y notificador
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_PROVINCIA_NOTIFICADOR_ID' })
  provinciaNotificador: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_CANTON_NOTIFICADOR_ID' })
  cantonNotificador: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_PARROQUIA_NOTIFICADOR_ID' })
  parroquiaNotificador: Catalogo;
  @Column({
    name: 'OTRA_PARROQUIA_NOTIFICADOR',
    nullable: true,
    comment: 'Otra parroquia del notificador no contemplada en catálogo',
  })
  otraParroquia: string;
  @Column({
    name: 'COMENTARIO_NOTIFICADOR',
    nullable: true,
    comment: 'Comentarios adicionales del notificador',
  })
  comentario: string;
  @Column({
    name: 'CASO_NARRATIVO',
    nullable: true,
    comment: 'Descripción narrativa del caso clínico',
  })
  casoNarrativo: string;
  @Column({
    name: 'TITULO_REPORTE',
    nullable: true,
    comment: 'Título del reporte de ESAVI',
  })
  tituloReporte: string;
  @Column({
    name: 'TIPO_REPORTE',
    nullable: true,
    comment: 'Tipo de reporte (inicial, seguimiento, final)',
  })
  tipoReporte: string;
  @Column({
    name: 'MEDIO_NOTIFICACION',
    nullable: true,
    comment: 'Medio por el cual se realizó la notificación',
  })
  medioNotificacion: string;
  @Column({
    name: 'TIPO_EMISOR',
    nullable: true,
    comment: 'Tipo de emisor del reporte',
  })
  tipoEmisor: string;
  @Column({
    name: 'ORGANIZACION_EMISOR',
    nullable: true,
    comment: 'Organización emisora del reporte',
  })
  organizacionEmisor: string;
  @Column({
    name: 'DELEGADO_ORGANIZACION',
    nullable: true,
    comment: 'Delegado de la organización emisora',
  })
  delegadoOrganizacion: string;
  @Column({
    name: 'NOMBRE_EMISOR',
    nullable: true,
    comment: 'Nombre del emisor del reporte',
  })
  nombreEmisor: string;
  @Column({
    name: 'ULTIMA_EDICION_REGISTRADA',
    nullable: true,
    comment: 'Fecha y hora de la última edición registrada',
  })
  ultimaEdicionRegistrada: string;
  ////////////////////////////////////////////////
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_ESTADO_REGISTRO_ID' })
  estadoRegistro: Catalogo;
  //TODO: ALOPEZ, Validar si estas fechas deben ser nullables o no
  @Column({
    name: 'FECHA_NOTIFICACION',
    nullable: true,
    comment: 'Fecha en que se realizó la notificación',
  })
  fechaNotificacion: Date;
  @Column({
    name: 'FECHA_REPORTE_NACIONAL',
    nullable: true,
    comment: 'Fecha del reporte a nivel nacional',
  })
  fechaReporteNacional: Date;
  @Column({
    name: 'FECHA_LLENADO_FICHA',
    nullable: true,
    comment: 'Fecha en que se llenó la ficha de notificación',
  })
  fechaLlenadoFicha: Date;
  @Column({
    name: 'FECHA_ATENCION',
    nullable: true,
    comment: 'Fecha de atención médica del paciente',
  })
  fechaAtencion: Date;
  //////////////////////////////////////////////////
  @Column({
    name: 'ANTECEDENTE_EVENTO_PREVIO',
    nullable: true,
    comment: 'Número de antecedentes de eventos adversos previos',
  })
  antecedenteEventoPrevio: number;
  @Column({
    name: 'ANTECEDENTE_VACUNAL',
    nullable: true,
    comment: 'Número de antecedentes vacunales del paciente',
  })
  antecedenteVacunal: number;
  //////////////////////////////////////////////////
  @Column({
    name: 'UNICO_CODIGO_UNIDAD_SALUD',
    nullable: true,
    comment: 'Código único de la unidad de salud',
  })
  codigoUnidadSalud: string;
  @Column({
    name: 'MONITOREO_ESTABLECIMIENTO_SALUD',
    nullable: true,
    comment: 'Indicador de monitoreo del establecimiento de salud',
  })
  monitorioEstablecimientoSalud: number;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
  beforeUpdate() {
    this.updatedAt = moment().toDate();
  }
}
