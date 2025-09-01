import * as moment from 'moment';
import {
  BeforeInsert,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Notificacion } from './notificacion.entity';

// Estructura básica o plantilla para crear 
// las entidades de antecedentes (...
// TR_ANTECEDENTES_EMBARAZO, 
// TR_ANTECEDENTES_ENFERMEDADES_PREVIAS, 
// TR_ANTECEDENTES_EVENTO_ADVERSO, 
// TR_ANTECEDENTES_MEDICO
// )
export abstract class Antecedente extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', {
    name: 'NOTIFICACION_ID',
    comment: 'Identificador de la notificación asociada al antecedente',
  })
  id: string;

  /**
   *
   */
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
