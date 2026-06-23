import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { getUsernameFromJwt } from 'src/common/utils/jwt.util';
import { CreateCantonDto, UpdateCantonDto } from '../dto/canton.dto';
import { CantonService } from '../service/canton.service';

@ApiTags('Canton')
@ApiBearerAuth('keycloak-jwt')
@Controller({ path: 'integrator/cantones', version: '1' })
export class CantonController {
  constructor(private readonly cantonService: CantonService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Listado de cantones.' })
  @ApiQuery({ name: 'provincia', required: false, description: 'Filtrar por código de provincia' })
  findAll(@Query('provincia') provincia?: string) {
    if (provincia) {
      return this.cantonService.findByProvincia(provincia);
    }
    return this.cantonService.findAll();
  }

  @Get(':codigo')
  @ApiResponse({ status: 200, description: 'Cantón encontrado.' })
  @ApiResponse({ status: 404, description: 'Cantón no encontrado.' })
  findOne(@Param('codigo') codigo: string) {
    return this.cantonService.findOne(codigo);
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Cantón creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Error al crear el cantón.' })
  create(@Body() body: CreateCantonDto, @Req() req: Request) {
    return this.cantonService.create(body, getUsernameFromJwt(req.headers.authorization));
  }

  @Put(':codigo')
  @ApiResponse({ status: 200, description: 'Cantón actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Cantón no encontrado.' })
  update(
    @Param('codigo') codigo: string,
    @Body() body: UpdateCantonDto,
    @Req() req: Request,
  ) {
    return this.cantonService.update(codigo, body, getUsernameFromJwt(req.headers.authorization));
  }

  @Delete(':codigo')
  @ApiResponse({ status: 200, description: 'Cantón eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Cantón no encontrado.' })
  delete(@Param('codigo') codigo: string, @Req() req: Request) {
    return this.cantonService.delete(codigo, getUsernameFromJwt(req.headers.authorization));
  }
}
