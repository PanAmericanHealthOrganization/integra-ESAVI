import {Column,Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn} from 'typeorm';
import {Auditoria} from './auditoria.entity';
import {Notificacion} from './notificacion.entity';

/**
 * 
 */
@Entity({
  schema: 'DHI_ESAVI',
  name: 'TR_MEDICAMENTO',
  comment: 'Tabla de medicamentos',
})
export class Medicamento extends Auditoria {
  
  /**
   * Primary generated column of medicamento
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador único PK de la tabla TR_MEDICAMENTO' })
  id: string;

  /**
   *
   */
  @Column({
    name: 'ROL_MEDICAMENTO',
    nullable: true,
    comment: 'Rol del medicamento en el evento (sospechoso, concomitante, etc.)',
  })
  rolMedicamento: string;

  /**
   *
   */
  @Column({
    name: 'CODIGO_ATC',
    nullable: true,
    comment: 'Código ATC (Anatomical Therapeutic Chemical) del medicamento',
  })
  codigoATC: string;

  /**
   *
   */
  @Column({
    name: 'SISTEMA_DE_CODIFICACION',
    nullable: true,
    default: 'WHODrug',
    comment: 'Sistema de codificación utilizado para el medicamento. Por defecto WHODrug.',
  })
  sistemaCodificacion: string;


  /**
   *
   */
  @Column({
    name: 'NOMBRE_MEDICAMENTO',
    nullable: true,
    comment: 'Nombre comercial del medicamento',
  })
  nombre: string;
  
  /**
   *
   */
  @Column({
    name: 'NOMBRE_MED_PATENTE_WHODRUG', //'NOMBRE_MEDICAMENTO_PATENTE_WHO_DRUG' //Variable nueva
    nullable: true,
    comment: 'Nombre del medicamento según la patente del estándar WHODrug. Aquí se registran todos los medicamentos, es decir, para todos los ATC, no solo para J07.',
  })
  nombreMedPatenteWHODrug: string; // utilizado por vf.



  /**
   *
   */
  @Column({
    name: 'NOMBRE_FORMA_FARMACEUTICA',
    nullable: true,
    length: 128,
    comment: 'Nombre de la forma farmacéutica (tableta, jarabe, etc.)',
  })
  nombreFormaFarmaceutica: string;


  /**
   *
   */
  @Column({
    name: 'NOMBRE_VIA_ADMINISTRACION',
    nullable: true,
    length: 64,
    comment: 'Nombre de la vía de administración (oral, intravenosa, etc.)',
  })
  nombreViaAdministracion: string;
  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;
}
