import { Controller, Get, Query } from '@nestjs/common';
import { VacunacionNominalService } from '../service/vacunacion-nominal.service';
import { ApiTags } from '@nestjs/swagger';

/**
 * Controlador para sincronización de datos de vacunación desde Oracle
 */
@ApiTags('Para Datos Agregados Vacunación')
@Controller({ path: 'vacunacion-nominal', version: '1' })
export class VacunacionNominalSyncController {
  constructor(private readonly vacunacionService: VacunacionNominalService) {}

  /**
   * Endpoint para sincronizar vacunaciones por fecha
   * @param fecha - Fecha en formato YYYY-MM-DD
   * @returns Promesa que se resuelve cuando el procesamiento termina
   */
  @Get('/sync')
  async sync(@Query('fecha') fecha: string): Promise<void> {
    return this.vacunacionService.procesarVacunasAgregadas(new Date(fecha));
  }

  /**
   * Endpoint para sincronizar vacunaciones en un rango de fechas
   * @param desde - Fecha inicial en formato YYYY-MM-DD
   * @param hasta - Fecha final en formato YYYY-MM-DD
   * @returns Promesa que se resuelve cuando el procesamiento termina
   */
  @Get('/sync-range')
  async syncRange(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ): Promise<void> {
    return this.vacunacionService.procesarVacunasAgregadasFull(
      new Date(desde),
      new Date(hasta),
    );
  }
}
