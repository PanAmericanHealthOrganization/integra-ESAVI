import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Notificacion } from './notificacion.entity';
import { Auditoria } from './auditoria.entity';
import * as moment from 'moment/moment';

@Entity({ schema: 'dhi_esavi' , name: 'TR_ESAVIDURANTEEMBARAZO' })
export class EmbarazoEsavi extends Auditoria {
  @PrimaryColumn({ name: 'NOTIFICACION_ID' })
  id: string;

  @Column({ name: 'CODIGOEMBARAZODURANTEESAVI', length: 16 })
  codigo: string;

  @Column({ name: 'FECHAULTIMAMENSTRUACIONESAVI' })
  fechaUltimaMenstruacion: Date;
  @Column({ name: 'FECHAPARTOESAVI', nullable: true })
  fechaParto: Date;

  @Column({ name: 'CODIGOMONITOREOPOSTERIORVACUNAESAVI', length: 16 })
  codigoMonitoreoPosterioVacuna: string;

  @Column({ name: 'CODIGOTIPOCOMPLICACIONESAVI', length: 16, default: true })
  codigoTipoComplicacion: string;

  @Column({ name: 'NOMBRECOMPLICACIONEMBARAZOESAVI', length: 128 })
  nombreComplicacion: string;

  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  //TODO: ralopez, aplicar clean-code
  @Column({
    name: 'CODIGOMEDDRACOMPLICACIONEMBARAZOESAVI',
    length: 16,
    nullable: true,
  })
  CODIGOMEDDRACOMPLICACIONEMBARAZOESAVI: string;
  @Column({
    name: 'OTROSCODIGOSCOMPLICACIONEMBARAZOESAVI',
    length: 16,
    nullable: true,
  })
  OTROSCODIGOSCOMPLICACIONEMBARAZOESAVI: string;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
