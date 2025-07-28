import { ChildEntity, Column } from 'typeorm';
import { Notificacion } from './notificacion.entity';

@ChildEntity('vigiflow')
export class NotificacionVigiflow extends Notificacion {
  @Column({ name: 'CODIGOVIGIFLOW' })
  codigoVigiflow: string;
}
