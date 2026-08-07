import {Column,Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn} from 'typeorm';
import {Auditoria} from './auditoria.entity';
import {CatalogoPadre} from './catalogo-padre.entity';

/**
 *
 */
@Entity({
  schema: 'DHI_ESAVI',
  name: 'TR_PACIENTE',
  comment: 'Tabla de pacientes',
})
export class Paciente extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador único PK de la tabla TR_PACIENTE' })
  id: string;

  /**
   *
   */
  @Column({
    name: 'NOMBRE',
    nullable: true,
    comment: 'Nombre completo del paciente. Disponible en DHIS2.',
  })
  nombre: string;

    /**
   *
   */
  @Column({
    name: 'APELLIDOS',
    nullable: true,
    comment: 'Apellidos del paciente.',
  })
  apellidos: string;
  /**
   *
   */
  @Column({
    name: 'INICIALES_NOMBRE',
    nullable: true,
    comment: 'Iniciales del nombre del paciente. Disponible en VigiFlow.',
  })
  inicialesNombre: string;

  /**
   *
   */
  @Column({
    name: 'IDENTIFICACION',
    nullable: true,
    comment: 'Número de identificación del paciente',
  })
  identificacion: string;

  /**
   *
   */
  @ManyToOne(() => CatalogoPadre)
  @JoinColumn({ name: 'CT_SEXO_ID' })
  sexo: CatalogoPadre;


  @ManyToOne(() => CatalogoPadre)
  @JoinColumn({ name: 'CT_AUTO_IDENTIFICACION_ETNICA_ID' })
  autoIdentificacion: CatalogoPadre;

  @Column({
    name: 'FECHA_NACIMIENTO',
    type: 'date',
    nullable: true,
    comment: 'Fecha de nacimiento del paciente',
  })
  fechaNacimiento: Date;

  /** */
  @Column({
    name: 'REGISTRO_SINCRONIZADO',
    default: false,
    nullable: true,
    comment: 'Indica si el registro ha sido sincronizado con sistemas externos',
  })
  registroSincronizado: boolean;

  @Column(
    {
      name: 'FECHA_SINCRONIZACION',
      nullable: true,
    }
  )
  fechaSincronizacion: Date;

  @Column({
    name: 'CODIGO_ORIGEN',
    nullable: true,
    unique: true,
    comment: 'Código único del registro en el sistema origen (VigiFlow o DHIS2)',
  })
  codigoOrigen: string;

  /**
   * Antes se llamaba ORIGEN_ORIGINAL, nombre que sugería identificar la fuente de datos —eso
   * ya lo hacen TR_NOTIFICACION.ORIGEN y CODIGO_ORIGEN. Lo que guarda en realidad es el
   * payload crudo del registro tal como llegó, para poder auditar la transformación.
   */
  @Column({
    name: 'PAYLOAD_ORIGEN',
    type: 'jsonb',
    nullable: true,
    comment:
      'Snapshot del registro crudo del paciente tal como lo entregó la fuente, antes de transformarlo. Sirve para auditar la trazabilidad del dato, no para identificar el origen (para eso está TR_NOTIFICACION.ORIGEN).',
  })
  payloadOrigen: Record<string, any>;

}
