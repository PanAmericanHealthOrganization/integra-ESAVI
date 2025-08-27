import { BaseEntity, Column, Entity } from 'typeorm';
import { ISync } from '../dto/sync.dto';

@Entity({
  schema: 'dhi_esavi',
  name: 'TR_SYNC_PROCESS',
  comment:
    'Registra los procesos de sincronización con las diferentes fuentes de datos',
})
export class SyncProcess extends BaseEntity implements ISync {
  @Column({
    name: 'ID',
    primary: true,
    comment: 'Identificador único del proceso de sincronización',
  })
  id: string;

  @Column({ name: 'NAME', comment: 'Nombre del proceso de sincronización' })
  name: string;

  @Column({
    name: 'STATUS',
    comment:
      'Estado actual del proceso (pendiente, en progreso, completado, error)',
  })
  status: string;

  @Column({
    name: 'START_TIME',
    comment: 'Fecha y hora de inicio del proceso de sincronización',
  })
  startTime: Date;

  @Column({
    name: 'END_TIME',
    comment: 'Fecha y hora de finalización del proceso de sincronización',
  })
  endTime: Date;

  @Column({
    name: 'ERROR_MESSAGE',
    comment: 'Mensaje de error en caso de fallo del proceso',
  })
  errorMessage: string;

  @Column({
    name: 'ERROR_STACK',
    comment: 'Stack trace del error ocurrido durante la sincronización',
  })
  errorStack: string;

  @Column({
    name: 'ERROR_TRACE',
    comment: 'Traza detallada del error para depuración',
  })
  errorTrace: string;
}
