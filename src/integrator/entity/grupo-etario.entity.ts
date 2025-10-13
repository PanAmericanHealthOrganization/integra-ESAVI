import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { OmitType } from '@nestjs/swagger';

@Entity({
  schema: 'dhi_esavi',
  name: 'TC_GRUPO_ETARIO',
  comment: 'Tabla de grupos etarios MSP',
})
export class GrupoEtario extends Auditoria implements IGrupoEtario {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  /**
   *
   */
  @Column({
    type: 'int',
    name: 'INICIO_EDAD',
    nullable: false,
    comment: 'Edad de inicio del grupo etario en años',
  })
  inicioEdad: number;

  /**
   *
   */
  @Column({
    type: 'int',
    name: 'FIN_EDAD',
    nullable: false,
    comment: 'Edad de fin del grupo etario en años',
  })
  finEdad: number;

  /**
   *
   */
  @Column({
    type: 'varchar',
    length: 100,
    name: 'DESCRIPCION_RANGO',
    comment: 'Descripción del rango etario según el MSP',
  })
  descripcion: string;
}

export interface IGrupoEtario extends Auditoria {
  id: string;
  inicioEdad: number;
  finEdad: number;
  descripcion: string;
}
export class GrupoEtarioDto extends Auditoria implements IGrupoEtario {
  id: string;
  inicioEdad: number;
  finEdad: number;
  descripcion: string;
}

export class CreateGrupoEtarioDto  extends OmitType(GrupoEtarioDto, [
  'id', 'createdAt', 'createdBy', 'deletedAt','deletedBy', 'isActive', 'isEnabled', 'updatedAt', 'updatedBy'] as const) {  

}

export class UpdateGrupoEtarioDto extends OmitType(GrupoEtarioDto, ['inicioEdad', 'finEdad'] as const) {

}