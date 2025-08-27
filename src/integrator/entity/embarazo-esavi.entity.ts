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

@Entity({ schema: 'dhi_esavi', name: 'TR_ESAVIDURANTEEMBARAZO' })
export class EmbarazoEsavi extends Auditoria {
  @PrimaryColumn({
    name: 'NOTIFICACION_ID',
    comment: 'Identificador de la notificación asociada',
  })
  id: string;

  @Column({
    name: 'CODIGOEMBARAZODURANTEESAVI',
    length: 16,
    comment: 'Código del embarazo durante el ESAVI',
  })
  codigo: string;

  @Column({
    name: 'FECHAULTIMAMENSTRUACIONESAVI',
    comment: 'Fecha de la última menstruación durante el ESAVI',
  })
  fechaUltimaMenstruacion: Date;
  @Column({
    name: 'FECHAPARTOESAVI',
    nullable: true,
    comment: 'Fecha del parto relacionado con el ESAVI',
  })
  fechaParto: Date;

  @Column({
    name: 'CODIGOMONITOREOPOSTERIORVACUNAESAVI',
    length: 16,
    comment: 'Código de monitoreo posterior a la vacuna durante el ESAVI',
  })
  codigoMonitoreoPosterioVacuna: string;

  @Column({
    name: 'CODIGOTIPOCOMPLICACIONESAVI',
    length: 16,
    default: true,
    comment: 'Código del tipo de complicación durante el ESAVI',
  })
  codigoTipoComplicacion: string;

  @Column({
    name: 'NOMBRECOMPLICACIONEMBARAZOESAVI',
    length: 128,
    comment: 'Nombre de la complicación del embarazo durante el ESAVI',
  })
  nombreComplicacion: string;

  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  //TODO: ralopez, aplicar clean-code
  @Column({
    name: 'CODIGOMEDDRACOMPLICACIONEMBARAZOESAVI',
    length: 16,
    nullable: true,
    comment: 'Código MedDRA de la complicación del embarazo durante el ESAVI',
  })
  CODIGOMEDDRACOMPLICACIONEMBARAZOESAVI: string;
  @Column({
    name: 'OTROSCODIGOSCOMPLICACIONEMBARAZOESAVI',
    length: 16,
    nullable: true,
    comment: 'Otros códigos de complicación del embarazo durante el ESAVI',
  })
  OTROSCODIGOSCOMPLICACIONEMBARAZOESAVI: string;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
