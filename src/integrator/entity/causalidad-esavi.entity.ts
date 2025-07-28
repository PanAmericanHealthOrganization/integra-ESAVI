import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Notificacion } from './notificacion.entity';
import { DatoEsavi } from './dato-esavi.entity';
import { DatoVacuna } from './dato-vacuna.entity';

@Entity({ schema: 'dhi_esavi' , name: 'TR_CAUSALIDADESAVI' })
export class CausalidadEsavi extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'CAUSALIDADESAVI_ID' })
  id: string;

  @ManyToOne(() => DatoEsavi)
  @JoinColumn({ name: 'DATOSESAVI_ID' })
  datoEsavi: DatoEsavi;

  @ManyToOne(() => DatoVacuna)
  @JoinColumn({ name: 'DATOVACUNA_ID' })
  datoVacuna: DatoVacuna;

  @Column({ name: 'FECHACAUSALIDADESAVI', nullable: true })
  fechaCausalidadEsavi: Date;

  @Column({ name: 'SISTEMACLASFCAUSALIDAD', length: 16, nullable: true })
  sistemaClasificacionCausalidad: string;

  @Column({ name: 'OTROSISTEMACLASFCAUSALIDAD', length: 16, nullable: true })
  otroSistemaClasificacionCausalidad: string;

  @Column({ name: 'CLASIFICACIONCAUSAESAVI', type: 'text', nullable: true })
  clasificacionCausaEsavi: string;

  @Column({ name: 'CLASIFICACIONDECAUSALIDADWHOAEFI', length: 16 })
  clasificacionCausalidadWHOAEFI: string;

  @Column({ name: 'CLASIFICACIONDECAUSALIDADWHOUMC', length: 16 })
  clasificacionCausalidadWHOUMC: string;

  @Column({ name: 'REFERENCIAIDENTIFICADORVACUNA', nullable: true })
  referenciaIdentificadorVacuna: number;

  @Column({ name: 'CLASIFICACIONDECAUSALIDADNARANJO', length: 16 })
  clasificacionCausalidadNaranjo: string;

  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;
}
