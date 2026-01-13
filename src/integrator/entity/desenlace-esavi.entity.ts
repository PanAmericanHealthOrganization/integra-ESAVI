import * as moment from 'moment/moment';
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Catalogo } from './catalogo.entity';
import { Notificacion } from './notificacion.entity';

@Entity({
  schema: 'dhi_esavi',
  name: 'TR_DESENLACE_ESAVI',
  comment: 'Tabla de desenlace del ESAVI',
})
export class DesenlaceEsavi extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  /**
   *
   */
  @Column({
    name: 'CODDESENLACEESAVI',
    nullable: true,
    length: 16,
    comment: 'Código del desenlace del ESAVI',
  })
  codigo: string;

  /**
   *
   */
  @Column({
    name: 'FECHAMUERTE',
    nullable: true,
    comment: 'Fecha de fallecimiento del paciente',
  })
  fechaMuerte: Date;

  /**
   *
   */
  @Column({
    name: 'AUTOPSIA',
    nullable: true,
    comment:
      'Indica si se realizó autopsia (si=1, no=0, [no sabe | ignorado | desconoce] = 2, "configuración por defecto para otras opciones no contempladas" = 2)',
  })
  autopsia: number;

  /**
   *
   */
  @Column({
    name: 'FECHANOTIFICAMUERTE',
    nullable: true,
    comment: 'Fecha de notificación del fallecimiento',
  })
  fechaNotificacionMuerte: Date;

  /**
   *
   */
  @Column({
    name: 'AUTOPSIAFETAL',
    nullable: true,
    comment: 'Indica si se realizó autopsia fetal (0=No, 1=Sí)',
  })
  autopsiaFetal: number;

  /**
   *
   */
  @Column({
    name: 'FECHANOTIFICAMUERTEFETAL',
    nullable: true,
    comment: 'Fecha de notificación de muerte fetal',
  })
  fechaNotififacionMuerteFetal: Date;

  /**
   *
   */
  @Column({
    name: 'COMENTARIOS',
    type: 'text',
    nullable: true,
    comment: 'Comentarios adicionales sobre el desenlace',
  })
  comentarios: string;

  /**
   *
   */
  @Column({
    name: 'FECHAINICIOINVESTIGACION',
    nullable: true,
    comment: 'Fecha de inicio de la investigación del caso',
  })
  fechaInicioInvestigacion: Date;

  /**
   *
   */
  @Column({
    name: 'CLASIFICACIONFINALCASO',
    type: 'text',
    nullable: true,
    comment: 'Clasificación final del caso',
  })
  clasificacionFinalCaso: string;

  /**
   *
   */
  @Column({
    name: 'CLASIFICACIONFINALCASOA',
    type: 'text',
    nullable: true,
    comment: 'Clasificación final del caso - Opción A',
  })
  clasificacionFinalCasoA: string;

  /**
   *
   */
  @Column({
    name: 'CLASIFICACIONFINALCASOB',
    type: 'text',
    nullable: true,
    comment: 'Clasificación final del caso - Opción B',
  })
  clasificacionFinalCasoB: string;

  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CAUSALIDADESAVI_ID' })
  causalidadEsavi: Catalogo;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
