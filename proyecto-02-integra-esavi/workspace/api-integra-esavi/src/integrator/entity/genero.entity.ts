import { OmitType } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';

@Entity({
  schema: 'dhi_esavi',
  name: 'TC_GENERO',
  comment: 'Tabla de géneros',
})
export class Genero extends Auditoria implements IGenero {
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador único pk de la tabla TC_GENERO',
  })
  id: string;

  @Column({
    name: 'NOMBRE',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Nombre del género',
  })
  nombre: string;

  @Column({
    name: 'CODIGO',
    type: 'varchar',
    length: 10,
    nullable: false,
    comment: 'Código único del género',
  })
  codigo: string;

  @Column({
    name: 'DESCRIPCION',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Descripción del género',
  })
  descripcion: string;
}

export interface IGenero extends Auditoria {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
}

export class GeneroDto extends Auditoria implements IGenero {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
}


export class CreateGeneroDto extends OmitType(GeneroDto, [
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

export class UpdateGeneroDto extends OmitType(GeneroDto, [
  'createdAt',
  'createdBy',
  'deletedAt',
  'deletedBy',
] as const) {}
