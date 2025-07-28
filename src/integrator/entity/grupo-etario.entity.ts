import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'dhi_esavi' , name: 'TC_GRUPOETARIO' })
export class GrupoEtario {
  @PrimaryGeneratedColumn('uuid', { name: 'GRUPOETARIO_ID' })
  id: string;
  @Column({ name: 'INICIO' })
  inicio: number;
  @Column({ name: 'FIN' })
  fin: number;
  @Column({ name: 'DESCRIPCION' })
  descripcion: string;
}
