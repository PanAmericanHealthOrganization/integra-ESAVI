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
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../../providers/http-exception.filter';
import { CreateGrupoEtarioDto } from '../dto/create-grupo-etario.dto';
import { UpdateGrupoEtarioDto } from '../dto/update-grupo-etario.dto';
import { GrupoEtarioService } from '../service/grupo-etario.service';

@ApiTags('Integrador')
@Controller('integrator/grupo-etario')
// @ApiSecurity('X-API-KEY', ['X-API-KEY'])
// @UseGuards(AuthGuard('api-key'))
@UseFilters(new HttpExceptionFilter())
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 403, description: 'Forbidden.' })
export class GrupoEtarioController {
  constructor(private grupoEtarioService: GrupoEtarioService) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll(@Req() req) {
    return this.grupoEtarioService.findAll();
  }

  //BUSCA UN ITEM ESPECIFICO POR ID
  @Get(':uuid')
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  findOne(@Param('uuid') uuid: string) {
    return this.grupoEtarioService.findOne(uuid);
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
  create(@Body() body: CreateGrupoEtarioDto) {
    return this.grupoEtarioService.create(body);
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
    @Body() body: UpdateGrupoEtarioDto,
  ) {
    return this.grupoEtarioService.update(uuid, body);
  }
}
