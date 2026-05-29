import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCompleteDto } from '../dto/create-complete.dto';
import { IntegradorService } from '../facade/integrador.service';

@ApiTags('Integrador')
@Controller({ path: 'integrator', version: '1' })
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
