import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { getUsernameFromJwt } from 'src/common/utils/jwt.util';
import { Roles } from '../../common/decorators/roles.decorator';
import { KeycloakAuthGuard } from '../../common/guards/keycloak-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProvinciaDto, UpdateProvinciaDto } from '../dto/provincia.dto';
import { ProvinciaService } from '../service/provincia.service';

@ApiTags('Provincia')
@ApiBearerAuth('keycloak-jwt')
@UseGuards(KeycloakAuthGuard, RolesGuard)
@Controller({ path: 'integrator/provincias', version: '1' })
export class ProvinciaController {
  constructor(private readonly provinciaService: ProvinciaService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Listado de provincias.' })
  findAll() {
    return this.provinciaService.findAll();
  }

  @Get(':codigo')
  @ApiResponse({ status: 200, description: 'Provincia encontrada.' })
  @ApiResponse({ status: 404, description: 'Provincia no encontrada.' })
  findOne(@Param('codigo') codigo: string) {
    return this.provinciaService.findOne(codigo);
  }

  @Roles('admin')
  @Post()
  @ApiResponse({ status: 201, description: 'Provincia creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Error al crear la provincia.' })
  create(@Body() body: CreateProvinciaDto, @Req() req: Request) {
    return this.provinciaService.create(body, getUsernameFromJwt(req.headers.authorization));
  }

  @Roles('admin')
  @Put(':codigo')
  @ApiResponse({ status: 200, description: 'Provincia actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Provincia no encontrada.' })
  update(
    @Param('codigo') codigo: string,
    @Body() body: UpdateProvinciaDto,
    @Req() req: Request,
  ) {
    return this.provinciaService.update(codigo, body, getUsernameFromJwt(req.headers.authorization));
  }

  @Roles('admin')
  @Delete(':codigo')
  @ApiResponse({ status: 200, description: 'Provincia eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Provincia no encontrada.' })
  delete(@Param('codigo') codigo: string, @Req() req: Request) {
    return this.provinciaService.delete(codigo, getUsernameFromJwt(req.headers.authorization));
  }
}
