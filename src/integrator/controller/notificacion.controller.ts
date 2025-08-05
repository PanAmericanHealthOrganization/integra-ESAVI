import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseFilters,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../../providers/http-exception.filter';
import { NotificacionService } from '../service/notificacion.service';
import { GetListParams } from 'src/utils/interfaces/pagination';

@ApiTags('Notificacion')
@Controller('integrator/notificacion')
@UseFilters(new HttpExceptionFilter())
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 403, description: 'Forbidden.' })
export class NotificacionController {
  constructor(private notificacionService: NotificacionService) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/findAll')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  findAll(@Req() req) {
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
  findOne(
    @Param('uuid', new ParseUUIDPipe()) uuid: string,
    @Query('r') relation?: string,
  ) {
    if (relation) {
      const allowedRelations: string[] = ['paciente', 'r2', 'r3']; // Define the allowed relations here
      const requestedRelations: string[] = relation.split(',');

      const invalidRelations = requestedRelations.filter(
        (rel) => !allowedRelations.includes(rel),
      );
      if (invalidRelations.length > 0) {
        throw new BadRequestException(
          `Invalid relation(s) provided: ${invalidRelations.join(', ')}`,
        );
      }
    }
    return this.notificacionService.findOne(uuid, relation);
  }

  @Get(':uuid/medicina')
  findMedicinaByNotificacionUUID(
    @Param('uuid', new ParseUUIDPipe()) uuid: string,
  ) {
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
  searchAntecedenteEmbarazoByUUID(
    @Param('uuid', new ParseUUIDPipe()) uuidNotificacion: string,
  ) {
    return this.notificacionService.findAntecedenteEmbarazoByNotificacionUUID(
      uuidNotificacion,
    );
  }

  @Get(':uuid/antecedente-evento')
  searchAntecedenteEventoByUUID(
    @Param('uuid', new ParseUUIDPipe()) uuidNotificacion: string,
  ) {
    return this.notificacionService.findAntecedenteEventoByNotificacionUUID(
      uuidNotificacion,
    );
  }

  @Get(':uuid/antecedente-medico')
  searchAntecedenteMedicoByUUID(
    @Param('uuid', new ParseUUIDPipe()) uuidNotificacion: string,
  ) {
    return this.notificacionService.findAntecedenteMedicoByNotificacionUUID(
      uuidNotificacion,
    );
  }

  @Get(':uuid/antecedente-preexistencia')
  searchAntecedentePreexistenciaByUUID(
    @Param('uuid', new ParseUUIDPipe()) uuidNotificacion: string,
  ) {
    return this.notificacionService.findAntecedentePreexistenciaByNotificacionUUID(
      uuidNotificacion,
    );
  }

  /**
   *
   * @param body
   * @returns
   */
  @Post('findAllPaginated')
  async findAllPaginated(@Body() body: GetListParams) {
    // Los parámetros de paginación, filtros, campos y ordenamiento vienen en el body
    // Ejemplo de body esperado:
    // {
    //   "page": 1,
    //   "rowsPerPage": 10,
    //   "filters": { "estado": "ACTIVO" },
    //   "fields": ["id", "fecha", "estado"],
    //   "sorterFields": [{ "field": "fecha", "order": "DESC" }]
    // }
    return await this.notificacionService.findAllPaginated(body);
  }
}
