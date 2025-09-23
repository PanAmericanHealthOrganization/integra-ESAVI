import { CustomBaseEntity } from 'src/utils/interfaces/baseEntity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ISync } from '../dto/sync.dto';

@Entity({
  schema: 'dhi_esavi',
  name: 'TR_SYNC_PROCESS',
  comment: 'Registra los procesos de sincronización con las diferentes fuentes de datos',
})
export class SyncProcess extends CustomBaseEntity implements ISync {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador único del proceso de sincronización',
  })
  id: string;

  /**
   *
   */
  @Column({ name: 'NAME', comment: 'Nombre del proceso de sincronización' })
  name: string;

  /**
   *
   */
  @Column({
    name: 'STATUS',
    comment: 'Estado actual del proceso (pendiente, en progreso, completado, error)',
  })
  status: string;

  /**
   *
   */
  @Column({
    name: 'START_TIME',
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora de inicio del proceso de sincronización',
  })
  startTime: Date;

  /**
   *
   */
  @Column({
    name: 'END_TIME',
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora de finalización del proceso de sincronización',
  })
  endTime: Date;

  /**
   *
   */
  @Column({
    name: 'ERROR_MESSAGE',
    type: 'text',
    nullable: true,
    comment: 'Mensaje de error en caso de fallo del proceso',
  })
  errorMessage: string;

  /**
   *
   */
  @Column({
    name: 'ERROR_STACK',
    type: 'text',
    nullable: true,
    comment: 'Stack trace del error ocurrido durante la sincronización',
  })
  errorStack: string;

  /**
   *
   */
  @Column({
    name: 'ERROR_TRACE',
    type: 'text',
    nullable: true,
    comment: 'Traza detallada del error para depuración',
  })
  errorTrace: string;
}
