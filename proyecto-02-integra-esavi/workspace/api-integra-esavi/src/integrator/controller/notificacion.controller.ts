import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { DatoEsaviService } from '../service/dato-esavi.service';
import { DatoVacunaService } from '../service/dato-vacuna.service';
import { DatoVacunacionService } from '../service/dato-vacunacion.service';
import { NotificacionService } from '../service/notificacion.service';
import { PacienteEmbarazadaServive } from '../service/paciente-embarazada.service';

@ApiTags('Notificacion')
@Controller({ path: 'integrator/notificacion', version: '1' })
export class NotificacionController {
  constructor(
    private notificacionService: NotificacionService,
    private datoVacunacionService: DatoVacunacionService,
    private datoVacunaService: DatoVacunaService,
    private pacienteEmbarazadaService: PacienteEmbarazadaServive,
    private datoEsaviService: DatoEsaviService,
  ) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll() {
    return this.notificacionService.findAll();
  }

  //BUSCA UN ITEM ESPECIFICO POR ID
  @Get(':uuid')
  @ApiQuery({
    name: 'r',
    type: 'string',
    required: false,
    description: 'Comma-separated list of relations (r1, r2, r3)',
  })
  @ApiParam({
    name: 'uuid',
    type: 'string',
    description: 'UUID of the notification',
  })
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'The record has not been found.' })
  findOne(@Param('uuid', new ParseUUIDPipe()) uuid: string, @Query('r') relation?: string) {
    if (relation) {
      const allowedRelations: string[] = ['paciente', 'notificador', 'notificador.profesion'];
      const requestedRelations: string[] = relation.split(',');

      const invalidRelations = requestedRelations.filter((rel) => !allowedRelations.includes(rel));
      if (invalidRelations.length > 0) {
        throw new BadRequestException(
          `Invalid relation(s) provided: ${invalidRelations.join(', ')}`,
        );
      }
    }
    return this.notificacionService.findOne(uuid, relation);
  }

  @Get(':uuid/medicina')
  findMedicinaByNotificacionUUID(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
    return this.notificacionService.findMedicinaByNotificacionUUID(uuid);
  }

  @Get(':uuid/medicina/:id')
  searchMedicinaByUUID(
    @Param('uuid', new ParseUUIDPipe()) uuidNotificacion: string,
    @Param('id', new ParseUUIDPipe()) uuidMedicina: string,
  ) {
    return this.notificacionService.findMedicinaByUUIDBelongingToNotificacion(
      uuidNotificacion,
      uuidMedicina,
    );
  }

  @Get(':uuid/antecedente-embarazo')
  searchAntecedenteEmbarazoByUUID(@Param('uuid', new ParseUUIDPipe()) uuidNotificacion: string) {
    return this.notificacionService.findAntecedenteEmbarazoByNotificacionUUID(uuidNotificacion);
  }

  @Get(':uuid/antecedente-evento')
  searchAntecedenteEventoByUUID(@Param('uuid', new ParseUUIDPipe()) uuidNotificacion: string) {
    return this.notificacionService.findAntecedenteEventoByNotificacionUUID(uuidNotificacion);
  }

  @Get(':uuid/antecedente-medico')
  searchAntecedenteMedicoByUUID(@Param('uuid', new ParseUUIDPipe()) uuidNotificacion: string) {
    return this.notificacionService.findAntecedenteMedicoByNotificacionUUID(uuidNotificacion);
  }

  @Get(':uuid/antecedente-preexistencia')
  searchAntecedentePreexistenciaByUUID(
    @Param('uuid', new ParseUUIDPipe()) uuidNotificacion: string,
  ) {
    return this.notificacionService.findAntecedentePreexistenciaByNotificacionUUID(
      uuidNotificacion,
    );
  }

  @Get(':uuid/dato-vacunacion')
  @ApiResponse({ status: 200, description: 'Datos de vacunación de la notificación.' })
  findDatoVacunacionByUUID(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
    return this.datoVacunacionService.findByNotificacionId(uuid);
  }

  @Get(':uuid/dato-vacuna')
  @ApiResponse({ status: 200, description: 'Vacunas aplicadas de la notificación.' })
  findDatoVacunaByUUID(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
    return this.datoVacunaService.findByNotificacionId(uuid);
  }

  @Get(':uuid/paciente-embarazada')
  @ApiResponse({ status: 200, description: 'Datos de embarazo de la paciente.' })
  findPacienteEmbarazadaByUUID(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
    return this.pacienteEmbarazadaService.findByNotificacionId(uuid);
  }

  @Get(':uuid/dato-esavi')
  @ApiResponse({ status: 200, description: 'Eventos ESAVI de la notificación.' })
  findDatoEsaviByUUID(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
    return this.datoEsaviService.findByNotificacionId(uuid);
  }

  /**
   *
   * @param body
   * @returns
   */
  @Post('findAllPaginated')
  async findAllPaginated(@Body() body: GetListParams) {
    return await this.notificacionService.findAllPaginated(body);
  }
}
