import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'mapeo_medra_cie10' })
export class MapeoMedraCie10 {
  @PrimaryColumn({ name: 'codigo_cie10' })
  codigoCie10: string;

  @PrimaryColumn({ name: 'codigo_llt_meddra' })
  codigoLltMeddra: string;

  @Column({ name: 'termino_cie10', nullable: true })
  terminoCie10: string;
}
