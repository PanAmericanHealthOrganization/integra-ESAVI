import {Controller,Get,Query} from '@nestjs/common';
import {ApiOperation,ApiQuery,ApiTags} from '@nestjs/swagger';
import {IResultadoBusquedaMeddra,MeddraBusquedaService} from '../services/meddra-busqueda.service';

@ApiTags('Busqueda', 'Meddra Standar')
@Controller({ path: 'meddra/busqueda', version: '1' })
export class MeddraBusquedaController {
  constructor(private readonly meddraBusquedaService: MeddraBusquedaService) {}

  @Get()
  @ApiOperation({
    summary: 'Busca un término en los tres niveles del estándar MedDRA',
    description:
      'Un único término se compara contra el código y el nombre de SOC, PT y LLT (y la ' +
      'abreviatura del SOC). Cada coincidencia se devuelve con su camino completo hasta la ' +
      'raíz para poder pintar el árbol ya expandido hasta el elemento encontrado.',
  })
  @ApiQuery({ name: 'term', required: true, description: 'Código o nombre a buscar' })
  @ApiQuery({ name: 'page', required: false, description: 'Página, base 0' })
  @ApiQuery({ name: 'size', required: false, description: 'Coincidencias por página' })
  async buscar(
    @Query('term') term: string,
    @Query('page') page = 0,
    @Query('size') size = 20,
  ): Promise<IResultadoBusquedaMeddra> {
    return this.meddraBusquedaService.buscar(term, +page, +size);
  }
}
