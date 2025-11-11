import{ ApiProperty, OmitType } from'@nestjs/swagger';
import{ IInvestigacion } from '../entity/investigacion.entity';
import { CustomBaseEntity } from 'src/utils/interfaces/baseEntity';
import { DatoEsavi } from '../entity/dato-esavi.entity';
export class InvestigacionDto extends CustomBaseEntity implements IInvestigacion{
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
    fechaInvestigacion: Date;

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
    busquedaCasosSintomatologiaConVacuna: number;

    /**
     * Número de casos con sintomatología sin antecedente de vacuna
     * */
    @ApiProperty()
    busquedaCasosSintomatologiaSinVacuna: number;

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