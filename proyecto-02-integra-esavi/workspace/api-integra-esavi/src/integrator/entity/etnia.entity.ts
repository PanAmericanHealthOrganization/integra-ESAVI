import { OmitType } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';

@Entity({
  schema: 'dhi_esavi',
  name: 'TC_ETNIA',
  comment: 'Tabla de etnias',
})
export class Etnia extends Auditoria implements IEtnia {
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador único pk de la tabla TC_ETNIA',
  })
  id: string;

  @Column({
    name: 'NOMBRE',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Nombre de la etnia',
  })
  nombre: string;

  @Column({
    name: 'CODIGO',
    type: 'varchar',
    length: 10,
    nullable: false,
    comment: 'Código único de la etnia',
  })
  codigo: string;

  @Column({
    name: 'DESCRIPCION',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Descripción de la etnia',
  })
  descripcion: string;
}

export interface IEtnia extends Auditoria {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
}

export class EtniaDto extends Auditoria implements IEtnia {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
}


export class CreateEtniaDto extends OmitType(EtniaDto, [
  'id',
  'createdAt',
  'createdBy',
  'deletedAt',
  'deletedBy',
  'isActive',
  'isEnabled',
  'updatedAt',
  'updatedBy',
] as const) {}

export class UpdateEtniaDto extends OmitType(EtniaDto, [
  'createdAt',
  'createdBy',
  'deletedAt',
  'deletedBy',
] as const) {}
