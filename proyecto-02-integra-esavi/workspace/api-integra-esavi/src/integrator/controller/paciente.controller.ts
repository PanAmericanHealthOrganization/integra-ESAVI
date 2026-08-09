import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../../common/guards/keycloak-auth.guard';
import { Paciente } from '../entity/paciente.entity';
import { PacienteService } from '../service/paciente.service';

/**
 * Datos personales de pacientes. `findAll` devuelve el padrón completo sin paginar, así que
 * exige token; no pide rol porque la ficha del paciente se muestra en la pantalla del ESAVI,
 * que consulta cualquier usuario autenticado. No expone escritura.
 */
@ApiTags('Paciente')
@ApiBearerAuth('keycloak-jwt')
@UseGuards(KeycloakAuthGuard)
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
