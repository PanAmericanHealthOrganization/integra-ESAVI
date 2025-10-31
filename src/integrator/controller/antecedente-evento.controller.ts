import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateAntecedenteEventoDto } from '../dto/update-antecedente-evento.dto';
import { AntecedenteEventoService } from '../service/antecedente-evento.service';

@ApiTags('Antecedente Evento')
@Controller({ path: 'integrator/antecedente-evento', version: '1' })
export class AntecedenteEventoController {
  constructor(private antecedenteEventoService: AntecedenteEventoService) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll() {
    return this.antecedenteEventoService.findAll();
  }

  //BUSCA UN ITEM ESPECIFICO POR ID
  @Get(':uuid')
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  findOne(@Param('uuid') uuid: string) {
    return this.antecedenteEventoService.findOne(uuid);
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
  update(
    @Param('uuid', new ParseUUIDPipe()) uuid: string,
    @Body() body: UpdateAntecedenteEventoDto,
  ) {
    return this.antecedenteEventoService.update(uuid, body);
  }
}
