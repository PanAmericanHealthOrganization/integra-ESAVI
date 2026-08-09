import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { getUsernameFromJwt } from 'src/common/utils/jwt.util';
import { Roles } from '../../common/decorators/roles.decorator';
import { KeycloakAuthGuard } from '../../common/guards/keycloak-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateNotificadorDto, UpdateNotificadorDto } from '../dto/notificador.dto';
import { NotificadorService } from '../service/notificador.service';

/**
 * Los notificadores son personas: identificación, nombres y profesión del profesional de
 * salud que reporta. El listado completo es un padrón de datos personales, así que toda la
 * clase exige token de Keycloak.
 *
 * La escritura además pide rol `admin`: alterar o borrar un notificador cambia a quién queda
 * atribuida una notificación de ESAVI. La lectura se conforma con estar autenticado, como en
 * `ReporteController`, porque el perfil del notificador se muestra en la ficha del ESAVI.
 *
 * El usuario de la auditoría sale del token ya verificado (`getUsernameFromJwt`) y no de la
 * cabecera `x-username`, que era libre de escribir y que el frontend nunca envió.
 */
@ApiTags('Notificador')
@ApiBearerAuth('keycloak-jwt')
@UseGuards(KeycloakAuthGuard, RolesGuard)
@Controller({ path: 'integrator/notificador', version: '1' })
export class NotificadorController {
  constructor(private readonly notificadorService: NotificadorService) {}

  @Get('/findAll')
  @ApiResponse({ status: 200, description: 'The records have been successfully retrieved.' })
  findAll() {
    return this.notificadorService.findAll();
  }

  @Get(':identificacion')
  @ApiResponse({ status: 200, description: 'The record has been successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  findOne(@Param('identificacion') identificacion: string) {
    return this.notificadorService.findOne(identificacion);
  }

  @Post('/create')
  @Roles('admin')
  @ApiResponse({ status: 201, description: 'The record has been successfully created.' })
  @ApiResponse({ status: 400, description: 'The record has not been successfully created.' })
  create(@Body() body: CreateNotificadorDto, @Req() req: Request) {
    return this.notificadorService.create(body, getUsernameFromJwt(req.headers.authorization));
  }

  @Put(':identificacion')
  @Roles('admin')
  @ApiResponse({ status: 200, description: 'The record has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'The record has not been successfully updated.' })
  update(
    @Param('identificacion') identificacion: string,
    @Body() body: UpdateNotificadorDto,
    @Req() req: Request,
  ) {
    return this.notificadorService.update(
      identificacion,
      body,
      getUsernameFromJwt(req.headers.authorization),
    );
  }

  @Delete(':identificacion')
  @Roles('admin')
  @ApiResponse({ status: 200, description: 'The record has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  delete(@Param('identificacion') identificacion: string, @Req() req: Request) {
    return this.notificadorService.delete(
      identificacion,
      getUsernameFromJwt(req.headers.authorization),
    );
  }
}
