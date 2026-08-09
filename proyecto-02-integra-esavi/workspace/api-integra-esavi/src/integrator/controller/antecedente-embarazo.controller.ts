import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { KeycloakAuthGuard } from '../../common/guards/keycloak-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateAntecedenteEmbarazoDto, UpdateAntecedenteEmbarazoDto } from '../dto';
import { AntecedenteEmbarazoService } from '../service/antecedente-embarazo.service';

@ApiTags('Antecedente Embarazo')
@ApiBearerAuth('keycloak-jwt')
@UseGuards(KeycloakAuthGuard, RolesGuard)
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
  @Roles('admin')
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
  @Roles('admin')
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
