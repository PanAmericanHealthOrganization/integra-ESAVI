import {Column,Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn} from 'typeorm';
import {TipoRegistroEsaviEnum} from '../enum/tipo-registro-esavi.enum';
import {Auditoria} from './auditoria.entity';
import {Notificacion} from './notificacion.entity';

@Entity({ schema: 'DHI_ESAVI', name: 'TR_DATOS_ESAVI', comment: 'Tabla de datos del ESAVI' })
export class DatoEsavi extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador PK de la tabla TR_DATOS_ESAVI' })
  id: string;
  /**
   *
   */
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;
  /**
   *
   */
  @Column({
    name: 'SISTEMA_DE_CODIFICACION',
    default: 'MedDRA',
    nullable: true,
    comment: 'Sistema de codificación utilizado para el ESAVI (ej: MedDRA, CIE-10)',
  })
  sistemaCodififacion: string;
  /**
   *
   */
  @Column({
    name: 'NOMBRE_ESAVI',
    nullable: true,
    comment:
      'Término ESTANDARIZADO del evento, homologado contra el diccionario indicado en SISTEMA_DE_CODIFICACION (LLT MedDRA). Es el valor apto para agregación y análisis. Queda null cuando el evento no pudo homologarse; en ese caso solo existe NOMBRE_ESAVI_REPORTADO.',
  })
  nombre: string;
  /**
   * Reemplaza al antiguo campo DESCRIPCION. Ese campo nunca almacenó la narrativa del caso
   * —que existe una sola vez por caso en TR_NOTIFICACION.CASO_NARRATIVO— sino una etiqueta
   * del bloque de la ficha que originó la fila ("Diagnóstico inicial DHIS2 1" y similares).
   */
  @Column({
    name: 'TIPO_REGISTRO_ESAVI',
    type: 'enum',
    enum: TipoRegistroEsaviEnum,
    nullable: true,
    comment:
      'Bloque de la ficha del que proviene el evento: DIAGNOSTICO_INICIAL, DIAGNOSTICO_FINAL, SINTOMATOLOGIA (DHIS2) o REACCION (VigiFlow). No es una descripción narrativa.',
  })
  tipoRegistro: TipoRegistroEsaviEnum;
  /**
   *
   */
  @Column({
    name: 'NOMBRE_ESAVI_REPORTADO',
    nullable: true,
    comment:
      'Texto ORIGINAL del evento tal como lo escribió quien notifica, sin homologar. Se conserva siempre como respaldo trazable de NOMBRE_ESAVI.',
  })
  nombreReportado: string;

  /**
   *
   */
  @Column({
    name: 'CODIGO_ESAVI_CIE10',
    nullable: true,
    comment: 'Código del ESAVI según clasificación CIE-10, mapeado a partir del LLT MedDRA',
  })
  codigoEsaviCie10: string;

  /**
   *
   */
  @Column({
    name: 'CODIGO_ESAVI_MEDDRA_LLT',
    nullable: true,
    comment: 'Código LLT MedDRA',
  })
  codigoLLT: string;

  /**
   *
   */
  @Column({
    name: 'FECHA_ESAVI',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha de inicio del evento supuestamente atribuido a la vacunación',
  })
  fechaEsavi: Date;

  /**
   *
   */
  @Column({
    name: 'FECHA_FINALIZACION',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha de finalización o resolución del ESAVI',
  })
  fechaFinalizacion: Date;

  /**
   *
   */
  @Column({
    name: 'DURACION_EVENTO',
    nullable: true,
    comment: 'Duración del evento adverso',
  })
  duracion: string;

  // RESULTADO_EVENTO se eliminó de esta tabla por estar repetida: el estado final del evento
  // queda únicamente en TR_DESENLACE_ESAVI.RESULTADO_EVENTO, ya homologado a códigos 0..5.

  // COGIDO_CASO se eliminó: era una copia literal del código de la notificación
  // (TR_NOTIFICACION.CODIGO_ORIGEN_NOTIFICACION) repetida en cada evento del caso. La
  // correspondencia 1 caso → N eventos ya la garantiza la FK NOTIFICACION_ID.

  // GRAVEDAD se eliminó: la gravedad corresponde al caso, no a cada evento, y se evalúa en
  // TR_GRAVEDAD_ESAVI (una fila por notificación). La columna además nunca se pobló.
}
