import {
  Body,
  Controller,
  FileTypeValidator,
  HttpException,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { KeycloakAuthGuard } from '../../common/guards/keycloak-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ProcessVersionReqDTO } from '../models/dto';
import { MeddraProcessFilesService } from '../services/meddra-process.service';
/**
 * Controlador para procesar los archivos de meddra
 */
@ApiTags('MedDra Versionamiento')
@Controller({ path: 'meddra/version', version: '1' })
export class MeddraVersionController {
  constructor(private readonly meddraProcessFilesService: MeddraProcessFilesService) {}

  @ApiOperation({
    summary: 'Procesar archivos de versión de MedDRA',
    description: 'Procesa los archivos de versión de MedDRA',
  })
  @Post('process')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('keycloak-jwt')
  async processVersionFiles(@Body() processsVersionReqDto: ProcessVersionReqDTO): Promise<any[]> {
    const { version, lang } = processsVersionReqDto;
    try {
      return this.meddraProcessFilesService.processVersionFiles(
        version,
        lang,
        'ActualizaciÓN SIN DESCRIPCION',
      );
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('upload')
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000 }),
          new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    console.log(file);
  }
}
