import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { INotificacion } from '../models/notificacion.interface';

/**
 * Buzón de notificaciones asíncronas de un usuario: **una fila por usuario**, no una
 * por notificación.
 *
 * Se llama TR_MENSAJES y no TR_NOTIFICACION porque `Notificacion` ya es la entidad del
 * dominio ESAVI (el reporte de un caso); confundirlas en el código sería fácil.
 *
 * El identificador del usuario es el `sub` del token de Keycloak, no una FK: en este
 * API no hay tabla de usuarios, la identidad la aporta el proveedor de identidad. La
 * fila se crea sola la primera vez que hay algo que notificarle.
 *
 * El array se recorta a las {@link MensajesService.MAX_NOTIFICACIONES} más recientes en
 * cada inserción, descartando las más antiguas (FIFO). El límite es lo que impide que
 * un jsonb crezca sin techo y que cada escritura tenga que reescribir un documento cada
 * vez más grande.
 */
@Entity({
  schema: 'DHI_ESAVI',
  name: 'TR_MENSAJES',
  comment: 'Buzón de notificaciones asíncronas por usuario',
})
export class Mensaje extends Auditoria {
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador único del buzón',
  })
  id: string;

  /**
   * `sub` del token de Keycloak. Único: el buzón es uno por usuario, y la restricción es
   * además lo que hace atómico el `ON CONFLICT DO NOTHING` con el que el servicio crea
   * la fila sin condición de carrera.
   */
  @Index({ unique: true })
  @Column({
    name: 'USUARIO_ID',
    length: 128,
    comment: 'Identificador del usuario en Keycloak (claim sub)',
  })
  usuarioId: string;

  /**
   * `preferred_username`. Se guarda sólo para poder leer la tabla sin cruzar con
   * Keycloak; no se usa para identificar, porque puede cambiar.
   */
  @Column({
    name: 'USERNAME',
    length: 128,
    nullable: true,
    comment: 'Nombre de usuario en Keycloak, para lectura humana',
  })
  username: string | null;

  /**
   * Array de notificaciones, de la más antigua a la más reciente. `jsonb` y no `json`:
   * se consulta y se compara, y jsonb además normaliza el documento al guardarlo.
   */
  @Column({
    name: 'NOTIFICACIONES',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
    comment: 'Array de notificaciones del usuario, máximo 100, FIFO',
  })
  notificaciones: INotificacion[];
}
