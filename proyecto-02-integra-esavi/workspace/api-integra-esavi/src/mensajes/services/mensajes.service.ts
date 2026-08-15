import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { withAuditOnCreate, withAuditOnUpdate } from 'src/common/utils/audit.util';
import { DataSource, EntityManager } from 'typeorm';
import { Mensaje } from '../entity/mensaje.entity';
import { MensajesGateway } from '../gateway/mensajes.gateway';
import {
  DestinatarioNotificacion,
  INotificacion,
  NuevaNotificacion,
} from '../models/notificacion.interface';

/**
 * Buzón de notificaciones asíncronas.
 *
 * Guarda en `DHI_ESAVI.TR_MENSAJES` y, acto seguido, empuja la notificación por
 * WebSocket. El orden importa: primero se persiste y luego se emite, para que un usuario
 * que no esté conectado en ese instante no pierda el aviso.
 */
@Injectable()
export class MensajesService {
  /**
   * Tope de notificaciones por usuario. Al superarlo se descartan las más antiguas
   * (FIFO). Sin tope, el jsonb crecería sin límite y cada escritura tendría que
   * reescribir un documento cada vez mayor, porque Postgres no actualiza un jsonb en
   * sitio: reescribe la fila entera.
   */
  public static readonly MAX_NOTIFICACIONES = 100;

  private readonly logger = new Logger(MensajesService.name);

  constructor(
    @InjectDataSource('POSTGRES_INTEGRATOR_DS')
    private readonly dataSource: DataSource,
    private readonly gateway: MensajesGateway,
  ) {}

  /**
   * Añade una notificación al buzón del usuario y la emite.
   *
   * Toda la lectura-modificación-escritura del array va dentro de una transacción con
   * bloqueo pesimista sobre la fila. Sin él, dos sincronizaciones que terminan a la vez
   * leen el mismo array, cada una le añade lo suyo y la última en guardar pisa a la
   * otra: la notificación de la primera desaparece sin rastro.
   *
   * @returns la notificación ya creada, con su id y su fecha.
   */
  async agregar(
    destinatario: DestinatarioNotificacion,
    nueva: NuevaNotificacion,
  ): Promise<INotificacion | null> {
    if (!destinatario?.id) {
      // Un proceso disparado por el planificador o por un script no tiene destinatario.
      // No es un error: simplemente no hay a quién avisar.
      this.logger.debug('Notificación sin destinatario; no se persiste');
      return null;
    }

    const notificacion: INotificacion = {
      ...nueva,
      id: randomUUID(),
      fecha: new Date().toISOString(),
      leida: false,
    };

    try {
      await this.dataSource.transaction(async (manager) => {
        const buzon = await this.obtenerBuzonBloqueado(manager, destinatario);

        // Se añade al final y se conservan las MAX más recientes: `slice(-MAX)` deja
        // fuera las del principio, que son las más antiguas.
        const actualizadas = [...(buzon.notificaciones ?? []), notificacion];
        buzon.notificaciones = actualizadas.slice(-MensajesService.MAX_NOTIFICACIONES);
        buzon.username = destinatario.username ?? buzon.username;

        await manager.save(Mensaje, withAuditOnUpdate(buzon));
      });
    } catch (error) {
      // Que falle el buzón no puede tumbar el proceso que lo originó: la sincronización
      // ya terminó y su resultado está en TR_SYNC_PROCESS.
      this.logger.error(
        `No se pudo guardar la notificación de ${destinatario.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }

    this.gateway.emitir(destinatario.id, notificacion);
    return notificacion;
  }

  /** Notificaciones del usuario, de la más reciente a la más antigua. */
  async listar(usuarioId: string): Promise<{ notificaciones: INotificacion[]; noLeidas: number }> {
    const buzon = await this.dataSource.getRepository(Mensaje).findOne({ where: { usuarioId } });
    const notificaciones = [...(buzon?.notificaciones ?? [])].reverse();
    return {
      notificaciones,
      noLeidas: notificaciones.filter((n) => !n.leida).length,
    };
  }

  /**
   * Marca como leídas las notificaciones indicadas, o todas si no se indica ninguna.
   *
   * @returns cuántas cambiaron de estado.
   */
  async marcarLeidas(usuarioId: string, ids?: string[]): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const buzon = await this.obtenerBuzonBloqueado(manager, { id: usuarioId });
      const objetivo = ids?.length ? new Set(ids) : null;

      let cambiadas = 0;
      buzon.notificaciones = (buzon.notificaciones ?? []).map((n) => {
        if (n.leida || (objetivo && !objetivo.has(n.id))) return n;
        cambiadas++;
        return { ...n, leida: true };
      });

      if (cambiadas > 0) {
        await manager.save(Mensaje, withAuditOnUpdate(buzon));
      }
      return cambiadas;
    });
  }

  /** Elimina una notificación del buzón. @returns `true` si existía. */
  async eliminar(usuarioId: string, notificacionId: string): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const buzon = await this.obtenerBuzonBloqueado(manager, { id: usuarioId });
      const restantes = (buzon.notificaciones ?? []).filter((n) => n.id !== notificacionId);

      if (restantes.length === (buzon.notificaciones ?? []).length) return false;

      buzon.notificaciones = restantes;
      await manager.save(Mensaje, withAuditOnUpdate(buzon));
      return true;
    });
  }

  /** Vacía el buzón. */
  async limpiar(usuarioId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const buzon = await this.obtenerBuzonBloqueado(manager, { id: usuarioId });
      buzon.notificaciones = [];
      await manager.save(Mensaje, withAuditOnUpdate(buzon));
    });
  }

  /**
   * Devuelve el buzón del usuario con la fila bloqueada para escritura, creándolo si es
   * la primera vez que se le notifica algo.
   *
   * La creación va por `ON CONFLICT DO NOTHING` (`orIgnore`) contra el índice único de
   * USUARIO_ID, en lugar de un `findOne` seguido de un `insert`: entre esas dos
   * sentencias cabe otra transacción creando la misma fila, y el insert reventaría por
   * clave duplicada.
   */
  private async obtenerBuzonBloqueado(
    manager: EntityManager,
    destinatario: DestinatarioNotificacion,
  ): Promise<Mensaje> {
    await manager
      .createQueryBuilder()
      .insert()
      .into(Mensaje)
      .values(
        withAuditOnCreate({
          usuarioId: destinatario.id,
          username: destinatario.username ?? null,
          notificaciones: [],
        }) as Partial<Mensaje>,
      )
      .orIgnore()
      .execute();

    return manager.findOne(Mensaje, {
      where: { usuarioId: destinatario.id },
      lock: { mode: 'pessimistic_write' },
    });
  }
}
