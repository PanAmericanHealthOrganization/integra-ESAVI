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

@Entity({ schema: 'dhi_esavi', name: 'TR_PACIENTE' })
@TableInheritance({ column: { type: 'varchar', name: 'ORIGEN' } })
export class Paciente extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'PACIENTE_ID' })
  id: string;
  @Column({ name: 'NOMBRE', nullable: true })
  nombre: string;
  @Column({ name: 'IDENTIFICACION', nullable: true })
  identificacion: string;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTSEXO_ID' })
  sexo: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTAUTOIDENTIFICACIONETNICA_ID' })
  autoIdentificacion: Catalogo;
  @Column({ name: 'REGISTROSINCRONIZADO', default: false, nullable: true })
  registroSincronizado: boolean;
  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
