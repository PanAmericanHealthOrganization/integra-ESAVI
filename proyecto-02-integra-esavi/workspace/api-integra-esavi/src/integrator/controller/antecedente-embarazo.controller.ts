import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateAntecedenteEmbarazoDto } from '../dto/create-antecedente-embarazo.dto';
import { UpdateAntecedenteEmbarazoDto } from '../dto/update-antecedente-embarazo.dto';
import { AntecedenteEmbarazoService } from '../service/antecedente-embarazo.service';

@ApiTags('Antecedente Embarazo')
@Controller({ path: 'integrator/antecedente-embarazo', version: '1' })
export class AntecedenteEmbarazoController {
  constructor(private antecedenteEmbarazoService: AntecedenteEmbarazoService) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll() {
    return this.antecedenteEmbarazoService.findAll();
  }

  //BUSCA UN ITEM ESPECIFICO POR ID
  @Get(':uuid')
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  findOne(@Param('uuid') uuid: string) {
    return this.antecedenteEmbarazoService.findOne(uuid);
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
  create(@Body() body: CreateAntecedenteEmbarazoDto) {
    return this.antecedenteEmbarazoService.createWithNotificacionUUID(body);
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
    @Body() body: UpdateAntecedenteEmbarazoDto,
  ) {
    return this.antecedenteEmbarazoService.update(uuid, body);
  }
}
