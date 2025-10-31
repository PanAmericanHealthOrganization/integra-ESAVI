import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateParametroDto } from '../dto/create-parametro.dto';
import { UpdateParametroDto } from '../dto/update-parametro.dto';
import { ParametroService } from '../service/parametro.service';

@ApiTags('Integrador')
@Controller({ path: 'integrator/parametros', version: '1' })
export class ParametroController {
  constructor(private parametroService: ParametroService) {}

  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll() {
    return this.parametroService.findAll();
  }

  //BUSCA UN ITEM ESPECIFICO POR ID
  @Get(':uuid')
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  findOne(@Param('uuid') uuid: string) {
    return this.parametroService.findOne(uuid);
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
  create(@Body() body: CreateParametroDto) {
    return this.parametroService.create(body);
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
  update(@Param('uuid', new ParseUUIDPipe()) uuid: string, @Body() body: UpdateParametroDto) {
    return this.parametroService.update(uuid, body);
  }
}
