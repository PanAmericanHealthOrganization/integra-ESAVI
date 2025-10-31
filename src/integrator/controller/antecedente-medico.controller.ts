import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseFilters } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../../providers/http-exception.filter';
import { UpdateAntecedenteMedicoDto } from '../dto/update-antecedente-medico.dto';
import { AntecedenteMedicoService } from '../service/antecedente-medico.service';

@ApiTags('Antecedente Medico')
@Controller({ path: 'integrator/antecedente-medico', version: '1' })
@UseFilters(new HttpExceptionFilter())
export class AntecedenteMedicoController {
  constructor(private antecedenteMedicoService: AntecedenteMedicoService) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll() {
    return this.antecedenteMedicoService.findAll();
  }

  //BUSCA UN ITEM ESPECIFICO POR ID
  @Get(':uuid')
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  findOne(@Param('uuid') uuid: string) {
    return this.antecedenteMedicoService.findOne(uuid);
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
    @Body() body: UpdateAntecedenteMedicoDto,
  ) {
    return this.antecedenteMedicoService.update(uuid, body);
  }
}
