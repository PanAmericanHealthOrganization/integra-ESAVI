import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';

/**
 *
 */
@Entity({
  schema: 'dhi_esavi',
  name: 'TC_TIPO_CATALOGO',
  comment: 'Tabla de tipos de catálogo',
})
export class TipoCatalogo extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador único de la tabla TC_TIPO_CATALOGO',
  })
  id: string;

  /**
   *
   */
  @Column({
    name: 'CODIGO',
    length: 10,
    comment: 'Código único del tipo de catálogo',
  })
  codigo: string;

  /**
   *
   */
  @Column({
    name: 'DESCRIPCION_TIPO_CATALOGO',
    nullable: true,
    comment: 'Descripción del tipo de catálogo',
  })
  descripcion: string;
}
