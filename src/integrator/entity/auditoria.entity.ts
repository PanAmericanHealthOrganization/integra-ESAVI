import { Column } from 'typeorm';

/**
 *
 */
export abstract class Auditoria {
  /**
   *
   */
  @Column({
    name: 'AUD_FECHACREACION',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha de creación',
  })
  createdAt: Date;

  /**
   *
   */
  @Column({
    name: 'AUD_USUARIOCREACION',
    length: 60,
    nullable: true,
    comment: 'Usuario que creó el registro',
  })
  createdBy: string;

  /**
   *
   */
  @Column({
    name: 'AUD_FECHAACTUALIZACION',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha de actualización',
  })
  updatedAt: Date;

  /**
   *
   */
  @Column({
    name: 'AUD_USUARIOACTUALIZACION',
    nullable: true,
    length: 60,
    comment: 'Usuario que actualizó el registro',
  })
  updatedBy: string;

  /**
   *
   */
  @Column({
    name: 'AUD_FECHAELIMINACION',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha de eliminación',
  })
  deletedAt: Date;

  /**
   *
   */
  @Column({
    name: 'AUD_USUARIOELIMINACION',
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
    comment: 'Indica si el registro está activo',
  })
  isActive: boolean;
}
