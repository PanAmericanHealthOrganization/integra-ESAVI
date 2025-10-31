import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateAntecedentePreexistenciaDto } from '../dto/update-antecedente-preexistencia.dto';
import { AntecedentePreexistenciaService } from '../service/antecedente-preexistencia.service';

@ApiTags('Antecedente Pre-existencia')
@Controller({ path: 'integrator/antecedente-preexistencia', version: '1' })
export class AntecedentePreexistenciaController {
  constructor(private antecedentePreexistenciaService: AntecedentePreexistenciaService) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll() {
    return this.antecedentePreexistenciaService.findAll();
  }

  //BUSCA UN ITEM ESPECIFICO POR ID
  @Get(':uuid')
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  findOne(@Param('uuid') uuid: string) {
    return this.antecedentePreexistenciaService.findOne(uuid);
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
    @Body() body: UpdateAntecedentePreexistenciaDto,
  ) {
    return this.antecedentePreexistenciaService.update(uuid, body);
  }
}
