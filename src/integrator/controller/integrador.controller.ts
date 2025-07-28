import { Body, Controller, Post, UseFilters, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../../providers/http-exception.filter';
import { CreateCompleteDto } from '../dto/create-complete.dto';
import { IntegradorService } from '../facade/integrador.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Integrador')
@Controller('integrator')
@ApiSecurity('X-API-KEY', ['X-API-KEY'])
@UseGuards(AuthGuard('api-key'))
@UseFilters(new HttpExceptionFilter())
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 403, description: 'Forbidden.' })
export class IntegradorController {
  constructor(private integradorService: IntegradorService) {}

  //INSERTAR DATOS
  @Post('/create')
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'The record has not been successfully created.',
  })
  create(@Body() body: CreateCompleteDto) {
    return this.integradorService.create(body);
  }
}
