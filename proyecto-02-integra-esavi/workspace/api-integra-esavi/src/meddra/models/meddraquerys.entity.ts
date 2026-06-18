import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'MEDDRA', name: 'MED_REQUEST_HISTORY' })
@Index(['searchterm'])
export class MeddraQuery extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id!: number;

  @Column({ name: 'SEARCHTERMS', unique: true })
  searchterm: string;

  @Column({
    name: 'RESPONSE',
    // transformer: new EncryptionTransformer({
    //   key: process.env.MDD_TRANSFORM_KEY,
    //   algorithm: 'aes-256-cbc',
    //   ivLength: 16,
    //   iv: process.env.MDD_TRANSFORM_IV,
    // }),
  })
  response: string;

  @Column({ name: 'DATE' })
  date: Date;
}
