import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';
import * as moment from 'moment/moment';
import { Auditoria } from './auditoria.entity';
import { Catalogo } from './catalogo.entity';

/**
 *
 */
@Entity({
  schema: 'dhi_esavi',
  name: 'TR_PACIENTE',
  comment: 'Tabla de pacientes',
})
@TableInheritance({ column: { type: 'varchar', name: 'ORIGEN' } })
export class Paciente extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', { name: 'PACIENTE_ID' })
  id: string;

  /**
   *
   */
  @Column({
    name: 'NOMBRE',
    nullable: true,
    comment: 'Nombre completo del paciente',
  })
  nombre: string;

  /**
   *
   */
  @Column({
    name: 'IDENTIFICACION',
    nullable: true,
    comment: 'Número de identificación del paciente',
  })
  identificacion: string;

  /**
   *
   */
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_SEXO_ID' })
  sexo: Catalogo;

  /**
   *
   */
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_AUTO_IDENTIFICACION_ETNICA_ID' })
  autoIdentificacion: Catalogo;

  /** */
  @Column({
    name: 'REGISTRO_SINCRONIZADO',
    default: false,
    nullable: true,
    comment: 'Indica si el registro ha sido sincronizado con sistemas externos',
  })
  registroSincronizado: boolean;

  /**
   *
   */
  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
