import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'dhi_esavi' , name: 'TC_TIPOCATALOGO' })
export class TipoCatalogo {
  @PrimaryGeneratedColumn('uuid', { name: 'TIPOCATALOGO_ID' })
  tipoCatalogoId: string;
  @Column({ name: 'CODIGO', length: 3 })
  codigo: string;
  @Column({ name: 'DESCRIPCIONTIPOCATALOGO', nullable: true })
  descripcion: string;
}
