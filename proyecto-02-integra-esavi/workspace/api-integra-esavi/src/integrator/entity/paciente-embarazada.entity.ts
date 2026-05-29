import * as moment from 'moment/moment';
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Notificacion } from './notificacion.entity';

@Entity({
  schema: 'dhi_esavi',
  name: 'TR_PACIENTE_EMBARAZADA',
  comment: 'Tabla de pacientes embarazadas',
})
export class PacienteEmbarazada extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador único PK de la tabla TR_PACIENTE_EMBARAZADA' })
  id: string;

  /**
   * Column  of paciente embarazada
   */
  @Column({
    name: 'EMBARAZADA_MOMENTO_VACUNA',
    nullable: true,
    comment: 'Indica si la paciente estaba embarazada al momento de la vacunación. Variable de tipo booleana, es parte de proceso de enriquecimiento de datos, su valor se obtiene comprobando si la variable "DNVE ESAVI TRK - Semanas gestación al recibir la vacuna" tiene o no valor. Valores esperados: true="1", false="0"',
  })
  momentoVacuna: string;

  /**
   * Column  of paciente embarazada
   */
  @Column({
    name: 'EMBARAZADA_MOMENTO_ESAVI',
    default: false,
    comment: 'Indica si la paciente estaba embarazada al momento del ESAVI. DHIS2 entrega este valor booleano como texto, donde true="1" y false="0".',
  })
  momentoEsavi: string;

  /**
   * Many to one of paciente embarazada
   */
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
