import { Controller, Delete, HttpCode, HttpStatus, Logger, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Usuario, UsuarioAutenticado } from '../../common/decorators/usuario.decorator';
import { KeycloakAuthGuard } from '../../common/guards/keycloak-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { WhoDrugsAsAnyService } from '../services/whodrugasany.service';
import { WhoDrugsSyncService } from '../services/whodrugs-sync.service';

/**
 *
 */
@ApiTags('Who Drug')
@Controller({ path: 'whodrug', version: '1' })
export class WhodrugsSyncController {
  private readonly logger = new Logger(WhodrugsSyncController.name);

  constructor(
    private readonly whoDrugsSincService: WhoDrugsSyncService,
    private readonly whoDrugAsAnyService: WhoDrugsAsAnyService,
  ) {}

  // El historial de sincronizaciones ya no vive aquí: todas las fuentes se
  // registran en DHI_ESAVI.TR_SYNC_PROCESS y se consultan en
  // GET /v1/integrator/syncs/list?source=WHODRUG

  /**
   *
   */
  @Post('/sync')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('keycloak-jwt')
  @ApiOperation({
    summary: 'Dispara el proceso de sincronización de whodrugs,',
    description:
      'Encola la sincronización del diccionario WHODrug y responde de inmediato con 202: el ' +
      'proceso tarda varios minutos y mantener la petición abierta hasta el final la hacía ' +
      'morir por timeout del proxy aunque la corrida siguiese viva. El avance y el desenlace ' +
      'se consultan en GET /v1/integrator/syncs/list?source=WHODRUG, y quien la lanzó recibe ' +
      'además una notificación al terminar.',
  })
  @ApiResponse({ status: 202, description: 'Sincronización iniciada' })
  public async sync(@Usuario() usuario: UsuarioAutenticado): Promise<any> {
    // Deliberadamente sin await: la respuesta sale ya. El desenlace queda en
    // TR_SYNC_PROCESS y llega como notificación, así que aquí sólo hace falta impedir que
    // un rechazo sin manejar tumbe el proceso.
    void this.whoDrugsSincService.sync(usuario).catch((error) => {
      this.logger.error(
        `Falló la sincronización WHODrug: ${error instanceof Error ? error.message : String(error)}`,
      );
    });

    return {
      aceptado: true,
      mensaje:
        'Sincronización WHODrug iniciada. El proceso puede tardar varios minutos; ' +
        'recibirás una notificación al terminar.',
    };
  }

  /**
   *
   */
  @Delete('/truncate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('keycloak-jwt')
  @ApiOperation({
    summary: 'Trunca todas las tablas del esquema WHO_DRUG (TRUNCATE CASCADE)',
    description:
      'Limpia DRUG, ACTIVE_INGREDIENTS, INGREDIENT_TRANSLATION, COUNTRY_SALES, MAHOLDER y ' +
      'ATOMIC_THERAPEUTIC_CHEMICALS. La bitácora ya no vive en DRUG_SYNC sino en ' +
      'DHI_ESAVI.TR_SYNC_PROCESS, que es histórico y no se toca; que la siguiente corrida no se ' +
      'omita por SHA repetido lo garantiza `existeSincronizacionConSHA`, que exige que el ' +
      'diccionario tenga filas.',
  })
  @ApiResponse({ status: 200, description: 'Tablas de WHO_DRUG truncadas exitosamente' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  public async truncate() {
    await this.whoDrugsSincService.truncate();
    return {
      message: 'Tablas del esquema WHO_DRUG truncadas exitosamente',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   *
   */
  @Post('/as/dhis2-optionset')
  @ApiOperation({
    summary: 'Obtiene la lista de opciones para dhis2, es neceario proporcionar el pais ,',
    description: 'Genera la el optionsets para la importación en DHIS2',
  })
  public async asDHIS2OptionSet(
    @Query('country') country: string,
    @Query('atcCode') atcCode: string,
    @Query('optionSetName')
    optionSetName = 'Ponga aqui el nombre del OptionSet',
  ) {
    if (['', undefined, null].includes(country)) {
      throw new Error('country is required');
    }
    return this.whoDrugAsAnyService.asDHHIS2OptionSet({
      country,
      atcCode,
      optionSetName,
    });
  }
}
