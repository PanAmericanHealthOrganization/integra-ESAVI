import { ChildEntity, Column } from 'typeorm';
import { Notificacion } from './notificacion.entity';

@ChildEntity('vigiflow')
export class NotificacionVigiflow extends Notificacion {
  @Column({
    name: 'CODIGO_VIGIFLOW',
    comment: 'Código de la notificación en el sistema Vigiflow',
  })
  codigoVigiflow: string;
}
