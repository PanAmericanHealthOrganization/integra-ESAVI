import { BadRequestException, Controller, Delete, ForbiddenException, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RangoFechasUtils } from 'src/utils/rango-fechas.util';
import { Roles } from '../../common/decorators/roles.decorator';
import { Usuario, UsuarioAutenticado } from '../../common/decorators/usuario.decorator';
import { KeycloakAuthGuard } from '../../common/guards/keycloak-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SeedService } from '../service/seed.service';

/**
 * Tope de días que puede abarcar una simulación de vacunación. Cada día genera entre uno y
 * tres registros por establecimiento, así que un rango abierto llenaría TR_VACUNOMETRO con
 * millones de filas en una sola llamada.
 */
const MAX_DIAS_SIMULACION = 365;

/**
 * Todo lo que hay aquí es destructivo o masivo: truncar TR_NOTIFICACION en cascada, vaciar
 * todas las tablas TR o insertar cientos de miles de filas simuladas. Nada de eso puede
 * quedar al alcance de una petición anónima, así que la clase entera exige token de Keycloak
 * y rol `admin`.
 *
 * Los dos consumidores del frontend ya son de admin: la pantalla /admin (bajo `AdminGuard`)
 * y el diálogo de simulación del vacunómetro, que comprueba el rol antes de renderizarse.
 *
 * El guard es independiente del corte por ambiente que hace `seedSimulacionVacunacion`: ese
 * mira la variable ENV y protege de correr una simulación en producción, no de que la llame
 * alguien sin credenciales.
 */
@ApiTags('Seed')
@ApiBearerAuth('keycloak-jwt')
@UseGuards(KeycloakAuthGuard, RolesGuard)
@Roles('admin')
@Controller({ path: 'seed', version: '1' })
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cargar datos de ejemplo y catálogos de homologación' })
  @ApiResponse({ status: 200, description: 'Datos cargados exitosamente' })
  async seedData() {
    await this.seedService.seedData();
    return {
      message:
        'Controlador del semillero: Valores cargados exitosamente en el catálogo de homologación.',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('vacunometro')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar datos simulados de vacunómetro (TR_VACUNOMETRO)',
    description:
      'Inserta registros aleatorios de conteo de vacunas para pruebas y demos, usando unicodigos reales de TR_ESTABLECIMIENTO cuando existen.',
  })
  @ApiQuery({ name: 'registros', required: false, description: 'Cantidad de registros a generar (default 1000)' })
  @ApiQuery({ name: 'dias', required: false, description: 'Rango de días hacia atrás para las fechas de aplicación (default 365)' })
  @ApiResponse({ status: 200, description: 'Datos simulados insertados exitosamente' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async seedVacunometro(@Query('registros') registros = 1000, @Query('dias') dias = 365) {
    const { insertados } = await this.seedService.seedVacunometro(+registros, +dias);
    return {
      message: `${insertados} registros simulados de vacunómetro insertados exitosamente`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('simulacion-vacunacion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simular vacunaciones diarias de todos los establecimientos (TR_VACUNOMETRO)',
    description:
      'Genera registros agregados por día, establecimiento, vacuna y grupo etario (1-7), con el mismo formato que entrega la entidad de vacunación (HCUE), para cada día del rango indicado. Disponible solo en ambientes distintos de producción (variable de entorno ENV).',
  })
  @ApiQuery({ name: 'desde', required: true, description: 'Primer día del rango a simular, formato YYYY-MM-DD (incluido)' })
  @ApiQuery({ name: 'hasta', required: true, description: `Último día del rango a simular, formato YYYY-MM-DD (incluido). El rango no puede superar ${MAX_DIAS_SIMULACION} días` })
  @ApiResponse({ status: 200, description: 'Simulación de vacunaciones generada exitosamente' })
  @ApiResponse({ status: 400, description: 'Rango de fechas ausente, mal formado, invertido o demasiado amplio' })
  @ApiResponse({ status: 403, description: 'No disponible en ambiente de producción' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async seedSimulacionVacunacion(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    // El `sub` del token es la dirección del buzón: sin él la corrida queda registrada en
    // TR_SYNC_PROCESS pero nadie recibe el aviso. La clase ya está tras KeycloakAuthGuard,
    // así que el token siempre está disponible aquí.
    @Usuario() usuario: UsuarioAutenticado,
  ) {
    const env = String(process.env.ENV ?? '').toUpperCase();
    if (env.startsWith('PROD')) {
      throw new ForbiddenException('La simulación de vacunaciones no está disponible en el ambiente de producción');
    }

    const fechaInicio = RangoFechasUtils.parsearFechaLocal(desde);
    const fechaFin = RangoFechasUtils.parsearFechaLocal(hasta);
    if (!fechaInicio || !fechaFin) {
      throw new BadRequestException('Los parámetros "desde" y "hasta" son obligatorios y deben ser fechas válidas con formato YYYY-MM-DD');
    }
    if (fechaFin < fechaInicio) {
      throw new BadRequestException('La fecha "desde" debe ser anterior o igual a la fecha "hasta"');
    }

    const diasSolicitados = RangoFechasUtils.enumerarDiasLocales(fechaInicio, fechaFin).length;
    if (diasSolicitados > MAX_DIAS_SIMULACION) {
      throw new BadRequestException(
        `El rango no puede superar ${MAX_DIAS_SIMULACION} días: se solicitaron ${diasSolicitados}`,
      );
    }

    const { insertados, establecimientos, dias: diasSimulados } =
      await this.seedService.seedSimulacionVacunacionDiaria(fechaInicio, fechaFin, usuario);
    return {
      message: `Simulación de vacunaciones generada: ${insertados} registros para ${establecimientos} establecimientos en ${diasSimulados} días (${desde} a ${hasta})`,
      insertados,
      establecimientos,
      dias: diasSimulados,
      desde,
      hasta,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Limpiar datos existentes (TRUNCATE)' })
  @ApiResponse({ status: 200, description: 'Datos limpiados exitosamente' })
  async cleanData() {
    await this.seedService.cleanData();
    return {
      message: 'Datos limpiados exitosamente',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('tr-tables')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Limpiar contenido de todas las tablas que inician con "TR"' })
  @ApiResponse({ status: 200, description: 'Contenido de tablas TR limpiado exitosamente' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async cleanTRTables() {
    await this.seedService.cleanTRTables();
    return {
      message:
        'El contenido de todas las tablas que inician con "TR" ha sido limpiado exitosamente',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('truncate-solo-notificaciones')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Truncar únicamente TR_NOTIFICACION (en cascada)',
    description:
      'Vacía DHI_ESAVI.TR_NOTIFICACION y, por cascada, todo lo que cuelga de cada notificación ' +
      '(vacunas, ESAVI, desenlaces, gravedad, causalidad y medicamentos). No toca los diccionarios ' +
      'WHO_DRUG ni MEDDRA, que es la diferencia con DELETE truncate-notificacion: recargar las ' +
      'notificaciones no tiene por qué costar una resincronización completa de los diccionarios. ' +
      'TC_PARAMETRO y TR_SYNC_PROCESS también se conservan.',
  })
  @ApiResponse({ status: 200, description: 'Notificaciones truncadas en cascada exitosamente' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async truncateSoloNotificaciones() {
    await this.seedService.truncateSoloNotificaciones();
    return {
      message: 'Notificaciones (TR_NOTIFICACION) truncadas en cascada exitosamente',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('truncate-notificacion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Truncar notificaciones y diccionarios (WHO_DRUG y MEDDRA) en cascada',
    description:
      'Vacía TR_NOTIFICACION con todas sus tablas dependientes y, además, los esquemas WHO_DRUG y MEDDRA completos. ' +
      'Se conservan a propósito TC_PARAMETRO (la configuración de las integraciones) y TR_SYNC_PROCESS (el historial ' +
      'de corridas, que es también el registro de versiones de MedDRA cargadas): por eso, tras truncar, reimportar una ' +
      'versión de MedDRA ya registrada sigue devolviendo 409 hasta que se elimine su fila del historial.',
  })
  @ApiResponse({ status: 200, description: 'Notificaciones y diccionarios truncados en cascada exitosamente' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async truncateNotificacion() {
    await this.seedService.truncateNotificacion();
    return {
      message: 'Notificaciones y diccionarios (WHODrug y MedDRA) truncados en cascada exitosamente',
      timestamp: new Date().toISOString(),
    };
  }
}
