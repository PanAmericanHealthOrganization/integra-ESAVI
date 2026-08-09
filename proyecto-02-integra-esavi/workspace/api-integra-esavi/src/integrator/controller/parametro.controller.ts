import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { getUsernameFromJwt } from 'src/common/utils/jwt.util';
import { Roles } from '../../common/decorators/roles.decorator';
import { KeycloakAuthGuard } from '../../common/guards/keycloak-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateParametroDto, UpdateParametroDto } from '../dto';
import { ParametroService } from '../service/parametro.service';

/**
 * TC_PARAMETRO guarda las credenciales de todas las integraciones (DHIS2, VigiFlow,
 * WHODrug, MedDRA) y el servicio devuelve los valores ya descifrados, así que tanto la
 * lectura como la escritura exigen rol `admin`. Los guards van a nivel de clase: cualquier
 * endpoint que se agregue después queda protegido sin tener que acordarse de anotarlo.
 *
 * Coincide con lo que ya hace el frontend, que muestra "Configuraciones → Parametros"
 * sólo a `admin` y envía el bearer de Keycloak en cada petición.
 *
 * El usuario que queda en la auditoría sale del token verificado por `KeycloakAuthGuard`
 * (vía `getUsernameFromJwt`), no de una cabecera `x-username` que cualquiera podía escribir.
 */
@ApiTags('Parametros')
@ApiBearerAuth('keycloak-jwt')
@UseGuards(KeycloakAuthGuard, RolesGuard)
@Roles('admin')
@Controller({ path: 'integrator/parametros', version: '1' })
export class ParametroController {
  constructor(private parametroService: ParametroService) {}

  @Get('/findAll')
  @ApiResponse({ status: 200, description: 'The records have been successfully retrieved.' })
  findAll() {
    return this.parametroService.findAll();
  }

  @Get(':uuid')
  @ApiResponse({ status: 200, description: 'The record has been successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  findOne(@Param('uuid') uuid: string) {
    return this.parametroService.findOne(uuid);
  }

  @Post('/create')
  @ApiResponse({ status: 201, description: 'The record has been successfully created.' })
  @ApiResponse({ status: 400, description: 'The record has not been successfully created.' })
  create(@Body() body: CreateParametroDto, @Req() req: Request) {
    return this.parametroService.create(body, getUsernameFromJwt(req.headers.authorization));
  }

  @Put(':uuid')
  @ApiResponse({ status: 200, description: 'The record has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'The record has not been successfully updated.' })
  update(
    @Param('uuid', new ParseUUIDPipe()) uuid: string,
    @Body() body: UpdateParametroDto,
    @Req() req: Request,
  ) {
    return this.parametroService.update(uuid, body, getUsernameFromJwt(req.headers.authorization));
  }

  @Delete(':uuid')
  @ApiResponse({ status: 200, description: 'The record has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  delete(@Param('uuid', new ParseUUIDPipe()) uuid: string, @Req() req: Request) {
    return this.parametroService.delete(uuid, getUsernameFromJwt(req.headers.authorization));
  }
}
