import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { KeycloakTokenUtils } from 'src/common/utils/keycloak-token.utils';
import { EVENTO_NOTIFICACION, INotificacion } from '../models/notificacion.interface';

/**
 * Canal por el que el servidor avisa al navegador de que un proceso largo terminó.
 *
 * Sólo emite: el cliente no manda nada por aquí. Las acciones (listar, marcar leídas,
 * borrar) van por HTTP contra `MensajesController`, que ya tiene guards y validación.
 *
 * Cada conexión se mete en una sala con el `sub` de Keycloak del usuario, de modo que
 * `emitir()` alcanza todas las pestañas de esa persona y sólo las suyas. Sin la sala
 * habría que difundir a todo el mundo y filtrar en el cliente, lo que equivale a
 * mandarle a cada usuario las notificaciones de los demás.
 *
 * El origen permitido se lee de CORS_ORIGINS, la misma variable que usa el HTTP en
 * `main.ts`: socket.io no hereda la configuración CORS de la aplicación Nest.
 */
@WebSocketGateway({
  namespace: '/notificaciones',
  cors: {
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
      : true,
    credentials: true,
  },
})
export class MensajesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MensajesGateway.name);

  @WebSocketServer()
  private server: Server;

  /**
   * Autentica el handshake y suscribe el socket a la sala de su usuario.
   *
   * Un socket sin token válido se desconecta en el acto: dejarlo conectado "sin sala"
   * sería un cliente que consume recursos y que un cambio futuro podría empezar a
   * atender por descuido.
   */
  async handleConnection(client: Socket): Promise<void> {
    const token = this.extraerToken(client);

    if (!token) {
      this.logger.warn(`Handshake sin token (${client.id}); se cierra la conexión`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = await KeycloakTokenUtils.verificar(token);
      const usuarioId = payload.sub;

      if (!usuarioId) {
        throw new Error('El token no trae claim `sub`');
      }

      client.data.usuarioId = usuarioId;
      await client.join(usuarioId);
      this.logger.log(`Conectado ${payload.preferred_username ?? usuarioId} (${client.id})`);
    } catch (error) {
      const motivo = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Handshake rechazado (${client.id}): ${motivo}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    if (client.data?.usuarioId) {
      this.logger.log(`Desconectado ${client.data.usuarioId} (${client.id})`);
    }
  }

  /**
   * Envía una notificación a todas las pestañas abiertas del usuario.
   *
   * No lanza: si el servidor de sockets todavía no está listo o nadie está conectado, la
   * notificación ya quedó guardada en TR_MENSAJES y el usuario la verá al abrir la
   * campana. El WebSocket es la vía rápida, no la fuente de verdad.
   */
  emitir(usuarioId: string, notificacion: INotificacion): void {
    if (!this.server) {
      this.logger.warn('Servidor de sockets no inicializado; la notificación queda persistida');
      return;
    }
    this.server.to(usuarioId).emit(EVENTO_NOTIFICACION, notificacion);
  }

  /**
   * El token puede venir por `auth.token` (lo natural en socket.io-client), por query
   * string o como cabecera Authorization, según cómo se conecte el cliente.
   */
  private extraerToken(client: Socket): string | null {
    const desdeAuth = client.handshake.auth?.token;
    if (typeof desdeAuth === 'string' && desdeAuth) {
      return desdeAuth.replace(/^Bearer\s+/i, '');
    }

    const desdeQuery = client.handshake.query?.token;
    if (typeof desdeQuery === 'string' && desdeQuery) {
      return desdeQuery.replace(/^Bearer\s+/i, '');
    }

    const cabecera = client.handshake.headers?.authorization;
    if (typeof cabecera === 'string' && cabecera.startsWith('Bearer ')) {
      return cabecera.slice(7);
    }

    return null;
  }
}
