
import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Put,
    Req,
    UseFilters,
    UseGuards,
  } from '@nestjs/common';
  import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
  import { HttpExceptionFilter } from '../../providers/http-exception.filter';
  import { AuthGuard } from '@nestjs/passport';
import { PacienteEmbarazadaServive } from '../service/paciente-embarazada.service';




@ApiTags('Paciente')
@Controller('integrator/paciente/embarazada')
@ApiSecurity('X-API-KEY', ['X-API-KEY'])
@UseGuards(AuthGuard('api-key'))
@UseFilters(new HttpExceptionFilter())
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 403, description: 'Forbidden.' })
export class PacienteEmbarazadaController {

    constructor(
        private pacienteEmbarazadaService: PacienteEmbarazadaServive,
      ) {}

       /************CRUD PARA MICROSERVICIOS************/
        //BUSCAR TODOS LOS ITEMS
}