import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Antecedente } from './antecedente.entity';
import { Catalogo } from './catalogo.entity';
import * as moment from 'moment/moment';
import { Notificacion } from './notificacion.entity';

//TODO: ralopez, aplicar clean-code a nombre de modelo ER
@Entity({ schema: 'dhi_esavi', name: 'TR_ANTECEDENTES_ENFERMEDADES_PREVIAS' })
export class AntecedentePreexistencia extends Antecedente {
  @Column({
    name: 'DESCRIPCION_ENF_PREVIAS',
    type: 'text',
    comment: 'Descripción de la enfermedad previa del paciente',
  })
  descripcion: string;
  //TODO: ralopez, este catalogo a quien apunta. no hay relacion
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTLLTMEDDRA_ID' })
  catalogoMedra: Catalogo;

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
    this.createdAt = moment().toDate();
  }
}
