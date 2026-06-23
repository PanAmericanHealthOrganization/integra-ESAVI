import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { getUsernameFromJwt } from 'src/common/utils/jwt.util';
import { CreateCatalogoPadreDto, UpdateCatalogoPadreDto } from '../dto';
import { CatalogoPadreService } from '../service/catalogo-padre.service';

@ApiTags('CatalogoPadre')
@ApiBearerAuth('keycloak-jwt')
@Controller({ path: 'integrator/catalogo-padre', version: '1' })
export class CatalogoPadreController {
  constructor(private catalogoPadreService: CatalogoPadreService) {}

  @Get('/findAll')
  @ApiResponse({ status: 200, description: 'The records have been successfully retrieved.' })
  findAll() {
    return this.catalogoPadreService.findAll();
  }

  @Get(':uuid')
  @ApiResponse({ status: 200, description: 'The record has been successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  findOne(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
    return this.catalogoPadreService.findOne(uuid);
  }

  @Post('/create')
  @ApiResponse({ status: 201, description: 'The record has been successfully created.' })
  @ApiResponse({ status: 400, description: 'The record has not been successfully created.' })
  create(@Body() body: CreateCatalogoPadreDto, @Req() req: Request) {
    return this.catalogoPadreService.create(body, getUsernameFromJwt(req.headers.authorization));
  }

  @Put(':uuid')
  @ApiResponse({ status: 200, description: 'The record has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'The record has not been successfully updated.' })
  update(
    @Param('uuid', new ParseUUIDPipe()) uuid: string,
    @Body() body: UpdateCatalogoPadreDto,
    @Req() req: Request,
  ) {
    return this.catalogoPadreService.update(uuid, body, getUsernameFromJwt(req.headers.authorization));
  }

  @Delete(':uuid')
  @ApiResponse({ status: 200, description: 'The record has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  delete(@Param('uuid', new ParseUUIDPipe()) uuid: string, @Req() req: Request) {
    return this.catalogoPadreService.delete(uuid, getUsernameFromJwt(req.headers.authorization));
  }
}
