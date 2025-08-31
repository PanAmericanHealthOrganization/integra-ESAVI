import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'dhi_esavi',
  name: 'TC_TIPO_CATALOGO',
  comment: 'Tabla de tipos de catálogo',
})
export class TipoCatalogo {
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'ID del tipo de catálogo',
  })
  id: string;

  @Column({
    name: 'CODIGO',
    length: 3,
    comment: 'Código único del tipo de catálogo',
  })
  codigo: string;
  @Column({
    name: 'DESCRIPCION_TIPO_CATALOGO',
    nullable: true,
    comment: 'Descripción del tipo de catálogo',
  })
  descripcion: string;
}
