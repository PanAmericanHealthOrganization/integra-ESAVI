import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Notificacion } from './notificacion.entity';

@Entity({
  schema: 'DHI_ESAVI',
  name: 'TR_ESAVI_DURANTE_EMBARAZO',
  comment: 'Tabla de ESAVI durante el embarazo',
})
export class EmbarazoEsavi extends Auditoria {
  // Antes era @PrimaryColumn sin generación, lo que impedía insertar sin asignar el ID a mano
  // (la tabla nunca llegó a poblarse). Se alinea con el resto de entidades del integrador.
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador único PK de la tabla TR_ESAVI_DURANTE_EMBARAZO',
  })
  id: string;

  // Las columnas descriptivas son nullable porque VigiFlow solo aporta la edad gestacional
  // y las fechas derivadas; el resto del bloque de embarazo no viene en sus reportes.
  @Column({
    name: 'CODIGOEMBARAZODURANTEESAVI',
    length: 16,
    nullable: true,
    comment: 'Código del embarazo durante el ESAVI',
  })
  codigo: string;

  @Column({
    name: 'EDAD_GESTACIONAL',
    type: 'integer',
    nullable: true,
    comment:
      'Edad gestacional en semanas al momento de la exposición (si es un feto). Debe estar entre 1 y 43; fuera de ese rango se almacena null.',
  })
  edadGestacional: number;

  @Column({
    name: 'FECHAULTIMAMENSTRUACIONESAVI',
    nullable: true,
    comment:
      'Fecha de la última menstruación durante el ESAVI. Calculada: fecha del ESAVI (inicio de síntomas) − (EDAD_GESTACIONAL × 7 días)',
  })
  fechaUltimaMenstruacion: Date;
  @Column({
    name: 'FECHAPARTOESAVI',
    nullable: true,
    comment:
      'Fecha probable de parto relacionada con el ESAVI. Calculada: FECHAULTIMAMENSTRUACIONESAVI + (40 × 7 días)',
  })
  fechaParto: Date;

  @Column({
    name: 'CODIGOMONITOREOPOSTERIORVACUNAESAVI',
    length: 16,
    nullable: true,
    comment: 'Código de monitoreo posterior a la vacuna durante el ESAVI',
  })
  codigoMonitoreoPosterioVacuna: string;

  @Column({
    name: 'CODIGOTIPOCOMPLICACIONESAVI',
    length: 16,
    nullable: true,
    comment: 'Código del tipo de complicación durante el ESAVI',
  })
  codigoTipoComplicacion: string;

  @Column({
    name: 'NOMBRECOMPLICACIONEMBARAZOESAVI',
    length: 128,
    nullable: true,
    comment: 'Nombre de la complicación del embarazo durante el ESAVI',
  })
  nombreComplicacion: string;

  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  // Las propiedades se renombraron a camelCase; los nombres de columna no cambian.
  @Column({
    name: 'CODIGOMEDDRACOMPLICACIONEMBARAZOESAVI',
    length: 16,
    nullable: true,
    comment: 'Código MedDRA de la complicación del embarazo durante el ESAVI',
  })
  codigoMeddraComplicacion: string;

  @Column({
    name: 'OTROSCODIGOSCOMPLICACIONEMBARAZOESAVI',
    length: 16,
    nullable: true,
    comment: 'Otros códigos de complicación del embarazo durante el ESAVI',
  })
  otrosCodigosComplicacion: string;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
  }
}
