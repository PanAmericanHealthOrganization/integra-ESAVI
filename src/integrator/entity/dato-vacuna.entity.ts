import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Notificacion } from './notificacion.entity';
import { Auditoria } from './auditoria.entity';
import * as moment from 'moment/moment';

@Entity({ schema: 'dhi_esavi' , name: 'TR_DATOVACUNA' })
export class DatoVacuna extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'DATOVACUNA_ID' })
  id: string;
  @Column({ name: 'CODIGOATC', nullable: true })
  codigoAtc: string;
  @Column({ name: 'ROLVACUNA', nullable: true })
  rolVacuna: string;
  @Column({ name: 'SISTEMADECODIFICACION', nullable: true, default: 'WHUDRUG' })
  sistemaDeCodificacion: string;
  @Column({ name: 'NOMBREVACUNA', nullable: true })
  nombreVacuna: string;
  @Column({ name: 'NOMBREVACUNAPATENTEWHODRUG', nullable: true })
  nombreVacunaPatenteWhoDrug: string;

  @Column({ name: 'DRUGCODE', nullable: true })
  drugCode: string;

  @Column({name: 'MAHOLDERSJSON' ,  type: 'jsonb', nullable: true }) 
  mahholdersJson: any; 

  @Column({ name: 'ACTIVEINGREDENTSJSON' , type: 'jsonb', nullable: true })
  activeIngredientsJson: any;

  @Column({ name: 'NOMBRENORMALIZADOVACUNA',  nullable: true })
  nombreVacunaNormalizada: string;
  @Column({ name: 'PRINCIPIOACTIVOWHODRUG', nullable: true })
  principioActivoWhoDrug: string;
  @Column({ name: 'CODIGOVACUNAOTRO', nullable: true })
  codigoOtro: string;
  @Column({ name: 'IDENTIFICADORVACUNA', nullable: true })
  identificadorVacuna: string;
  @Column({ name: 'NOMBREFABRICANTE', nullable: true })
  nombreFabricante: string;
  @Column({ name: 'NOMBREFABRICANTEWHODRUG', nullable: true })
  nombreFabricanteWhoDrug: string;
  @Column({ name: 'CODIGOFABRICANTEWHODRUG', nullable: true })
  codigoFabricanteWhoDrug: string;
  @Column({ name: 'NUMERODOSISVACUNA', nullable: true })
  numeroDosisVacuna: number;
  @Column({ name: 'DOSIS', nullable: true })
  dosis: string;
  @Column({ name: 'DOSIS1', nullable: true })
  dosis1: string;
  @Column({ name: 'INTERVALODOSIFICACION', nullable: true })
  intervaloDosificacion: string;
  @Column({ name: 'NUMEROLOTE', nullable: true })
  numeroLote: string;
  @Column({ name: 'FECHAVENCIMIENTOVACUNA', nullable: true })
  fechaVencimientoVacuna: Date;
  @Column({ name: 'NOMBREDILUYENTEVACUNA', nullable: true })
  nombreDiluyenteVacuna: string;
  @Column({ name: 'FECHAVENCIMIENTODILUYENTE', nullable: true })
  fechaVencimientoDiluyente: Date;
  @Column({ name: 'PAISAUTORIZACION', nullable: true })
  paisAutorizacion: string;
  @Column({ name: 'CONCENTRACION', nullable: true })
  concentracion: string;
  @Column({ name: 'INGREDIENTESOSPECHOSO', nullable: true })
  ingredienteSospechoso: string;
  @Column({ name: 'ACCIONTOMADA', nullable: true })
  accionTomada: string;
  @Column({ name: 'INFORMACIONADICIONALMEDICAMENTO', nullable: true })
  informacionAdicionalMedicamento: string;
  @Column({ name: 'INDICACIONMEDDRA', type: 'text', nullable: true })
  indicacionMeddra: string;
  @Column({
    name: 'INDICACIONNOTIFICADORPRIMARIO',
    type: 'text',
    nullable: true,
  })
  indicacionNotificadorPrimario: string;
  @Column({ name: 'DURACION', nullable: true })
  duracion: string;
  @Column({ name: 'INICIOADMINISTRACION', type: 'timestamptz', nullable: true })
  inicioAdministracion: Date;
  @Column({ name: 'FINADMINISTRACION', type: 'timestamptz', nullable: true })
  finAdministracion: Date;
  @Column({ name: 'FORMAFARMACEUTICA', nullable: true })
  formaFarmaceutica: string;
  @Column({ name: 'FORMAFARMACEUTICAEDQM', nullable: true })
  formaFarmaceuticaEDQM: string;
  @Column({ name: 'VIAADMINISTRACION', nullable: true })
  viaAdministracion: string;
  @Column({ name: 'VIAADMINISTRACIONEDQM', nullable: true })
  viaAdministracionEDQM: string;
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
