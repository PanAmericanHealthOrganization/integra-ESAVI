import {BeforeInsert,Column,Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn} from 'typeorm';
import {Auditoria} from './auditoria.entity';
import {Notificacion} from './notificacion.entity';

@Entity({
  schema: 'DHI_ESAVI',
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
    name: 'AUTOPSIA', //Columna utilizada por DHIS2 y VigiFlow
    nullable: true,
    comment:
      'Indica si se realizó autopsia (si=1, no=0, [no sabe | ignorado | desconoce] = 2, "configuración por defecto para otras opciones no contempladas" = 2)',
  })
  autopsia: number; //Columna utilizada por DHIS2 y VigiFlow

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
  /*@Column({
    name: 'AUTOPSIAFETAL',
    nullable: true,
    comment: 'Indica si se realizó autopsia fetal (0=No, 1=Sí)',
  })
  autopsiaFetal: number; *///El campo no existe en los orígenes. Se deja comentado.

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
  // COMENTARIO_RESULTADO se eliminó por estar repetida con RESULTADO_EVENTO; el estado final
  // del evento se almacena homologado a código numérico en RESULTADO_EVENTO.

  /**
   *
   */
  @Column({
    name: 'RESULTADO_EVENTO',
    type: 'integer',
    nullable: true,
    comment:
      'Estado final del evento homologado. 0=Desconocido, 1=Recuperado, 2=En recuperación, 3=No recuperado, 4=Recuperado con secuelas, 5=Muerte. Origen VigiFlow: hoja Reacciones, columna "Resultado"; un criterio de gravedad "Muerte" fuerza el valor 5.',
  })
  resultadoEvento: number;

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

  /**
   *
   */
  @Column({
    name: 'CAUSALIDADESAVI_ID',
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: 'Causalidad del ESAVI. Antes era una relación a TC_CATALOGO; se dejó como campo simple porque nunca fue poblado por la lógica de integración.',
  })
  causalidadEsavi: string;

  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
  }
}
