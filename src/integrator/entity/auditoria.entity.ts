import { Column } from 'typeorm';

/**
 *
 */
export abstract class Auditoria implements IAuditoria {
  /**
   *
   */
  @Column({
    name: 'AUD_FECHA_CREACION',
    type: 'timestamptz',
    nullable: false,
    comment: 'Fecha de creación',
  })
  createdAt: Date;

  /**
   *
   */
  @Column({
    name: 'AUD_USUARIO_CREACION',
    length: 60,
    nullable: false,
    comment: 'Usuario que creó el registro',
  })
  createdBy: string;

  /**
   *
   */
  @Column({
    name: 'AUD_FECHA_ACTUALIZACION',
    type: 'timestamptz',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Fecha de actualización',
  })
  updatedAt: Date;

  /**
   *
   */
  @Column({
    name: 'AUD_USUARIO_ACTUALIZACION',
    nullable: true,
    default: 'SYSTEM',
    length: 60,
    comment: 'Usuario que actualizó el registro',
  })
  updatedBy: string;

  /**
   *
   */
  @Column({
    name: 'AUD_FECHA_ELIMINACION',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha de eliminación',
  })
  deletedAt: Date;

  /**
   *
   */
  @Column({
    name: 'AUD_USUARIO_ELIMINACION',
    nullable: true,
    length: 60,
    comment: 'Usuario que eliminó el registro',
  })
  deletedBy: string;

  /**
   *
   */
  @Column({
    name: 'AUD_HABILITADO',
    type: 'boolean',
    default: true,
    nullable: false,
    comment: 'Indica si el registro está habilitado',
  })
  isEnabled: boolean;

  /**
   *
   */
  @Column({
    name: 'AUD_ESTADO',
    type: 'boolean',
    default: true,
    nullable: false,
    comment: 'Indica si el registro está activo',
  })
  isActive: boolean;
}

export class IAuditoria {
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt: Date;
  deletedBy: string;
  isEnabled: boolean;
  isActive: boolean;
}

export class AuditoriaDto implements IAuditoria {
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt: Date;
  deletedBy: string;
  isEnabled: boolean;
  isActive: boolean;
}
