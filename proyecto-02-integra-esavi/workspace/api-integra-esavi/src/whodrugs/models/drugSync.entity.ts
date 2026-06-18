import { Auditoria } from 'src/integrator/entity';
import { Column, Entity } from 'typeorm';
import { SyncStateEnum } from '../utils/sycnstate.enum';
import { IDrugSync } from './dtos';

@Entity({ name: 'DRUG_SYNC', schema: 'WHO_DRUG' })
export class DrugSync extends Auditoria implements IDrugSync {
  /**
   *
   * Description:
   */
  @Column({
    primary: true,
    unique: true,
    name: 'ID',
    type: 'char',
    length: 11,
    comment: 'Identificador único del registro',
  })
  id: string;

  /**
   *
   */
  @Column({ name: 'DRS_PROCCES_ID', length: 11, nullable: false })
  proccesId: string;

  /**
   *
   */
  @Column({
    name: 'DRS_SHA_256',
    nullable: false,
    comment: 'SHA-256 hash del archivo',
    length: 258,
  })
  sha256: string;

  /**
   *
   * Description:
   */
  @Column({ name: 'DRS_START_SYNC_DATE' })
  startSyncDate: Date;

  /**
   *
   * Description:
   */
  @Column({ name: 'DRS_END_SYNC_DATE', nullable: true })
  endSyncDate: Date;

  /**
   *
   * Description:
   */
  @Column({
    name: 'DRS_SYNC_STATUS',
    type: 'enum',
    enum: SyncStateEnum,
    default: SyncStateEnum.STARTED,
  })
  syncStatus: SyncStateEnum;
}

export class DrugSyncBuilder {
  private drugSync: DrugSync;

  constructor() {
    this.drugSync = new DrugSync();
  }

  public setId(id: string): DrugSyncBuilder {
    this.drugSync.id = id;
    return this;
  }

  public setStartSyncDate(startSyncDate: Date): DrugSyncBuilder {
    this.drugSync.startSyncDate = startSyncDate;
    return this;
  }
  public setProccesId(proccesId: string): DrugSyncBuilder {
    this.drugSync.proccesId = proccesId;
    return this;
  }

  public setEndSyncDate(endSyncDate: Date): DrugSyncBuilder {
    this.drugSync.endSyncDate = endSyncDate;
    return this;
  }

  public setSyncStatus(syncStatus: SyncStateEnum): DrugSyncBuilder {
    this.drugSync.syncStatus = syncStatus;
    return this;
  }

  public setEnabled(enabled: boolean): DrugSyncBuilder {
    this.drugSync.isEnabled = enabled;
    return this;
  }

  public setState(state: boolean): DrugSyncBuilder {
    this.drugSync.isActive = state;
    return this;
  }
  public setSha256(state: string): DrugSyncBuilder {
    this.drugSync.sha256 = state;
    return this;
  }

  public build(): DrugSync {
    return this.drugSync;
  }
}
