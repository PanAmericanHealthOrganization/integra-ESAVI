import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../../providers/http-exception.filter';
import { AntecedenteMedicoService } from '../service/antecedente-medico.service';
import { CreateAntecedenteMedicoDto } from '../dto/create-antecedente-medico.dto';
import { UpdateAntecedenteMedicoDto } from '../dto/update-antecedente-medico.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Antecedente Medico')
@Controller('integrator/antecedente-medico')
@ApiSecurity('X-API-KEY', ['X-API-KEY'])
@UseGuards(AuthGuard('api-key'))
@UseFilters(new HttpExceptionFilter())
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 403, description: 'Forbidden.' })
export class AntecedenteMedicoController {
  constructor(private antecedenteMedicoService: AntecedenteMedicoService) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll(@Req() req) {
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
