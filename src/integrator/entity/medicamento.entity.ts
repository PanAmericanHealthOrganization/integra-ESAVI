import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Notificacion } from './notificacion.entity';
import * as moment from 'moment/moment';

@Entity({
  schema: 'dhi_esavi',
  name: 'TR_MEDICAMENTO',
  comment: 'Tabla de medicamentos',
})
export class Medicamento extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;
  @Column({
    name: 'ROL_MEDICAMENTO',
    nullable: true,
    comment:
      'Rol del medicamento en el evento (sospechoso, concomitante, etc.)',
  })
  rolMedicamento: string;
  @Column({
    name: 'CODIGO_ATC',
    nullable: true,
    comment: 'Código ATC (Anatomical Therapeutic Chemical) del medicamento',
  })
  codigoATC: string;
  @Column({
    name: 'SISTEMA_DE_CODIFICACION',
    nullable: true,
    comment: 'Sistema de codificación utilizado para el medicamento',
  })
  sistemaCodificacion: string;

  @Column({
    name: 'CODIGO_MEDICAMENTO',
    nullable: true,
    comment: 'Código identificador del medicamento',
  })
  codigo: string;
  @Column({
    name: 'NOMBRE_MEDICAMENTO',
    nullable: true,
    comment: 'Nombre comercial del medicamento',
  })
  nombre: string;
  @Column({
    name: 'NOMBRE_NORMALIZADO_MEDICAMENTO',
    nullable: true,
    comment: 'Nombre normalizado del medicamento',
  })
  nombreNormalizado: string;

  @Column({
    name: 'CODIGO_FORMA_FARMACEUTICA',
    nullable: true,
    length: 64,
    comment: 'Código de la forma farmacéutica',
  })
  codigoFormaFarmaceutica: string;
  @Column({
    name: 'NOMBRE_FORMA_FARMACEUTICA',
    nullable: true,
    length: 128,
    comment: 'Nombre de la forma farmacéutica (tableta, jarabe, etc.)',
  })
  nombreFormaFarmaceutica: string;

  @Column({
    name: 'CODIGO_VIA_ADMINISTRACION',
    nullable: true,
    length: 64,
    comment: 'Código de la vía de administración',
  })
  codigoViaAdministracion: string;
  @Column({
    name: 'NOMBRE_VIA_ADMINISTRACION',
    nullable: true,
    length: 64,
    comment: 'Nombre de la vía de administración (oral, intravenosa, etc.)',
  })
  nombreViaAdministracion: string;

  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
