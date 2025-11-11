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
import { CustomBaseEntity } from 'src/utils/interfaces/baseEntity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DatoEsavi } from './dato-esavi.entity';

/**
 *
 */
@Entity({
  schema: 'dhi_esavi',
  name: 'TR_INVESTIGACION',
  comment: 'Tabla que registr la investigación de los casos de ESAVI',
})
export class Investigacion extends CustomBaseEntity implements IInvestigacion {
  /**
   * Primary generated column of investigacion
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;
  /**
   *
   */
  @OneToOne(() => DatoEsavi)
  @JoinColumn({ name: 'DATOS_ESAVI_ID' })
  datoEsavi: DatoEsavi;

  /**
   *
   */
  @Column({
    name: 'FECHA_INVESTIGACION',
    nullable: true,
    comment:
      'Fecha en que se termina la investigación. Variable de la etapa de Clasificación Final en DHIS2',
  })
  fechaInvestigacion: Date;

  /**
   *
   */
  @Column({
    name: 'VACUNATORIO_CALIDAD',
    nullable: true,
    comment: 'El vacunatorio cumple con los estándares de calidad',
  })
  vacunatorioCalidad: boolean;

  /**
   *
   */
  @Column({
    name: 'PERSONAL_CAPACITADO',
    nullable: true,
    comment: 'El personal de salud está capacitado en inmunizaciones',
  })
  personalCapacitado: boolean;

  /**
   *
   */
  @Column({
    name: 'PROBLEMA_BIOLOGICO',
    nullable: true,
    comment: 'Evidenció algún problema en el biológico',
  })
  problemaBiologico: boolean;

  /**
   *
   */
  @Column({
    name: 'BUSQUEDA_CASOS_SINTOMATOLOGIA_CON_VACUNA',
    nullable: true,
    comment: 'Se realizó búsqueda de casos con similar sintomatología y que recibió la vacuna',
  })
  busquedaCasosSintomatologiaConVacuna: number;

  /**
   *
   */
  @Column({
    name: 'BUSQUEDA_CASOS_SINTOMATOLOGIA_SIN_VACUNA',
    nullable: true,
    comment: 'Se realizó búsqueda de casos con similar sintomatología sin antecedente de la vacuna',
  })
  busquedaCasosSintomatologiaSinVacuna: number;

  /**
   *
   */
  @Column({
    name: 'MUESTRA_LABORATORIO',
    nullable: true,
    comment: 'Muestra de Laboratorio',
  })
  muestraLaboratorio: boolean;

  /*@BeforeInsert()
    beforeInsert() {
    this.createdAt = moment().toDate();
    }*/
}

export interface IInvestigacion extends CustomBaseEntity {
  id: string;
  fechaInvestigacion: Date;
  vacunatorioCalidad: boolean;
  personalCapacitado: boolean;
  problemaBiologico: boolean;
  busquedaCasosSintomatologiaConVacuna: number;
  busquedaCasosSintomatologiaSinVacuna: number;
  muestraLaboratorio: boolean;
}

export class InvestigacionDto extends CustomBaseEntity implements IInvestigacion {
  @ApiProperty()
  id: string;

  @ApiProperty()
  datoEsavi: DatoEsavi;

  @ApiProperty()
  fechaInvestigacion: Date;

  @ApiProperty()
  vacunatorioCalidad: boolean;

  @ApiProperty()
  personalCapacitado: boolean;

  @ApiProperty()
  problemaBiologico: boolean;

  @ApiProperty()
  busquedaCasosSintomatologiaConVacuna: number;

  @ApiProperty()
  busquedaCasosSintomatologiaSinVacuna: number;

  @ApiProperty()
  muestraLaboratorio: boolean;
}

/**
 *
 *
 * */
export class InvestigacionCreateDto extends OmitType(InvestigacionDto, [
  'id',
  //Se deben omitir los campos de CustomBaseEntity, que son implementados desde "IBaseEntity" que no se envían al crear
  'enabled',
  'state',
  'action',
  'createdAt',  
  'updatedAt',
  'actionBy',
  
] as const) {}
/**
 *
 *
 */
export class InvestigacionUpdateDto extends OmitType(InvestigacionDto, [
  'id',
  //Se deben omitir los campos de CustomBaseEntity, que son implementados desde "IBaseEntity" que no se envían al actualizar
  'enabled',
  'state',
  'action',
  'createdAt',
  'updatedAt',
  'actionBy',
] as const) {}

