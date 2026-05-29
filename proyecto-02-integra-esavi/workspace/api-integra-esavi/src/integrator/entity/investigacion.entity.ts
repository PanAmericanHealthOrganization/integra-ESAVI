/*
Esta nueva entidad también debe extender la clase Auditoría.
Nombre de la Entidad: TR_INVESTIGACION
Identificador único, y clave primaria: ID
Columnas:
Nombre: FECHA_INVESTIGACION; Comentario: Fecha en que se termina la investigación. Variable de la etapa de Clasificación Final en DHIS2; Nullable: true; tipo: Date
Nombre: VACUNATORIO_CALIDAD; Comentario: El vacunatorio cumple con los estándares de calidad; Nullable: true; tipo: boolean
Nombre: PERSONAL_CAPACITADO; Comentario: El personal de salud está capacitado en inmunizaciones; Nullable: true; tipo: boolean
Nombre: PROBLEMA_BIOLOGICO; Comentario: Evidenció algún problema en el biológico; Nullable: true; tipo: boolean
Nombre: BUSQUEDA_CASOS_SINTOMATOLOGIA_CON_VACUNA; Comentario: Se realizó búsqueda de casos con similar sintomatología y que recibió la vacuna; Nullable: true; tipo: number
Nombre: BUSQUEDA_CASOS_SINTOMATOLOGIA_SIN_VACUNA; Comentario: Se realizó búsqueda de casos con similar sintomatología sin antecedente de la vacuna; Nullable: true; tipo: number
Nombre: MUESTRA_LABORATORIO; Comentario: Muestra de Laboratorio; Nullable: true; tipo: boolean

*/
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria, IAuditoria } from './auditoria.entity';
import { DatoEsavi } from './dato-esavi.entity';
import { Notificacion } from './notificacion.entity';

/**
 *
 */
@Entity({
  schema: 'dhi_esavi',
  name: 'TR_INVESTIGACION',
  comment: 'Tabla que registr la investigación de los casos de ESAVI',
})
export class Investigacion extends Auditoria implements IInvestigacion {
  /**
   * Primary generated column of investigacion
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  /**
   *@OneToOne(() => DatoEsavi, { nullable: false })
   */
  @OneToOne(() => Notificacion) //DatoEsavi)
  @JoinColumn({ name: 'NOTIFICACION_ID' }) //'DATOS_ESAVI_ID' })
  notificacion: Notificacion; //datoEsavi: DatoEsavi;

  /**
   *
   */
  @Column({
    name: 'FECHA_INVESTIGACION',
    nullable: true,
    comment: 'Fecha en que se termina la investigación. Variable de la etapa de Clasificación Final en DHIS2',
  })
  fechaInvestigacion: Date | null;

  /**
   *
   */
  @Column({
    name: 'VACUNATORIO_CALIDAD',
    nullable: true,
    comment: 'El vacunatorio cumple con los estándares de calidad',
  })
  vacunatorioCalidad: string;//boolean;

  /**
   *
   */
  @Column({
    name: 'PERSONAL_CAPACITADO',
    nullable: true,
    comment: 'El personal de salud está capacitado en inmunizaciones',
  })
  personalCapacitado: string;//boolean;

  /**
   *
   */
  @Column({
    name: 'PROBLEMA_BIOLOGICO',
    nullable: true,
    comment: 'Evidenció algún problema en el biológico',
  })
  problemaBiologico: string;//boolean;

  /**
   *
   */
  @Column({
    name: 'BUSQUEDA_CASOS_SINTOMATOLOGIA_CON_VACUNA',
    nullable: true,
    comment: 'Se realizó búsqueda de casos con similar sintomatología y que recibió la vacuna',
  })
  busquedaCasosSintomatologiaConVacuna: string;//boolean;

  /**
   *
   */
  @Column({
    name: 'BUSQUEDA_CASOS_SINTOMATOLOGIA_SIN_VACUNA',
    nullable: true,
    comment: 'Se realizó búsqueda de casos con similar sintomatología sin antecedente de la vacuna',
  })
  busquedaCasosSintomatologiaSinVacuna: string;//boolean;

  /**
   *
   */
  @Column({
    name: 'MUESTRA_LABORATORIO',
    nullable: true,
    comment: 'Muestra de Laboratorio',
  })
  muestraLaboratorio: string;//boolean;

  /*@BeforeInsert()
    beforeInsert() {
    this.createdAt = moment().toDate();
    }*/
}

// TODO: Se recomienda crear cada clase e interfaz en un archivo separado (o eliminar las definiciones duplicadas en otros documentos), para evitar problemas de importación circular. Si se desea conservar este esquema se debe cambiar de nombre a las clases e interfaces para evitar el conflicto de nombres (En esta versión de NestJS, se considera como warning, en las siguientes ya será error).
export interface IInvestigacion extends IAuditoria {
  id: string;
  notificacion: Notificacion; //Para habilitar este campo, se recomienda crear cada clase e interfaz en un archivo separado, para evitar problemas de importación circular. Si se desea conservar este esquema se debe cambiar de nombre a las clases e interfaces para evitar el conflicto de nombres (En esta versión de NestJS, se considera como warning, en las siguientes ya será error).
  fechaInvestigacion: Date | null;
  vacunatorioCalidad: string;//boolean;
  personalCapacitado: string;//boolean;
  problemaBiologico: string;//boolean;
  busquedaCasosSintomatologiaConVacuna: string;//boolean;
  busquedaCasosSintomatologiaSinVacuna: string;//boolean;
  muestraLaboratorio: string;//boolean;string;//
}

export class InvestigacionDto extends Auditoria implements IInvestigacion {
  @ApiProperty()
  id: string;

  @ApiProperty()
  notificacion: Notificacion; //datoEsavi: DatoEsavi;

  @ApiProperty()
  fechaInvestigacion: Date | null;

  @ApiProperty()
  vacunatorioCalidad: string;//boolean;

  @ApiProperty()
  personalCapacitado: string;//boolean;

  @ApiProperty()
  problemaBiologico: string;//boolean;

  @ApiProperty()
  busquedaCasosSintomatologiaConVacuna: string;//boolean;

  @ApiProperty()
  busquedaCasosSintomatologiaSinVacuna: string;//boolean;

  @ApiProperty()
  muestraLaboratorio: string;//boolean;
}

/**
 *
 *
 * */
export class InvestigacionCreateDto extends OmitType(InvestigacionDto, [
  'id',
  //Se deben omitir los campos de CustomBaseEntity, que son implementados desde "IBaseEntity" que no se envían al crear
  'isEnabled',
  'isActive',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'deletedAt',
  'deletedBy',
] as const) {}
/**
 *
 *
 */
export class InvestigacionUpdateDto extends OmitType(InvestigacionDto, [
  'id',
  //Se deben omitir los campos de CustomBaseEntity, que son implementados desde "IBaseEntity" que no se envían al actualizar
  'isEnabled',
  'isActive',
  'createdBy',
  'createdAt',
  'updatedAt',
  'updatedBy',
] as const) {}
