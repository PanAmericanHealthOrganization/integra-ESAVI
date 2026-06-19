import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SyncStateEnum } from '../enums/sycnstate.enum';
import { Auditoria } from 'src/integrator/entity';

//comment: 'Tabla para la gestión de meddra',

@Entity({
  name: 'MED_SYNC',
  schema: 'MEDDRA',
})
export class MeddraSync extends Auditoria {
  constructor(meddraVersion: string, lang: string = 'ES', description: string) {
    super();
    this.meddraVersion = meddraVersion;
    this.description = description;
    this.lang = lang;
  }
  /**
   *
   * Description:
   */
  @PrimaryGeneratedColumn({
    name: 'ID',
    comment: 'Identificador único del registro',
  })
  id: number;

  /**
   *
   */
  @Column({
    name: 'SYN_MED_VERSION',
    length: 11,
    nullable: false,
    comment: 'Versión de meddra',
  })
  meddraVersion: string;

  /**
   *
   */
  @Column({
    name: 'SYN_MED_LANG',
    length: 6,
    nullable: false,
    comment: 'Versión de meddra',
  })
  lang: string;
  /**
   *
   */
  @Column({
    name: 'SYN_MED_DESCRIPTION',
    length: 1024,
    nullable: false,
    comment: 'Descripción de la versión de meddra',
  })
  description: string;

  /**
   *
   * Description:
   */
  @Column({ name: 'DRS_START_LOAD_DATE', nullable: true })
  startSyncDate: Date;

  /**
   *
   * Description:
   */
  @Column({ name: 'DRS_END_LOAD_DATE', nullable: true })
  endSyncDate: Date;

  /**
   *
   * Description:
   */
  @Column({
    name: 'DRS_LOAD_STATUS',
    type: 'enum',
    enum: SyncStateEnum,
    default: SyncStateEnum.STARTED,
  })
  syncStatus: SyncStateEnum;
}
