import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Paciente')
@Controller('integrator/paciente/embarazada')
export class PacienteEmbarazadaController {}
