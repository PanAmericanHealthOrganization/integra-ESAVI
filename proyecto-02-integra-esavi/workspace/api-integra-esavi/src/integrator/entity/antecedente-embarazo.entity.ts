import { Antecedente } from './antecedente.entity';
import { BeforeInsert, Column, Entity } from 'typeorm';

/**
 * Absorbe la antigua TR_PACIENTE_EMBARAZADA. Ambas tablas eran 1:1 contra NOTIFICACION_ID y
 * describían el mismo hecho partido en dos: una guardaba el estado (si estaba embarazada al
 * vacunarse o al presentar el ESAVI) y la otra los datos clínicos del embarazo (FUM, fecha de
 * parto, edad gestacional). Consultar el bloque de embarazo obligaba a unir dos tablas sin que
 * la separación aportara nada.
 *
 * No se unifica con TR_ESAVI_DURANTE_EMBARAZO: esa registra eventos (complicaciones del
 * embarazo durante el ESAVI, N por caso), que es una cardinalidad distinta.
 */
@Entity({ schema: 'DHI_ESAVI', name: 'TR_ANTECEDENTES_EMBARAZO', comment: 'Tabla de antecedentes de embarazo' })
export class AntecedenteEmbarazo extends Antecedente {
  /**
   *
   */
  @Column({
    name: 'EMBARAZADA_MOMENTO_VACUNA',
    nullable: true,
    comment:
      'Indica si la paciente estaba embarazada al momento de la vacunación. Variable de tipo booleana, es parte de proceso de enriquecimiento de datos, su valor se obtiene comprobando si la variable "DNVE ESAVI TRK - Semanas gestación al recibir la vacuna" tiene o no valor. Valores esperados: true="1", false="0"',
  })
  momentoVacuna: string;

  /**
   *
   */
  @Column({
    name: 'EMBARAZADA_MOMENTO_ESAVI',
    nullable: true,
    comment:
      'Indica si la paciente estaba embarazada al momento del ESAVI. DHIS2 entrega este valor booleano como texto, donde true="1" y false="0".',
  })
  momentoEsavi: string;

  /**
   *
   */
  @Column({
    name: 'FECHA_ULTIMA_MENSTRUACION',
    type: 'timestamp without time zone',
    nullable: true,
    comment: 'Fecha de la última menstruación de la paciente',
  })
  fechaUltimaMenstruacion: Date;
  /**
   *
   */
  @Column({
    name: 'FECHA_PARTO',
    type: 'timestamp without time zone',
    nullable: true,
    comment: 'Fecha probable o real del parto',
  })
  fechaParto: Date;
  /**
   *
   */
  @Column({
    name: 'EDAD_GESTACIONAL',
    type: 'integer',
    nullable: true,
    comment: 'Edad gestacional de la paciente en semanas',
  })
  edadGestacional: number;

  @Column({
    name: 'DESCRIPCION_ANTECEDENTE',
    type: 'text',
    nullable: true,
    comment: 'Descripción del antecedente de embarazo (caso narrativo del reporte)',
  })
  descripcionAntecedente: string;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
  }
}
