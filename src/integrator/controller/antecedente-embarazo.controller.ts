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
import { AntecedenteEmbarazoService } from '../service/antecedente-embarazo.service';
import { UpdateAntecedenteEmbarazoDto } from '../dto/update-antecedente-embarazo.dto';
import { AuthGuard } from '@nestjs/passport';
import { CreateAntecedenteEmbarazoDto } from '../dto/create-antecedente-embarazo.dto';

@ApiTags('Antecedente Embarazo')
@Controller('integrator/antecedente-embarazo')
@ApiSecurity('X-API-KEY', ['X-API-KEY'])
@UseGuards(AuthGuard('api-key'))
@UseFilters(new HttpExceptionFilter())
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 403, description: 'Forbidden.' })
export class AntecedenteEmbarazoController {
  constructor(private antecedenteEmbarazoService: AntecedenteEmbarazoService) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll(@Req() req) {
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
