import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateDesenlaceEsaviDto } from '../dto/update-desenlace-esavi.dto';
import { DesenlaceEsaviService } from '../service/desenlace-esavi.service';

@ApiTags('Esavi')
@Controller({ path: 'integrator/esavi/desenlace', version: '1' })
export class DesenlaceEsaviController {
  constructor(private desenlaceEsaviService: DesenlaceEsaviService) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll() {
    return this.desenlaceEsaviService.findAll();
  }

  //BUSCA UN ITEM ESPECIFICO POR ID
  @Get(':uuid')
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  findOne(@Param('uuid') uuid: string) {
    return this.desenlaceEsaviService.findOne(uuid);
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
  update(@Param('uuid', new ParseUUIDPipe()) uuid: string, @Body() body: UpdateDesenlaceEsaviDto) {
    return this.desenlaceEsaviService.update(uuid, body);
  }
}
