import * as moment from 'moment/moment';
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Notificacion } from './notificacion.entity';

/**
 *
 */
@Entity({ schema: 'dhi_esavi', name: 'TR_GRAVEDAD_ESAVI', comment: 'Tabla de gravedad del ESAVI' })
export class GravedadEsavi extends Auditoria {
  /**
   * Primary generated column of gravedad esavi
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador único PK de la tabla TR_GRAVEDAD_ESAVI' })
  id: string;

  /**
   *
   */
  @Column({
    name: 'TIPO_GRAVEDAD',
    nullable: false,
    comment: 'Tipo de gravedad del ESAVI',
  })
  tipo: string;

  /**
   *
   */
  @Column({
    name: 'MUERTE',
    nullable: true,//false,
    //default: false,
    comment: 'Indica si el ESAVI resultó en muerte',
  })
  muerte: string;//boolean;

  /**
   *
   */
  @Column({
    name: 'RIESGO_VIDA',
    nullable: true,//false,
    //default: false,
    comment: 'Indica si el ESAVI puso en riesgo la vida del paciente. En el origen se lo puede localizar con el término "Amenaza a la vida"',
  })
  riesgoVida: string;//boolean;

  /**
   *
   */
  @Column({
    name: 'DISCAPACIDAD',
    nullable: true,//false,
    //default: false,
    comment: 'Indica si el ESAVI resultó en discapacidad',
  })
  discapacidad: string;//boolean;

  /**
   *
   */
  @Column({
    name: 'HOSPITALIZACION',
    nullable: true,//false,
    //default: false,
    comment: 'Indica si el ESAVI requirió hospitalización',
  })
  hospitalizacion: string;//boolean;

  /**
   *
   */
  @Column({
    name: 'ANOMALIA_CONGENITA',
    nullable: true,//false,
    //default: false,
    comment: 'Indica si el ESAVI causó anomalía congénita',
  })
  anomaliaCongenita: string;//boolean;

  /**
   *
   */
  @Column({
    name: 'ABORTO',
    nullable: true,//false,
    //default: false,
    comment: 'Indica si el ESAVI resultó en aborto',
  })
  aborto: string;//boolean;

  /**
   *
   */
  @Column({
    name: 'MUERTE_FETAL',
    nullable: true,//false,
    //default: false,
    comment: 'Indica si el ESAVI resultó en muerte fetal',
  })
  muerteFetal: string;//boolean;

  /**
   *
   */
  /*@Column({
    name: 'OTROS_EVENTOS_IMPORTANTES',
    nullable: false,
    default: false,
    comment: 'Indica si hubo otros eventos importantes',
  })
  eventoImportante: boolean;*/

  /**
   *
   */
  /*@Column({
    name: 'OTROS_EVENTOS_IMPORTANTES_TX',
    nullable: true,
    length: 2000,
    comment: 'Descripción de otros eventos importantes',
  })
  comentarioEventoImportante: string;*/

  /**
   *
   */
  @Column({
    name: 'PARTE_EVENTOS_PREOCUPACION',
    nullable: true,
    comment: 'Indica si forma parte de eventos de especial preocupación',
  })
  parteEventosPreocupacion: string;

  /**
   *
   */
  @Column({
    name: 'SON_EVENTOS_NUEVOS',//'NUEVO_EVENTOS',
    nullable: true,
    comment: 'Indica si es un evento nuevo no reportado anteriormente',
  })
  sonEventosNuevos: string; //nuevoEventos: boolean;
   /**
   *
   */
  @Column({
    name: 'DESCRI_EVENTOS_NUEVOS',
    nullable: true,
    type: 'text',
    comment: 'Descripción del evento nuevo no reportado anteriormente',
  })
  descripcionEventoNuevo: string;

  /**
   *
   */
  @Column({
    name: 'CONDICION_EGRESO',
    nullable: true,
    type: 'text',//length: 2000, //usa la propiedad "type" text en vez de "length" para textos largos
    comment: 'Descripción de la condición del paciente al egreso',
  })
  condicionEgreso: string;

  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
