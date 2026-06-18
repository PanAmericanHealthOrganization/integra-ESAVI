import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateParametroDto, UpdateParametroDto } from '../dto';
import { ParametroService } from '../service/parametro.service';

@ApiTags('Parametros')
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
  create(
    @Body() body: CreateParametroDto,
    @Headers('x-username') username: string,
  ) {
    return this.parametroService.create(body, username);
  }

  @Put(':uuid')
  @ApiResponse({ status: 200, description: 'The record has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'The record has not been successfully updated.' })
  update(
    @Param('uuid', new ParseUUIDPipe()) uuid: string,
    @Body() body: UpdateParametroDto,
    @Headers('x-username') username: string,
  ) {
    return this.parametroService.update(uuid, body, username);
  }

  @Delete(':uuid')
  @ApiResponse({ status: 200, description: 'The record has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  delete(
    @Param('uuid', new ParseUUIDPipe()) uuid: string,
    @Headers('x-username') username: string,
  ) {
    return this.parametroService.delete(uuid, username);
  }
}
