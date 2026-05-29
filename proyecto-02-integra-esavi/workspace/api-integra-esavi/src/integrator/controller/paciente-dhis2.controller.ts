import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePacienteDhis2Dto } from '../dto/create-paciente-dhis2.dto';
import { UpdatePacienteDto } from '../dto/update-paciente.dto';
import { PacienteDhis2Service } from '../service/paciente-dhis2.service';

@ApiTags('Paciente')
@Controller({ path: 'integrator/paciente/dhis2', version: '1' })
export class PacienteDhis2Controller {
  constructor(private pacienteDhis2Service: PacienteDhis2Service) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll() {
    return this.pacienteDhis2Service.findAll();
  }

  //BUSCA UN ITEM ESPECIFICO POR ID
  @Get(':uuid')
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  findOne(@Param('uuid') uuid: string) {
    return this.pacienteDhis2Service.findOne(uuid);
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
  create(@Body() body: CreatePacienteDhis2Dto) {
    return this.pacienteDhis2Service.create(body);
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
    return this.pacienteDhis2Service.update(uuid, body);
  }
}
