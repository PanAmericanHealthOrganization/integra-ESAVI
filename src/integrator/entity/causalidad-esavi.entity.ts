import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Notificacion } from './notificacion.entity';
import { DatoEsavi } from './dato-esavi.entity';
import { DatoVacuna } from './dato-vacuna.entity';

@Entity({ schema: 'dhi_esavi', name: 'TR_CAUSALIDAD_ESAVI' })
export class CausalidadEsavi extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'CAUSALIDAD_ESAVI_ID' })
  id: string;

  @ManyToOne(() => DatoEsavi)
  @JoinColumn({ name: 'DATOSESAVI_ID' })
  datoEsavi: DatoEsavi;

  @ManyToOne(() => DatoVacuna)
  @JoinColumn({ name: 'DATOVACUNA_ID' })
  datoVacuna: DatoVacuna;

  @Column({
    name: 'FECHA_CAUSALIDAD_ESAVI',
    nullable: true,
    comment: 'Fecha de evaluación de la causalidad del ESAVI',
  })
  fechaCausalidadEsavi: Date;

  @Column({
    name: 'SISTEMA_CLASF_CAUSALIDAD',
    length: 16,
    nullable: true,
    comment: 'Sistema de clasificación de causalidad utilizado',
  })
  sistemaClasificacionCausalidad: string;

  @Column({
    name: 'OTRO_SISTEMA_CLASF_CAUSALIDAD',
    length: 16,
    nullable: true,
    comment: 'Otro sistema de clasificación de causalidad no contemplado',
  })
  otroSistemaClasificacionCausalidad: string;

  @Column({
    name: 'CLASIFICACION_CAUSA_ESAVI',
    type: 'text',
    nullable: true,
    comment: 'Clasificación de la causa del ESAVI',
  })
  clasificacionCausaEsavi: string;

  @Column({
    name: 'CLASIFICACION_DE_CAUSALIDAD_WHO_AEFI',
    length: 16,
    comment: 'Clasificación de causalidad según WHO-AEFI',
  })
  clasificacionCausalidadWHOAEFI: string;

  @Column({
    name: 'CLASIFICACION_DE_CAUSALIDAD_WHO_UMC',
    length: 16,
    comment: 'Clasificación de causalidad según WHO-UMC',
  })
  clasificacionCausalidadWHOUMC: string;

  @Column({
    name: 'REFERENCIA_IDENTIFICADOR_VACUNA',
    nullable: true,
    comment: 'Referencia al identificador de la vacuna evaluada',
  })
  referenciaIdentificadorVacuna: number;

  @Column({
    name: 'CLASIFICACION_DE_CAUSALIDAD_NARANJO',
    length: 16,
    comment: 'Clasificación de causalidad según escala de Naranjo',
  })
  clasificacionCausalidadNaranjo: string;

  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;
}
