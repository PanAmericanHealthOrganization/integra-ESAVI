import { ChildEntity, Column } from 'typeorm';
import { Notificacion } from './notificacion.entity';

@ChildEntity('dhis2')
export class NotificacionDhis2 extends Notificacion {
  @Column({ name: 'CODIGODHIS2EVENTO', nullable: true })
  codigoDhis2Evento: string;
}
