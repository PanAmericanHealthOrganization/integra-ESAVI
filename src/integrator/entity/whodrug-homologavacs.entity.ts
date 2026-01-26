import { OmitType } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';

/**
 *
 */
@Entity({
  schema: 'dhi_esavi',
  name: 'TC_WHODRUG_HOMOLOGA_VACS',
  comment: 'Tabla de catálogo que contiene los valores del campo Patente WHODrug, de VigiFLow que no tienen coincidencia al comparar contra el catálogo provisional Excel. Se utiliza como auxilir para realizar la homologación de nombres de vacunas manualmente.',
})

export class WhodrugHomologaVacs extends Auditoria implements IWhodrugHomologaVacs {
  /**
   * Descripción de la tabla 'TC_WHODRUG_HOMOLOGA_VACS' que almacena los valores del campo Patente WHODrug, de VigiFLow que no tienen coincidencia al comparar contra el catálogo provisional Excel:
   * - ID: Identificador único de la tabla.
   * - PATENTE_WHODRUG_VIGIFLOW: Nombre de la patente WHODrug registrada en VigiFlow.
   * - DRUGNAME_WHODRUG: Nombre del medicamento según el catálogo WHODrug de Uppsla Monitoring Centre.
   * - MPID_WHODRUG: Identificador único del medicamento en el catálogo WHODrug. Medicinal Product ID.
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador único pk de la tabla TC_WHODRUG_HOMOLOGA_VACS' })
  id: string;
  /**
   *
   */
  @Column({
    type: 'varchar',
    nullable: true,
    name: 'PATENTE_WHODRUG_VIGIFLOW',
    comment: 'Nombre de la patente WHODrug registrada en VigiFlow',
  })
  patenteWhodrugVigiflow: string;
  /**
   *
   */
  @Column({
    type: 'varchar',
    nullable: true,
    name: 'DRUGNAME_WHODRUG',
    comment: 'Nombre del medicamento según el catálogo WHODrug de Uppsla Monitoring Centre',
  })
  drugNameWhodrug: string;
  /**
   *
   */
  @Column({
    type: 'varchar',
    nullable: true,
    name: 'MPID_WHODRUG',
    comment: 'Identificador único del medicamento en el catálogo WHODrug. Medicinal Product ID',
  })
  mpIdWhodrug: string;
}
export interface IWhodrugHomologaVacs extends Auditoria {
  id: string;
  patenteWhodrugVigiflow: string;
  drugNameWhodrug: string;
  mpIdWhodrug: string;
}
export class WhodrugHomologaVacsDto extends Auditoria implements IWhodrugHomologaVacs {
  id: string;
  patenteWhodrugVigiflow: string;
  drugNameWhodrug: string;
  mpIdWhodrug: string;
}
export class CreateWhodrugHomologaVacsDto extends OmitType(WhodrugHomologaVacsDto, [
  'id',
  'createdAt',
  'createdBy',
  'deletedAt',
  'deletedBy',
  'isActive',
  'isEnabled',
  'updatedAt',
  'updatedBy',
] as const) {}
export class UpdateWhodrugHomologaVacsDto extends OmitType(WhodrugHomologaVacsDto, [
  'createdAt',
  'createdBy',
  'deletedAt',
  'deletedBy',
  'isActive',
  'isEnabled',
  'updatedAt',
  'updatedBy',
] as const) {}

