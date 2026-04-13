import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IInvestigacion } from '../entity/investigacion.entity';
import { DatoEsavi } from '../entity/dato-esavi.entity';
import { Auditoria } from '../entity';
/**
 *
 */
export class InvestigacionDto extends Auditoria implements IInvestigacion {
  /**
   * Identificador único de la investigación
   * */
  @ApiProperty()
  id: string;
  /**
   * Datos del ESAVI asociado a la investigación
   */
  @ApiProperty()
  datoEsavi: DatoEsavi;
  /**
   * Fecha en que se termina la investigación. Variable de la etapa de Clasificación Final en DHIS2
   * */
  @ApiProperty()
  fechaInvestigacion: Date | null;

  /**
   * El vacunatorio cumple con los estándares de calidad
   * */
  @ApiProperty()
  vacunatorioCalidad: boolean;

  /**
   * El personal de salud está capacitado en inmunizaciones
   * */
  @ApiProperty()
  personalCapacitado: boolean;

  /**
   * Evidenció algún problema en el biológico
   * */
  @ApiProperty()
  problemaBiologico: boolean;

  /**
   * Número de casos con sintomatología que recibieron vacuna
   * */
  @ApiProperty()
  busquedaCasosSintomatologiaConVacuna: boolean;

  /**
   * Número de casos con sintomatología sin antecedente de vacuna
   * */
  @ApiProperty()
  busquedaCasosSintomatologiaSinVacuna: boolean;

  /**
   * Muestra de Laboratorio
   * */
  @ApiProperty()
  muestraLaboratorio: boolean;
}

/**
 *
 *
 */
export class InvestigacionCreateDto extends OmitType(InvestigacionDto, ['id']) {}
export class InvestigacionUpdateDto extends OmitType(InvestigacionDto, ['id']) {}
