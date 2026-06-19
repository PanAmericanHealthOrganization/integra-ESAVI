import { Body, Controller, Delete, Get, Headers, Param, Post, Put } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateNotificadorDto, UpdateNotificadorDto } from '../dto/notificador.dto';
import { NotificadorService } from '../service/notificador.service';

@ApiTags('Notificador')
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
  @ApiResponse({ status: 201, description: 'The record has been successfully created.' })
  @ApiResponse({ status: 400, description: 'The record has not been successfully created.' })
  create(
    @Body() body: CreateNotificadorDto,
    @Headers('x-username') username: string,
  ) {
    return this.notificadorService.create(body, username);
  }

  @Put(':identificacion')
  @ApiResponse({ status: 200, description: 'The record has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'The record has not been successfully updated.' })
  update(
    @Param('identificacion') identificacion: string,
    @Body() body: UpdateNotificadorDto,
    @Headers('x-username') username: string,
  ) {
    return this.notificadorService.update(identificacion, body, username);
  }

  @Delete(':identificacion')
  @ApiResponse({ status: 200, description: 'The record has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  delete(
    @Param('identificacion') identificacion: string,
    @Headers('x-username') username: string,
  ) {
    return this.notificadorService.delete(identificacion, username);
  }
}
