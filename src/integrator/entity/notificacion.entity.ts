import * as moment from 'moment';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Catalogo } from './catalogo.entity';
import { GrupoEtario } from './grupo-etario.entity';
import { Paciente } from './paciente.entity';

@Entity({ schema: 'dhi_esavi', name: 'TR_NOTIFICACION' })
@TableInheritance({ column: { type: 'varchar', name: 'TIPO' } })
export class Notificacion extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'NOTIFICACION_ID' })
  id: string;
  //TODO: ALOPEZ,esta relacion es one2one o se debe cambiar a many2one
  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'PACIENTE_ID' })
  paciente: Paciente;
  ////////////////////////////////////////////////////////////////////
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTPROVINCIARESIDENCIA_ID' })
  provinciaResidencia: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTCANTORESIDENCIA_ID' })
  cantonResidencia: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTPARROQUIARESIDENCIA_ID' })
  parroquiaResidencia: Catalogo;
  @Column({ name: 'OTRAPARROQUIARESIDENCIA', nullable: true })
  otraParroquiaResidencia: string;
  ////////////////////////////////////////////////////////////////////
  @Column({ name: 'PESO', nullable: true })
  peso: number;
  @Column({ name: 'ALTURA', nullable: true })
  altura: number;
  @Column({ name: 'FECHANACIMIENTO', nullable: true })
  fechaNacimiento: Date;
  @Column({ name: 'EDAD', nullable: true })
  edad: number;
  @Column({ name: 'LACTANDO', nullable: true })
  lactando: boolean;

  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTUNIDADEDAD_ID' })
  unidadEdad: Catalogo;
  @ManyToOne(() => GrupoEtario)
  @JoinColumn({ name: 'CTGRUPOETARIO_ID' })
  grupoEtario: GrupoEtario;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTPROFESIONNOTIFICADOR_ID' })
  profesionNotificador: Catalogo;
  @Column({ name: 'TITULONOTIFICADOR', nullable: true })
  tituloNotificador: string;
  @Column({ name: 'ORGANIZACIONNOTIFICADOR', nullable: true })
  organizacion: string;
  @Column({ name: 'ORGANIZACIONUNITCODIGO', nullable: true })
  organizacionUnitCode: string;
  @Column({ name: 'ORGANIZACIONUNIT', nullable: true })
  organizacionUnit: string;
  @Column({ name: 'NOMBRENOTIFICADOR', nullable: true })
  nombreNotificador: string;
  @Column({ name: 'IDENTIFICACIONNOTIFICADOR', nullable: true })
  identificacionNotificador: string;
  /////////////////Clase residencia sirve para paciente y notificador
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTPROVINCIANOTIFICADOR_ID' })
  provinciaNotificador: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTCANTONNOTIFICADOR_ID' })
  cantonNotificador: Catalogo;
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTPARROQUIANOTIFICADOR_ID' })
  parroquiaNotificador: Catalogo;
  @Column({ name: 'OTRAPARROQUIANOTIFICADOR', nullable: true })
  otraParroquia: string;
  @Column({ name: 'COMENTARIONOTIFICADOR', nullable: true })
  comentario: string;
  @Column({ name: 'CASONARRATIVO', nullable: true })
  casoNarrativo: string;
  @Column({ name: 'TITULOREPORTE', nullable: true })
  tituloReporte: string;
  @Column({ name: 'TIPOREPORTE', nullable: true })
  tipoReporte: string;
  @Column({ name: 'MEDIONOTIFICACION', nullable: true })
  medioNotificacion: string;
  //////////////// Emisor clase
  @Column({ name: 'TIPOEMISOR', nullable: true })
  tipoEmisor: string;
  @Column({ name: 'ORGANIZACIONEMISOR', nullable: true })
  organizacionEmisor: string;
  @Column({ name: 'DELEGADOORGANIZACION', nullable: true })
  delegadoOrganizacion: string;
  @Column({ name: 'NOMBREEMISOR', nullable: true })
  nombreEmisor: string;
  @Column({ name: 'ULTIMAEDICIONREGISTRADA', nullable: true })
  ultimaEdicionRegistrada: string;
  ////////////////////////////////////////////////
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CTESTADOREGISTRO_ID' })
  estadoRegistro: Catalogo;
  //TODO: ALOPEZ, Validar si estas fechas deben ser nullables o no
  @Column({ name: 'FECHANOTIFICACION', nullable: true })
  fechaNotificacion: Date;
  @Column({ name: 'FECHAREPORTENACIONAL', nullable: true })
  fechaReporteNacional: Date;
  @Column({ name: 'FECHALLENADOFICHA', nullable: true })
  fechaLlenadoFicha: Date;
  @Column({ name: 'FECHAATENCION', nullable: true })
  fechaAtencion: Date;
  //////////////////////////////////////////////////
  @Column({ name: 'ANTECEDENTEEVENTOPREVIO', nullable: true })
  antecedenteEventoPrevio: number;
  @Column({ name: 'ANTECEDENTEVACUNAL', nullable: true })
  antecedenteVacunal: number;
  //////////////////////////////////////////////////
  @Column({ name: 'UNICODIGOUNIDADSALUD', nullable: true })
  codigoUnidadSalud: string;
  @Column({ name: 'MONITOREOESTABLECIMIENTOSALUD', nullable: true })
  monitorioEstablecimientoSalud: number;

  // @Column({ name: 'TIPO', nullable: true })
  // tipo: string;

  //   @Expose()
  // get tipo(): string {
  //   return this._tipo;
  // }

  // set tipo(value: string) {
  //   this._tipo = value;
  // }

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
  beforeUpdate() {
    this.updatedAt = moment().toDate();
  }
}
