import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Antecedente } from './antecedente.entity';
import { Notificacion } from './notificacion.entity';

//TODO: ralopez, aplicar clean-code a nombre de modelo ER
@Entity({ schema: 'DHI_ESAVI', name: 'TR_ANTECEDENTES_ENFERMEDADES_PREVIAS', comment: 'Tabla de antecedentes de enfermedades previas' })
export class AntecedentePreexistencia extends Antecedente {
  @Column({
    name: 'DESCRIPCION_ENF_PREVIAS',
    type: 'text',
    comment: 'Descripción de la enfermedad previa del paciente',
  })
  descripcion: string;

  /**
   * MED_LLT.ID vive en el esquema MEDDRA, gestionado por una conexión TypeORM distinta
   * (MEDDRA_DS) a la de esta entidad (POSTGRES_INTEGRATOR_DS), por lo que no puede
   * modelarse como relación ORM (@ManyToOne). Se guarda el id numérico resuelto por
   * MeddraLLTService y se consulta manualmente cuando se necesita el registro completo.
   */
  @Column({
    name: 'CTLLTMEDDRA_ID',
    type: 'int',
    nullable: true,
    comment: 'Id de MED_LLT (esquema MEDDRA) correspondiente a la enfermedad previa',
  })
  ctLltMeddraId: number;

  @Column({
    name: 'CODIGO_ESAVI_CIE10',
    comment: 'Código CIE-10 de la enfermedad previa',
  })
  codigoEsaviCIE10: string;

  //Id Notificacion
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
  }
}
