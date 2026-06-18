import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCatalogoPadreDto } from '../dto/create-catalogo-padre.dto';
import { UpdateCatalogoPadreDto } from '../dto/update-catalogo-padre.dto';
import { CatalogoPadreService } from '../service/catalogo-padre.service';

@ApiTags('CatalogoPadre')
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
  create(
    @Body() body: CreateCatalogoPadreDto,
    @Headers('x-username') username: string,
  ) {
    return this.catalogoPadreService.create(body, username);
  }

  @Put(':uuid')
  @ApiResponse({ status: 200, description: 'The record has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'The record has not been successfully updated.' })
  update(
    @Param('uuid', new ParseUUIDPipe()) uuid: string,
    @Body() body: UpdateCatalogoPadreDto,
    @Headers('x-username') username: string,
  ) {
    return this.catalogoPadreService.update(uuid, body, username);
  }

  @Delete(':uuid')
  @ApiResponse({ status: 200, description: 'The record has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  delete(
    @Param('uuid', new ParseUUIDPipe()) uuid: string,
    @Headers('x-username') username: string,
  ) {
    return this.catalogoPadreService.delete(uuid, username);
  }
}
