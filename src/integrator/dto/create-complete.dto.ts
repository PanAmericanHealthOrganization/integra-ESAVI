import { SourceEnum } from '../enum/source-enum';
import { ApiProperty } from '@nestjs/swagger';
import { CreatePacienteDto } from './create-paciente.dto';
import { CreateMedicamentoDto } from './create-medicamento.dto';
import { CreateAntecedenteEmbarazoDto } from './create-antecedente-embarazo.dto';
import { CreateAntecedenteEventoDto } from './create-antecedente-evento.dto';
import { CreateAntecedenteMedicoDto } from './create-antecedente-medico.dto';
import { CreateAntecedentePreexistenciaDto } from './create-antecedente-preexistencia.dto';
import { CreateDesenlaceEsaviDto } from './create-desenlace-esavi.dto';
import { CreateEmbarazoEsaviDto } from './create-embarazo-esavi.dto';
import { CreateGravedadEsaviDto } from './create-gravedad-esavi.dto';
import { CreateNotificacionDto } from './create-notificacion.dto';
import { CreateCausalidadEsaviDto } from './create-causalidad-esavi.dto';
import { CreateDatoVacunaDto } from './create-dato-vacuna.dto';
import { CreateDatoVacunacionDto } from './create-dato-vacunacion.dto';
import { CreatePacienteVigiflowDto } from './create-paciente-vigiflow.dto';
import { CreatePacienteDhis2Dto } from './create-paciente-dhis2.dto';
import { CreatePacienteEmbarazadaDto } from './create-paciente-embarazada.dto';
import { CreateDatoEsaviDto } from './create-dato-esavi.dto';

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
  pacienteEmbarazada : CreatePacienteEmbarazadaDto;
  //
  datoVacuna: CreateDatoVacunaDto | CreateDatoVacunaDto[];
  datoEsavi : CreateDatoEsaviDto | CreateDatoEsaviDto[];
  // datoEsavi : CreateDatoEsaviDto ;


  datoVacunacion: CreateDatoVacunacionDto ;
  createdBy: string;
}
