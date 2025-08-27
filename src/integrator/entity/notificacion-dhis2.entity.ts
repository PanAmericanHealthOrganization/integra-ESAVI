import { ChildEntity, Column } from 'typeorm';
import { Notificacion } from './notificacion.entity';

@ChildEntity('dhis2')
export class NotificacionDhis2 extends Notificacion {
  @Column({
    name: 'CODIGODHIS2EVENTO',
    nullable: true,
    comment: 'Código del evento de notificación en el sistema DHIS2',
  })
  codigoDhis2Evento: string;
}
