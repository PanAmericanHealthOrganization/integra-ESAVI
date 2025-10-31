import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateDatoEsaviDto } from '../dto/update-dato-esavi.dto';
import { DatoEsaviService } from '../service/dato-esavi.service';

@ApiTags('Esavi')
@Controller({ path: 'integrator/esavi/dato', version: '1' })
export class DatoEsaviController {
  constructor(private datoEsaviService: DatoEsaviService) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll() {
    return this.datoEsaviService.findAll();
  }

  //BUSCA UN ITEM ESPECIFICO POR ID
  @Get(':uuid')
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  findOne(@Param('uuid') uuid: string) {
    return this.datoEsaviService.findOne(uuid);
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
  update(@Param('uuid', new ParseUUIDPipe()) uuid: string, @Body() body: UpdateDatoEsaviDto) {
    return this.datoEsaviService.update(uuid, body);
  }
}
