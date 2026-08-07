import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ISync } from '../dto/sync.dto';
import { Auditoria } from './auditoria.entity';

/**
 * Estado del proceso. Único enum de estados del sistema: reemplaza a los
 * `SyncStateEnum` que MedDRA y WHODrug mantenían por separado (con valores
 * distintos e incluso un typo, `FAILDED`).
 *
 * Los enums se declaran antes de la entidad a propósito: los decoradores
 * `@Column` se evalúan al definirse la clase, y un enum declarado después
 * todavía valdría `undefined` en ese momento.
 */
export enum SyncStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/** Fuente sincronizada. Permite que cada pantalla filtre su propio historial. */
export enum SyncSource {
  MEDDRA = 'MEDDRA',
  WHODRUG = 'WHODRUG',
  DATAMART = 'DATAMART',
  VACUNOMETRO = 'VACUNOMETRO',
  DHIS2 = 'DHIS2',
  VIGIFLOW = 'VIGIFLOW',
  SEED = 'SEED',
}

/**
 * Log único de procesos de sincronización.
 *
 * Una fila por corrida de cualquier fuente (MedDRA, WHODrug, datamart,
 * vacunómetro, DHIS2, VigiFlow, seed). Siempre se escribe al arrancar el
 * proceso con estado RUNNING y se cierra con COMPLETED o FAILED, de modo que
 * un proceso interrumpido queda visible como RUNNING en vez de desaparecer.
 *
 * Sustituye a las bitácoras propias MEDDRA.MED_SYNC y WHO_DRUG.DRUG_SYNC.
 */
@Entity({
  schema: 'DHI_ESAVI',
  name: 'TR_SYNC_PROCESS',
  comment: 'Log de los procesos de sincronización con las diferentes fuentes de datos',
})
@Index(['source', 'startTime'])
export class SyncProcess extends Auditoria implements ISync {
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador único de la corrida',
  })
  id: string;

  @Column({
    name: 'SOURCE',
    type: 'enum',
    enum: SyncSource,
    comment: 'Fuente sincronizada (MEDDRA, WHODRUG, DATAMART, ...)',
  })
  source: SyncSource;

  @Column({
    name: 'NAME',
    comment: 'Descripción legible de la corrida',
  })
  name: string;

  @Column({
    name: 'STATUS',
    type: 'enum',
    enum: SyncStatus,
    default: SyncStatus.RUNNING,
    comment: 'Estado de la corrida: RUNNING, COMPLETED o FAILED',
  })
  status: SyncStatus;

  @Column({
    name: 'START_TIME',
    type: 'timestamp',
    comment: 'Fecha y hora de inicio de la corrida',
  })
  startTime: Date;

  @Column({
    name: 'END_TIME',
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora de fin. Nulo mientras la corrida sigue en curso',
  })
  endTime: Date;

  @Column({
    name: 'MESSAGE',
    type: 'text',
    nullable: true,
    comment: 'Resumen del resultado cuando la corrida termina en COMPLETED',
  })
  message?: string;

  @Column({
    name: 'ERROR_MESSAGE',
    type: 'text',
    nullable: true,
    comment: 'Mensaje del error que dejó la corrida en FAILED',
  })
  errorMessage: string;

  @Column({
    name: 'ERROR_STACK',
    type: 'text',
    nullable: true,
    comment: 'Stack trace del error, para depuración',
  })
  errorStack: string;

  @Column({
    name: 'DATA_START_DATE',
    type: 'date',
    nullable: true,
    comment: 'Inicio del rango de datos importados, si la fuente maneja rangos',
  })
  dataStartDate: Date;

  @Column({
    name: 'DATA_END_DATE',
    type: 'date',
    nullable: true,
    comment: 'Fin del rango de datos importados, si la fuente maneja rangos',
  })
  dataEndDate: Date;

  /**
   * Lo propio de cada fuente, que no justifica una columna: versión e idioma de
   * MedDRA, SHA-256 de la descarga de WHODrug, ruta y conteo de filas del
   * datamart. Es lo que permite retirar MED_SYNC y DRUG_SYNC sin perder la
   * lógica que dependía de esos campos.
   */
  @Column({
    name: 'METADATA',
    type: 'jsonb',
    nullable: true,
    comment: 'Datos específicos de la fuente (versión, sha256, conteos, ...)',
  })
  metadata?: Record<string, any>;
}
