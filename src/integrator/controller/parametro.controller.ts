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
import { ParametroService } from '../service/parametro.service';
import { CreateParametroDto } from '../dto/create-parametro.dto';
import { UpdateParametroDto } from '../dto/update-parametro.dto';
import { HttpExceptionFilter } from '../../providers/http-exception.filter';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Integrador')
@Controller('integrator/parametros')
@ApiSecurity('X-API-KEY', ['X-API-KEY'])
@UseGuards(AuthGuard('api-key'))
@UseFilters(new HttpExceptionFilter())
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 403, description: 'Forbidden.' })
export class ParametroController {
  constructor(private parametroService: ParametroService) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll(@Req() req) {
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
  update(
    @Param('uuid', new ParseUUIDPipe()) uuid: string,
    @Body() body: UpdateParametroDto,
  ) {
    return this.parametroService.update(uuid, body);
  }
}
