import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TipoCatalogo } from './tipo-catalogo.entity';

@Entity({
  schema: 'dhi_esavi',
  name: 'TC_CATALOGO',
  comment: 'Catálogo de valores de homologaciones de Vigiflow a DHIS2',
})
export class Catalogo {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', {
    name: 'CATALOGO_ID',
    comment: 'Identificador del catálogo',
  })
  id: string;

  /**
   *
   */
  @ManyToOne(() => Catalogo, { nullable: true })
  @JoinColumn({
    name: 'CATALOGO_ID_PADRE',
  })
  padre: Catalogo;

  /**
   *
   */
  @Column({
    name: 'DESCRIPCION_VIGIFLOW',
    comment: 'Descripción en Vigiflow',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  vigiflow: string;

  /**
   *
   */
  @Column({
    name: 'DESCRIPCION_DHIS2',
    comment: 'Descripción en DHIS2',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  dhis2: string;

  /**
   *
   */
  @Column({
    name: 'DESCRIPCION_HOMOLOGADA',
    comment: 'Descripción homologada',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  homologada: string;

  /**
   *
   */
  @ManyToOne(() => TipoCatalogo)
  @JoinColumn({
    name: 'CTTIPOCATALOGO_ID',
  })
  tipoCatalogo: TipoCatalogo;
}
