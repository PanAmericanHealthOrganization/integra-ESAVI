import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Usuario, UsuarioAutenticado } from '../../common/decorators/usuario.decorator';
import { KeycloakAuthGuard } from '../../common/guards/keycloak-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CargarVersionReqDTO, ProcessVersionReqDTO } from '../models/dto';
import { ArchivosMeddraEnMemoria, MeddraProcessFilesService } from '../services/meddra-process.service';
import { MeddraArchivosUtils } from '../utils/meddra-archivos.utils';

/**
 * Tamaño máximo por archivo. El mayor de los tres que se suben es `llt.asc`, ~5,5 MB en
 * la versión 28; 20 MB deja margen para versiones futuras sin abrir la puerta a que
 * alguien empuje un archivo arbitrariamente grande a la memoria del proceso.
 */
const MAX_BYTES_POR_ARCHIVO = 20 * 1024 * 1024;

/**
 * Carga y sincronización de versiones de MedDRA.
 */
@ApiTags('MedDra Versionamiento')
@Controller({ path: 'meddra/version', version: '1' })
export class MeddraVersionController {
  constructor(private readonly meddraProcessFilesService: MeddraProcessFilesService) {}

  private readonly logger = new Logger(MeddraVersionController.name);

  @ApiOperation({
    summary: 'Procesar archivos de versión de MedDRA ya presentes en el servidor',
    description:
      'Camino histórico: lee upload_files/meddra/<versión>/<idioma>/. Para cargar una ' +
      'distribución nueva desde la interfaz se usa POST /meddra/version/upload, que no ' +
      'escribe nada en disco.',
  })
  @Post('process')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('keycloak-jwt')
  async processVersionFiles(
    @Body() processsVersionReqDto: ProcessVersionReqDTO,
    @Usuario() usuario: UsuarioAutenticado,
  ): Promise<any[]> {
    const { version, lang } = processsVersionReqDto;
    // Las excepciones HTTP que lanza el servicio (409 versión ya cargada, 404 directorio
    // inexistente) tienen que llegar tal cual al cliente. Antes un try/catch las
    // convertía todas en 500 y el modal mostraba "error interno" para un caso previsto.
    return this.meddraProcessFilesService.processVersionFiles(
      version,
      lang,
      'Sincronización desde archivos en servidor',
      usuario,
    );
  }

  /**
   * Carga una versión de MedDRA a partir del ZIP que el navegador ya descomprimió.
   *
   * El ZIP de MSSO viene cifrado; se abre en el cliente para que la contraseña nunca
   * viaje. De los 14 `.asc` de la distribución sólo llegan aquí los tres que se leen más
   * `meddra_release.asc`, que es el sello con el que se comprueba que versión e idioma
   * son los que el usuario dice. La estructura completa se acredita con el manifiesto.
   *
   * Responde 202 en cuanto la validación pasa: insertar ~89.000 LLT tarda varios minutos
   * y mantener la petición abierta todo ese rato es pedirle un timeout al proxy. El
   * avance se sigue en TR_SYNC_PROCESS y el desenlace llega como notificación.
   */
  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('keycloak-jwt')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Cargar y sincronizar una versión de MedDRA desde los .asc del ZIP',
    description:
      'Recibe soc.asc, pt.asc, llt.asc y meddra_release.asc. Nada se guarda en disco: ' +
      'los archivos se parsean en memoria. Devuelve 202 y el proceso continúa en segundo plano.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['version', 'lang', 'manifiesto', 'files'],
      properties: {
        version: { type: 'string', example: '28_0' },
        lang: { type: 'string', enum: ['ES', 'EN'], example: 'ES' },
        manifiesto: {
          type: 'string',
          description: 'JSON con los nombres de todos los .asc hallados en el ZIP',
          example: '["soc.asc","pt.asc","llt.asc","mdhier.asc"]',
        },
        descripcion: { type: 'string' },
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(
    // memoryStorage (el de por defecto cuando no se indica `storage`): los buffers viven
    // en el proceso y se liberan al terminar. Escribirlos en disco es justo lo que este
    // endpoint existe para evitar.
    FilesInterceptor('files', MeddraArchivosUtils.ARCHIVOS_A_PROCESAR.length, {
      limits: {
        fileSize: MAX_BYTES_POR_ARCHIVO,
        files: MeddraArchivosUtils.ARCHIVOS_A_PROCESAR.length,
      },
    }),
  )
  async cargarVersion(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CargarVersionReqDTO,
    @Usuario() usuario: UsuarioAutenticado,
  ) {
    const archivos = this.indexarArchivos(files);
    this.validarManifiesto(dto.manifiesto);
    this.validarRelease(archivos, dto);

    const lang = dto.lang.toUpperCase();

    // El 409 por versión ya cargada tiene que salir en la respuesta, no en una
    // notificación: el usuario está mirando el modal ahora mismo.
    if (await this.meddraProcessFilesService.validarVersion(dto.version, lang)) {
      throw new ConflictException(
        `La versión ${dto.version}/${lang} ya existe en la base de datos`,
      );
    }

    const enMemoria: ArchivosMeddraEnMemoria = {
      soc: archivos.get('soc.asc').buffer,
      pt: archivos.get('pt.asc').buffer,
      llt: archivos.get('llt.asc').buffer,
    };

    // Deliberadamente sin await: la respuesta sale ya. El desenlace queda en
    // TR_SYNC_PROCESS y llega al usuario como notificación, así que aquí sólo hace falta
    // impedir que un rechazo sin manejar tumbe el proceso.
    void this.meddraProcessFilesService
      .cargarDesdeArchivos(
        enMemoria,
        dto.version,
        lang,
        dto.descripcion ?? 'Carga desde archivo ZIP de MSSO',
        usuario,
      )
      .catch((error) => {
        this.logger.error(
          `Falló la carga MedDRA ${dto.version}/${lang}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });

    return {
      aceptado: true,
      version: dto.version,
      lang,
      mensaje:
        `Sincronización MedDRA ${dto.version}/${lang} iniciada. ` +
        'El proceso puede tardar varios minutos; recibirás una notificación al terminar.',
    };
  }

  /**
   * Indexa los archivos por nombre canónico y comprueba que están exactamente los
   * cuatro que se esperan, sin sobrantes.
   */
  private indexarArchivos(files: Express.Multer.File[]): Map<string, Express.Multer.File> {
    if (!files?.length) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    const porNombre = new Map<string, Express.Multer.File>();

    for (const file of files) {
      const nombre = MeddraArchivosUtils.nombreBase(file.originalname);

      if (!MeddraArchivosUtils.ARCHIVOS_A_PROCESAR.includes(nombre)) {
        throw new BadRequestException(
          `El archivo "${file.originalname}" no corresponde a esta carga. ` +
            `Se esperan únicamente: ${MeddraArchivosUtils.ARCHIVOS_A_PROCESAR.join(', ')}`,
        );
      }
      if (porNombre.has(nombre)) {
        throw new BadRequestException(`El archivo ${nombre} llegó más de una vez`);
      }
      if (!file.buffer?.length) {
        throw new BadRequestException(`El archivo ${nombre} llegó vacío`);
      }

      porNombre.set(nombre, file);
    }

    const faltantes = MeddraArchivosUtils.faltantes(
      [...porNombre.keys()],
      MeddraArchivosUtils.ARCHIVOS_A_PROCESAR,
    );
    if (faltantes.length) {
      throw new BadRequestException(`Faltan archivos obligatorios: ${faltantes.join(', ')}`);
    }

    return porNombre;
  }

  /**
   * Comprueba contra el manifiesto que el ZIP era una distribución completa.
   *
   * El manifiesto lo escribe el cliente, así que un llamador que use curl podría
   * mentir. No es el caso de uso que esto protege: lo que evita es que un ZIP
   * incompleto o equivocado —el de otro producto, o uno al que le falta media
   * jerarquía— entre en la base sin que nadie lo note.
   */
  private validarManifiesto(manifiestoCrudo: string): void {
    let nombres: string[];

    try {
      const parseado = JSON.parse(manifiestoCrudo);
      if (!Array.isArray(parseado)) throw new Error('no es un array');
      nombres = parseado.map((n) => MeddraArchivosUtils.nombreBase(String(n)));
    } catch (error) {
      throw new BadRequestException(
        `El manifiesto no es un JSON válido: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const faltantes = MeddraArchivosUtils.faltantes(nombres);
    if (faltantes.length) {
      throw new BadRequestException(
        `El ZIP no tiene la estructura esperada de MedDRA. Faltan: ${faltantes.join(', ')}`,
      );
    }

    const desconocidos = MeddraArchivosUtils.desconocidos(nombres);
    if (desconocidos.length) {
      throw new BadRequestException(
        `El ZIP contiene archivos .asc que no pertenecen a una distribución MedDRA: ${desconocidos.join(', ')}`,
      );
    }

    const duplicados = MeddraArchivosUtils.duplicados(nombres);
    if (duplicados.length) {
      throw new BadRequestException(
        `El ZIP trae el mismo archivo en más de una carpeta: ${duplicados.join(', ')}`,
      );
    }
  }

  /**
   * Contrasta versión e idioma con el sello del propio ZIP.
   *
   * Es lo único de toda la carga que el servidor puede verificar por sí mismo, y es
   * justo lo que más daño hace si se equivoca: cargar la versión en inglés bajo la
   * etiqueta ES deja el diccionario en un idioma que nadie espera y no hay forma de
   * distinguirlo después mirando las tablas.
   */
  private validarRelease(archivos: Map<string, Express.Multer.File>, dto: CargarVersionReqDTO): void {
    const contenido = archivos.get('meddra_release.asc').buffer.toString('latin1');
    const release = MeddraArchivosUtils.leerRelease(contenido);

    if (!release) {
      throw new BadRequestException(
        'meddra_release.asc no tiene el formato esperado (ej. "28.0$Spanish$$$$"); ' +
          'el ZIP no parece una distribución de MedDRA',
      );
    }

    if (!MeddraArchivosUtils.versionCoincide(dto.version, release.version)) {
      throw new BadRequestException(
        `El ZIP corresponde a la versión ${release.version}, no a la ${dto.version} seleccionada`,
      );
    }

    if (release.idioma && release.idioma !== dto.lang.toUpperCase()) {
      throw new BadRequestException(
        `El ZIP está en ${release.idioma}, no en ${dto.lang.toUpperCase()} como se seleccionó`,
      );
    }
  }
}
