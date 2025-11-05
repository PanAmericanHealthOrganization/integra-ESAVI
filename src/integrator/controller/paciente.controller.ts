import { Controller, Get, Param } from '@nestjs/common';
import { PacienteService } from '../service/paciente.service';
import { Paciente } from '../entity/paciente.entity';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Paciente')
@Controller('paciente')
export class PacienteController {
  constructor(private readonly pacienteService: PacienteService) {}

  @Get()
  findAll(): Promise<Paciente[]> {
    return this.pacienteService.findAll();
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string): Promise<Paciente> {
    return this.pacienteService.findOne(uuid);
  }
}
