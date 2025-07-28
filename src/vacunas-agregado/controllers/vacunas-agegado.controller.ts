import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  PoblacionVacunadaCreateDto,
  PoblacionVacunadaUpdateDto,
} from '../models/dto/poblacion-vacunada.dto';
import { PoblacionVacunadaService } from '../services/poblacion-vacunada.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Vacunas Agregado')
@ApiBearerAuth()
@Controller({
  path: 'vacunas-agregado',
  version: '1',
})
export class VacunasAgregadoController {
  constructor(
    private readonly poblacionVacunadaService: PoblacionVacunadaService,
  ) {}

  @Get()
  async findAll() {
    return this.poblacionVacunadaService.findAll({});
  }

  @Post()
  async create(@Body() create: PoblacionVacunadaCreateDto) {
    return this.poblacionVacunadaService.create(create);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() update: PoblacionVacunadaUpdateDto,
  ) {
    return this.poblacionVacunadaService.update(id, update);
  }
}
