import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TipoCatalogo } from './tipo-catalogo.entity';

@Entity({ schema: 'dhi_esavi' , name: 'TC_CATALOGO' })
export class Catalogo {
  @PrimaryGeneratedColumn('uuid', { name: 'CATALOGO_ID' })
  id: string;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTCATALOGO_ID' })
  padre: Catalogo;
  @Column({ name: 'DESCRIPCIONVIGIFLOW' })
  vigiflow: string;
  @Column({ name: 'DESCRIPCIONDHIS2' })
  dhis2: string;
  @Column({ name: 'DESCRIPCIONHOMOLOGADA' })
  homologada: string;
  @ManyToOne(() => TipoCatalogo)
  @JoinColumn({ name: 'CTTIPOCATALOGO_ID' })
  tipoCatalogo: TipoCatalogo;
}
