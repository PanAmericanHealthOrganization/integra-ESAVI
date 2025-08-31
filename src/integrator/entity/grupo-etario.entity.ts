import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';

@Entity({
  schema: 'dhi_esavi',
  name: 'TC_GRUPO_ETARIO',
  comment: 'Tabla de grupos etarios',
})
export class GrupoEtario extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  /**
   *
   */
  @Column({
    name: 'INICIO_EDAD',
    nullable: true,
    comment: 'Edad de inicio del grupo etario en años',
  })
  inicioEdad: number;

  /**
   *
   */
  @Column({
    name: 'FIN_EDAD',
    nullable: true,
    comment: 'Edad de fin del grupo etario en años',
  })
  finEdad: number;

  /**
   *
   */
  @Column({
    name: 'DESCRIPCION_RANGO',
    comment: 'Descripción del rango etario (ej: Adulto joven, Adulto mayor)',
  })
  descripcion: string;
}
