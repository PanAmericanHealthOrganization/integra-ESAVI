import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('table_completeness')
export class TableCompleteness {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'table_name',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  tableName: string;

  @Column({
    name: 'column_name',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  columnName: string;

  @Column({
    name: 'column_description',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  columnDescription: string;

  @Column({
    name: 'total_records',
    type: 'integer',
    nullable: false,
  })
  totalRecords: number;

  @Column({
    name: 'total_nulls',
    type: 'integer',
    nullable: false,
  })
  totalNulls: number;

  @Column({
    name: 'total_non_nulls',
    type: 'integer',
    nullable: false,
  })
  totalNonNulls: number;

  @Column({
    name: 'completeness_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: false,
  })
  completenessPercentage: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
