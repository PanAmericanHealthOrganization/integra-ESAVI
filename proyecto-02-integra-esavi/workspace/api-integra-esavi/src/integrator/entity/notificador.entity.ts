import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Catalogo } from './catalogo.entity';

@Entity({
  schema: 'DHI_ESAVI',
  name: 'TR_NOTIFICADOR',
  comment: 'Tabla de profesionales notificadores de ESAVI',
})
export class Notificador extends Auditoria {
  @PrimaryColumn({
    name: 'IDENTIFICACION',
    type: 'varchar',
    length: 20,
    comment: 'Número de identificación del notificador (cédula o pasaporte)',
  })
  identificacion: string;

  @Column({
    name: 'NOMBRES',
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'Nombres completos del notificador',
  })
  nombres: string;

  @ManyToOne(() => Catalogo, { nullable: true, eager: false })
  @JoinColumn({ name: 'CT_PROFESION_ID' })
  profesion: Catalogo;
}
