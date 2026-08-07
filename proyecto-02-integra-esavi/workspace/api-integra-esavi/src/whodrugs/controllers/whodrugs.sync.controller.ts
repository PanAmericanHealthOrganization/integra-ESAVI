import { Controller, Delete, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
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
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('keycloak-jwt')
  @ApiOperation({
    summary: 'Dispara el proceso de sincronización de whodrugs,',
    description:
      'Realiza la sincronización con whodrug con la base de datos postgres, este proceso puede tomar mucho tiempo, se recomienda no realizarlo en horas pico.',
  })
  public async sync(): Promise<any> {
    await this.whoDrugsSincService.sync();
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
      'Limpia DRUG, ACTIVE_INGREDIENTS, INGREDIENT_TRANSLATION, COUNTRY_SALES, MAHOLDER, ATOMIC_THERAPEUTIC_CHEMICALS y DRUG_SYNC. Al incluir DRUG_SYNC, la próxima sincronización volverá a importar los datos.',
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
