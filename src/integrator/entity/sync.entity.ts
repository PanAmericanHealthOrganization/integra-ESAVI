import { BaseEntity, Column, Entity } from 'typeorm';
import { ISync } from '../dto/sync.dto';

@Entity({
  schema: 'dhi_esavi',
  name: 'TR_SYNC_PROCESS',
  comment:
    'Registra los procesos de sincronización con las diferentes fuentes de datos',
})
export class SyncProcess extends BaseEntity implements ISync {
  @Column({ name: 'ID', primary: true })
  id: string;

  @Column({ name: 'NAME' })
  name: string;

  @Column({ name: 'STATUS' })
  status: string;

  @Column({ name: 'START_TIME' })
  startTime: Date;

  @Column({ name: 'END_TIME' })
  endTime: Date;

  @Column({ name: 'ERROR_MESSAGE' })
  errorMessage: string;

  @Column({ name: 'ERROR_STACK' })
  errorStack: string;

  @Column({ name: 'ERROR_TRACE' })
  errorTrace: string;
}
