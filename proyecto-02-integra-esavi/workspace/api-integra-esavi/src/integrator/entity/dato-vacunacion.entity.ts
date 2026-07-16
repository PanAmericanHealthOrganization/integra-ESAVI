import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { DatoVacuna } from './dato-vacuna.entity';
import { Establecimiento } from './establecimiento.entity';
import { Notificacion } from './notificacion.entity';

@Entity({
  schema: 'DHI_ESAVI',
  name: 'TR_DATO_VACUNACION',
  comment: 'Tabla de datos de vacunación',
})
export class DatoVacunacion extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador único PK de la tabla TR_DATO_VACUNACION' })
  id: string;

  /**
   *
   */
  @Column({
    name: 'NOMBRE_VACUNATORIO',
    length: 128,
    nullable: true,
    comment: 'Nombre del establecimiento donde se aplicó la vacuna',
  })
  nombreVacunatorio: string;
  /**
   *
   */
  @Column({
    name: 'FECHA_VACUNACION',
    nullable: true,
    comment: 'Fecha en que se administró la vacuna',
  })
  fechaVacunacion: Date;
  /**
   *
   */
  @Column({
    name: 'HORA_VACUNACION',
    nullable: true,
    comment: 'Hora en que se administró la vacuna',
  })
  horaVacunacion: Date;

  /**
   *
   */
  @Column({
    name: 'DIAS_TRANSCURRIDOS_SINTOMAS',
    type: 'int',
    nullable: true,
    comment: 'Número de días transcurridos entre la fecha de vacunación y el inicio de síntomas (dato calculado y provisto por DHIS2)',
  })
  diasTranscurridosSintomas: number;

  /**
   * Establecimiento donde se administró la vacuna (referenciado por unicodigo).
   * Cuando el vacunatorio no está en el catálogo de establecimientos, usar otraDireccion.
   */
  @ManyToOne(() => Establecimiento, { nullable: true, eager: false })
  @JoinColumn({ name: 'ESTABLECIMIENTO_UNI_CODIGO', referencedColumnName: 'uniCodigo' })
  establecimiento: Establecimiento;

  /**
   *
   */
  @Column({
    name: 'OTRA_DIRECCION_VACUNATORIO',
    type: 'varchar',
    length: 1200,
    nullable: true,
    comment: 'Dirección del vacunatorio cuando no está registrado como establecimiento',
  })
  otraDireccion: string;

  /**
   *
   */
  @Column({
    name: 'CODIGOMECANISMOVERIFICACION',
    length: 16,
    nullable: true,
    comment: 'Código del mecanismo utilizado para verificar la vacunación',
  })
  codigoMecanismoVerificacion: string;

  /**
   *
   */
  @Column({
    name: 'NOMBREOTROMECANISMOVERIFICACION',
    length: 128,
    nullable: true,
    comment: 'Nombre de otro mecanismo de verificación no contemplado',
  })
  nombreOtroMecanismo: string;
  /**
   *
   */
  @Column({
    name: 'FECHARECONSTITUCIONVACUNA',
    nullable: true,
    comment: 'Fecha de reconstitución de la vacuna',
  })
  fechaReconstitucion: Date;
  /**
   *
   */
  @Column({
    name: 'HORARECONSTITUCIONVACUNA',
    nullable: true,
    comment: 'Hora de reconstitución de la vacuna',
  })
  horaReconstitucion: Date;

  /**
   *
   */
  @Column({
    name: 'INICIO_ADMINISTRACION',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha y hora de inicio de administración de la vacuna',
  })
  inicioAdministracion: Date;

  /**
   *
   */
  @Column({
    name: 'FIN_ADMINISTRACION',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha y hora de fin de administración de la vacuna',
  })
  finAdministracion: Date;

  /**
   *
   */
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @OneToMany(() => DatoVacuna, (datoVacuna) => datoVacuna.datoVacunacion, { cascade: true })
  datosVacuna: DatoVacuna[];

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
  }
}
