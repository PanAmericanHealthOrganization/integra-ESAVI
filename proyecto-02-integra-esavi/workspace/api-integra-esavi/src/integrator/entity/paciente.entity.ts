import * as moment from 'moment/moment';
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, TableInheritance } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Catalogo } from './catalogo.entity';

/**
 *
 */
@Entity({
  schema: 'dhi_esavi',
  name: 'TR_PACIENTE',
  comment: 'Tabla de pacientes',
})
@TableInheritance({ column: { type: 'varchar', name: 'ORIGEN' } })
export class Paciente extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador único PK de la tabla TR_PACIENTE' })
  id: string;

  /**
   *
   */
  @Column({
    name: 'NOMBRE',
    nullable: true,
    comment: 'Nombre completo del paciente. Disponible en DHIS2.',
  })
  nombre: string;
  /**
   *
   */
  @Column({
    name: 'INICIALES_NOMBRE',
    nullable: true,
    comment: 'Iniciales del nombre del paciente. Disponible en VigiFlow.',
  })
  inicialesNombre: string;

  /**
   *
   */
  @Column({
    name: 'IDENTIFICACION',
    nullable: true,
    comment: 'Número de identificación del paciente',
  })
  identificacion: string;

  /**
   *
   */
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_SEXO_ID' })
  sexo: Catalogo;

  /**
   *
   */
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_AUTO_IDENTIFICACION_ETNICA_ID' })
  autoIdentificacion: Catalogo;

  @Column({
    name: 'FECHA_NACIMIENTO',
    type: 'date',
    nullable: true,
    comment: 'Fecha de nacimiento del paciente',
  })
  fechaNacimiento: Date;

  /** */
  @Column({
    name: 'REGISTRO_SINCRONIZADO',
    default: false,
    nullable: true,
    comment: 'Indica si el registro ha sido sincronizado con sistemas externos',
  })
  registroSincronizado: boolean;

  /**
   *
   */
  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
