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
    nullable: true,
    comment: 'Tipo de gravedad del ESAVI',
  })
  tipo: string;

  /**
   *
   */
  @Column({
    name: 'MUERTE',
    nullable: true,
    comment: 'Indica si el ESAVI resultó en muerte',
  })
  muerte: boolean;

  /**
   *
   */
  @Column({
    name: 'RIESGO_VIDA',
    nullable: true,
    comment: 'Indica si el ESAVI puso en riesgo la vida del paciente',
  })
  riesgoVida: boolean;

  /**
   *
   */
  @Column({
    name: 'DISCAPACIDAD',
    nullable: true,
    comment: 'Indica si el ESAVI resultó en discapacidad',
  })
  discapacidad: boolean;

  /**
   *
   */
  @Column({
    name: 'HOSPITALIZACION',
    nullable: true,
    comment: 'Indica si el ESAVI requirió hospitalización',
  })
  hospitalizacion: boolean;

  /**
   *
   */
  @Column({
    name: 'ANOMALIA_CONGENITA',
    nullable: true,
    comment: 'Indica si el ESAVI causó anomalía congénita',
  })
  anomaliaCongenita: boolean;

  /**
   *
   */
  @Column({
    name: 'ABORTO',
    nullable: true,
    comment: 'Indica si el ESAVI resultó en aborto',
  })
  aborto: boolean;

  /**
   *
   */
  @Column({
    name: 'MUERTE_FETAL',
    nullable: true,
    comment: 'Indica si el ESAVI resultó en muerte fetal',
  })
  muerteFetal: boolean;

  /**
   *
   */
  @Column({
    name: 'OTROS_EVENTOS_IMPORTANTES',
    nullable: true,
    comment: 'Indica si hubo otros eventos importantes',
  })
  eventoImportante: boolean;

  /**
   *
   */
  @Column({
    name: 'OTROS_EVENTOS_IMPORTANTES_TX',
    nullable: true,
    length: 2000,
    comment: 'Descripción de otros eventos importantes',
  })
  comentarioEventoImportante: string;

  /**
   *
   */
  @Column({
    name: 'PARTE_EVENTOS_PREOCUPACION',
    nullable: true,
    comment: 'Indica si forma parte de eventos de especial preocupación',
  })
  parteEventosPreocupacion: boolean;

  /**
   *
   */
  @Column({
    name: 'NUEVO_EVENTOS',
    nullable: true,
    comment: 'Indica si es un evento nuevo no reportado anteriormente',
  })
  nuevoEventos: boolean;

  /**
   *
   */
  @Column({
    name: 'CONDICION_EGRESO',
    nullable: true,
    length: 2000,
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
