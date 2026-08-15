/**
 * Una notificación asíncrona dirigida a un usuario.
 *
 * No es una entidad: vive como elemento de un array JSON dentro de
 * `DHI_ESAVI.TR_MENSAJES.NOTIFICACIONES`. Por eso las fechas viajan como ISO-8601 en
 * texto —jsonb no tiene tipo fecha— y el `id` se genera en la aplicación.
 */
export interface INotificacion {
  /** uuid generado al crear la notificación; identifica el elemento dentro del array. */
  id: string;

  /** Familia de la notificación. Hoy sólo hay procesos de sincronización. */
  tipo: TipoNotificacion;

  /** Desenlace, para que la interfaz elija el color sin interpretar el texto. */
  nivel: NivelNotificacion;

  /** Título corto: lo que se lee en la lista de la campana. */
  titulo: string;

  /** Detalle. Para una sincronización, el mensaje o el error que registró la corrida. */
  mensaje: string;

  /** Fuente de TR_SYNC_PROCESS que la originó (MEDDRA, WHODRUG, …). */
  source?: string;

  /** Corrida que la originó, para poder enlazarla con el historial de sincronizaciones. */
  syncId?: string;

  /** ISO-8601. */
  fecha: string;

  leida: boolean;
}

export enum TipoNotificacion {
  SINCRONIZACION = 'SINCRONIZACION',
}

export enum NivelNotificacion {
  EXITO = 'EXITO',
  ERROR = 'ERROR',
  INFO = 'INFO',
}

/** Lo que hay que aportar para crear una notificación; el resto lo pone el servicio. */
export type NuevaNotificacion = Omit<INotificacion, 'id' | 'fecha' | 'leida'>;

/** Destinatario. El id es el `sub` del token de Keycloak. */
export interface DestinatarioNotificacion {
  id: string;
  username?: string;
}

/** Evento que el gateway emite por WebSocket al crearse una notificación. */
export const EVENTO_NOTIFICACION = 'notificacion';
