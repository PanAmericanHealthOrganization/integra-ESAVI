import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Mensaje } from 'src/mensajes/entity/mensaje.entity';
import { MensajesGateway } from 'src/mensajes/gateway/mensajes.gateway';
import {
  INotificacion,
  NivelNotificacion,
  NuevaNotificacion,
  TipoNotificacion,
} from 'src/mensajes/models/notificacion.interface';
import { MensajesService } from 'src/mensajes/services/mensajes.service';

/**
 * DataSource falso con los buzones en memoria.
 *
 * Reproduce lo justo de TypeORM que usa el servicio: `transaction`, el
 * `insert().orIgnore()` con el que se crea el buzón la primera vez, `findOne` con
 * bloqueo y `save`. Se guardan copias profundas para que el test falle si el servicio
 * muta el array que ya está "en la base" en lugar de guardar uno nuevo.
 */
class DataSourceFalso {
  public readonly buzones = new Map<string, Mensaje>();

  /** Cuántas veces se pidió la fila con bloqueo; sirve para comprobar el FOR UPDATE. */
  public bloqueos = 0;

  private clonar<T>(valor: T): T {
    return JSON.parse(JSON.stringify(valor));
  }

  private get manager() {
    const self = this;
    return {
      createQueryBuilder: () => ({
        insert: () => ({
          into: () => ({
            values: (valores: Partial<Mensaje>) => ({
              orIgnore: () => ({
                execute: async () => {
                  // ON CONFLICT DO NOTHING: sólo crea si no existe.
                  if (!self.buzones.has(valores.usuarioId)) {
                    self.buzones.set(valores.usuarioId, {
                      ...valores,
                      id: `buzon-${valores.usuarioId}`,
                      notificaciones: [],
                    } as Mensaje);
                  }
                },
              }),
            }),
          }),
        }),
      }),
      findOne: async (_entidad: unknown, opciones: any) => {
        if (opciones?.lock?.mode === 'pessimistic_write') self.bloqueos++;
        const buzon = self.buzones.get(opciones.where.usuarioId);
        return buzon ? self.clonar(buzon) : null;
      },
      save: async (_entidad: unknown, valor: Mensaje) => {
        self.buzones.set(valor.usuarioId, self.clonar(valor));
        return valor;
      },
    };
  }

  async transaction<T>(cb: (manager: any) => Promise<T>): Promise<T> {
    return cb(this.manager);
  }

  getRepository(_entidad: unknown) {
    const self = this;
    return {
      findOne: async (opciones: any) => {
        const buzon = self.buzones.get(opciones.where.usuarioId);
        return buzon ? self.clonar(buzon) : null;
      },
    };
  }
}

const USUARIO = { id: 'sub-123', username: 'rcasigna' };
const OTRO_USUARIO = { id: 'sub-999', username: 'otra.persona' };

const nuevaNotificacion = (titulo: string): NuevaNotificacion => ({
  tipo: TipoNotificacion.SINCRONIZACION,
  nivel: NivelNotificacion.EXITO,
  titulo,
  mensaje: `Detalle de ${titulo}`,
  source: 'MEDDRA',
  syncId: 'sync-1',
});

describe('MensajesService', () => {
  let service: MensajesService;
  let dataSource: DataSourceFalso;
  let gateway: { emitir: jest.Mock };

  beforeEach(async () => {
    dataSource = new DataSourceFalso();
    gateway = { emitir: jest.fn() };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        MensajesService,
        { provide: getDataSourceToken('POSTGRES_INTEGRATOR_DS'), useValue: dataSource },
        { provide: MensajesGateway, useValue: gateway },
      ],
    }).compile();

    service = modulo.get<MensajesService>(MensajesService);
  });

  const notificacionesDe = (usuarioId: string): INotificacion[] =>
    dataSource.buzones.get(usuarioId)?.notificaciones ?? [];

  describe('agregar', () => {
    it('crea el buzón la primera vez y guarda la notificación', async () => {
      const creada = await service.agregar(USUARIO, nuevaNotificacion('Primera'));

      expect(creada).not.toBeNull();
      expect(creada.id).toEqual(expect.any(String));
      expect(creada.leida).toBe(false);
      expect(new Date(creada.fecha).toString()).not.toBe('Invalid Date');

      const buzon = dataSource.buzones.get(USUARIO.id);
      expect(buzon.username).toBe('rcasigna');
      expect(buzon.notificaciones).toHaveLength(1);
      expect(buzon.notificaciones[0].titulo).toBe('Primera');
    });

    it('emite por WebSocket sólo después de persistir', async () => {
      const creada = await service.agregar(USUARIO, nuevaNotificacion('Con socket'));

      expect(gateway.emitir).toHaveBeenCalledTimes(1);
      expect(gateway.emitir).toHaveBeenCalledWith(USUARIO.id, creada);
      // Si emitiera antes de guardar, el usuario podría recargar y no encontrarla.
      expect(notificacionesDe(USUARIO.id)).toHaveLength(1);
    });

    it('toma la fila con bloqueo de escritura en cada inserción', async () => {
      await service.agregar(USUARIO, nuevaNotificacion('A'));
      await service.agregar(USUARIO, nuevaNotificacion('B'));

      expect(dataSource.bloqueos).toBe(2);
    });

    it('no persiste ni emite cuando no hay destinatario', async () => {
      const creada = await service.agregar({ id: '' }, nuevaNotificacion('Huérfana'));

      expect(creada).toBeNull();
      expect(dataSource.buzones.size).toBe(0);
      expect(gateway.emitir).not.toHaveBeenCalled();
    });

    it('mantiene el buzón de cada usuario separado', async () => {
      await service.agregar(USUARIO, nuevaNotificacion('Mía'));
      await service.agregar(OTRO_USUARIO, nuevaNotificacion('Suya'));

      expect(notificacionesDe(USUARIO.id).map((n) => n.titulo)).toEqual(['Mía']);
      expect(notificacionesDe(OTRO_USUARIO.id).map((n) => n.titulo)).toEqual(['Suya']);
    });

    it('devuelve null y no propaga el error si la escritura falla', async () => {
      jest.spyOn(dataSource, 'transaction').mockRejectedValueOnce(new Error('base caída'));

      await expect(service.agregar(USUARIO, nuevaNotificacion('X'))).resolves.toBeNull();
      // El proceso que la originó ya terminó: su resultado está en TR_SYNC_PROCESS y no
      // puede darse por fallido sólo porque el buzón no aceptó el aviso.
      expect(gateway.emitir).not.toHaveBeenCalled();
    });
  });

  describe('recorte FIFO', () => {
    it('conserva exactamente MAX_NOTIFICACIONES al superar el tope', async () => {
      const total = MensajesService.MAX_NOTIFICACIONES + 25;
      for (let i = 1; i <= total; i++) {
        await service.agregar(USUARIO, nuevaNotificacion(`n-${i}`));
      }

      expect(notificacionesDe(USUARIO.id)).toHaveLength(MensajesService.MAX_NOTIFICACIONES);
    });

    it('descarta las más antiguas y conserva las más recientes', async () => {
      const total = MensajesService.MAX_NOTIFICACIONES + 3;
      for (let i = 1; i <= total; i++) {
        await service.agregar(USUARIO, nuevaNotificacion(`n-${i}`));
      }

      const titulos = notificacionesDe(USUARIO.id).map((n) => n.titulo);

      // Se fueron n-1, n-2 y n-3; sobrevive desde n-4 hasta la última, en orden.
      expect(titulos[0]).toBe('n-4');
      expect(titulos[titulos.length - 1]).toBe(`n-${total}`);
      expect(titulos).not.toContain('n-1');
      expect(titulos).not.toContain('n-3');
    });

    it('no recorta mientras no se alcance el tope', async () => {
      for (let i = 1; i <= MensajesService.MAX_NOTIFICACIONES; i++) {
        await service.agregar(USUARIO, nuevaNotificacion(`n-${i}`));
      }

      const titulos = notificacionesDe(USUARIO.id).map((n) => n.titulo);
      expect(titulos).toHaveLength(MensajesService.MAX_NOTIFICACIONES);
      expect(titulos[0]).toBe('n-1');
    });

    it('el tope es 100', () => {
      expect(MensajesService.MAX_NOTIFICACIONES).toBe(100);
    });
  });

  describe('listar', () => {
    it('devuelve las notificaciones de la más reciente a la más antigua', async () => {
      await service.agregar(USUARIO, nuevaNotificacion('vieja'));
      await service.agregar(USUARIO, nuevaNotificacion('nueva'));

      const { notificaciones } = await service.listar(USUARIO.id);

      expect(notificaciones.map((n) => n.titulo)).toEqual(['nueva', 'vieja']);
    });

    it('cuenta las no leídas', async () => {
      await service.agregar(USUARIO, nuevaNotificacion('a'));
      await service.agregar(USUARIO, nuevaNotificacion('b'));
      const { id } = await service.agregar(USUARIO, nuevaNotificacion('c'));
      await service.marcarLeidas(USUARIO.id, [id]);

      const { noLeidas } = await service.listar(USUARIO.id);

      expect(noLeidas).toBe(2);
    });

    it('devuelve el buzón vacío para un usuario sin fila', async () => {
      await expect(service.listar('sub-inexistente')).resolves.toEqual({
        notificaciones: [],
        noLeidas: 0,
      });
    });
  });

  describe('marcarLeidas', () => {
    it('marca sólo las indicadas', async () => {
      const primera = await service.agregar(USUARIO, nuevaNotificacion('a'));
      await service.agregar(USUARIO, nuevaNotificacion('b'));

      const cambiadas = await service.marcarLeidas(USUARIO.id, [primera.id]);

      expect(cambiadas).toBe(1);
      const porTitulo = Object.fromEntries(
        notificacionesDe(USUARIO.id).map((n) => [n.titulo, n.leida]),
      );
      expect(porTitulo).toEqual({ a: true, b: false });
    });

    it('marca todas cuando no se pasan ids', async () => {
      await service.agregar(USUARIO, nuevaNotificacion('a'));
      await service.agregar(USUARIO, nuevaNotificacion('b'));

      const cambiadas = await service.marcarLeidas(USUARIO.id);

      expect(cambiadas).toBe(2);
      expect(notificacionesDe(USUARIO.id).every((n) => n.leida)).toBe(true);
    });

    it('no cuenta las que ya estaban leídas', async () => {
      await service.agregar(USUARIO, nuevaNotificacion('a'));
      await service.marcarLeidas(USUARIO.id);

      await expect(service.marcarLeidas(USUARIO.id)).resolves.toBe(0);
    });
  });

  describe('eliminar y limpiar', () => {
    it('elimina la notificación indicada', async () => {
      const primera = await service.agregar(USUARIO, nuevaNotificacion('a'));
      await service.agregar(USUARIO, nuevaNotificacion('b'));

      await expect(service.eliminar(USUARIO.id, primera.id)).resolves.toBe(true);
      expect(notificacionesDe(USUARIO.id).map((n) => n.titulo)).toEqual(['b']);
    });

    it('devuelve false si la notificación no existe', async () => {
      await service.agregar(USUARIO, nuevaNotificacion('a'));

      await expect(service.eliminar(USUARIO.id, 'no-existe')).resolves.toBe(false);
      expect(notificacionesDe(USUARIO.id)).toHaveLength(1);
    });

    it('vacía el buzón', async () => {
      await service.agregar(USUARIO, nuevaNotificacion('a'));
      await service.agregar(USUARIO, nuevaNotificacion('b'));

      await service.limpiar(USUARIO.id);

      expect(notificacionesDe(USUARIO.id)).toEqual([]);
    });
  });
});
