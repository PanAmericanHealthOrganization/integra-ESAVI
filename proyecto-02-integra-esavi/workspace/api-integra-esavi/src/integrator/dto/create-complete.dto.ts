import { SourceEnum } from '../enum/source-enum';
import { ApiProperty } from '@nestjs/swagger';
import { CreateMedicamentoDto } from './medicamento.dto';
import { CreateAntecedenteEmbarazoDto } from './antecedente-embarazo.dto';
import { CreateAntecedenteEventoDto } from './antecedente-evento.dto';
import { CreateAntecedenteMedicoDto } from './antecedente-medico.dto';
import { CreateAntecedentePreexistenciaDto } from './antecedente-preexistencia.dto';
import { CreateDesenlaceEsaviDto } from './desenlace-esavi.dto';
import { CreateEmbarazoEsaviDto } from './embarazo-esavi.dto';
import { CreateGravedadEsaviDto } from './gravedad-esavi.dto';
import { CreateNotificacionDto } from './notificacion.dto';
import { CreateCausalidadEsaviDto } from './causalidad-esavi.dto';
import { CreateDatoVacunaDto } from './dato-vacuna.dto';
import { CreateDatoVacunacionDto } from './dato-vacunacion.dto';
import { CreatePacienteVigiflowDto } from './create-paciente-vigiflow.dto';
import { CreatePacienteDhis2Dto } from './create-paciente-dhis2.dto';
import { CreateDatoEsaviDto } from './dato-esavi.dto';
//import { InvestigacionDto } from './investigacion.dto';
import { InvestigacionCreateDto } from '../entity/investigacion.entity';

export class CreateCompleteDto {
  @ApiProperty({
    enum: SourceEnum,
    enumName: 'SourceEnum',
    default: SourceEnum.DHIS2,
  })
  source: SourceEnum;
  notificacion: CreateNotificacionDto;
  pacienteVigiflow?: CreatePacienteVigiflowDto;
  pacienteDhis2?: CreatePacienteDhis2Dto;
  medicamento: CreateMedicamentoDto[];
  antecedenteEmbarazo: CreateAntecedenteEmbarazoDto;
  antecedenteEvento: CreateAntecedenteEventoDto;
  antecedenteMedico: CreateAntecedenteMedicoDto;
  antecedentePreexistencia: CreateAntecedentePreexistenciaDto;
  // -> ESAVI
  causalidadEsavi: CreateCausalidadEsaviDto;
  desenlaceEsavi: CreateDesenlaceEsaviDto;
  embarazoEsavi: CreateEmbarazoEsaviDto;
  gravedadEsavi: CreateGravedadEsaviDto;
  //
  datoVacuna: CreateDatoVacunaDto | CreateDatoVacunaDto[];
  datoEsavi : CreateDatoEsaviDto | CreateDatoEsaviDto[];
  // datoEsavi : CreateDatoEsaviDto ;


  datoVacunacion: CreateDatoVacunacionDto | CreateDatoVacunacionDto[];
  createdBy: string;

  //--> TR_INVESTIGACION
  investigacion: InvestigacionCreateDto;

}
