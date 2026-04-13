import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePacienteVigiflowDto } from '../dto/create-paciente-vigiflow.dto';
import { UpdatePacienteDto } from '../dto/update-paciente.dto';
import { PacienteVigiflowService } from '../service/paciente-vigiflow.service';

@ApiTags('Paciente')
@Controller({ path: 'integrator/paciente/vigiflow', version: '1' })
export class PacienteVigiflowController {
  constructor(private pacienteVigiflowService: PacienteVigiflowService) {}

  //BUSCAR TODOS LOS ITEMS
  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll() {
    return this.pacienteVigiflowService.findAll();
  }

  //BUSCA UN ITEM ESPECIFICO POR ID
  @Get(':uuid')
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  findOne(@Param('uuid') uuid: string) {
    return this.pacienteVigiflowService.findOne(uuid);
  }

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
  create(@Body() body: CreatePacienteVigiflowDto) {
    return this.pacienteVigiflowService.create(body);
  }

  //ACTUALIZAR DATOS
  @Put(':uuid')
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully updated.',
  })
  @ApiResponse({
    status: 400,
    description: 'The record has not been successfully updated.',
  })
  update(@Param('uuid', new ParseUUIDPipe()) uuid: string, @Body() body: UpdatePacienteDto) {
    return this.pacienteVigiflowService.update(uuid, body);
  }
}
