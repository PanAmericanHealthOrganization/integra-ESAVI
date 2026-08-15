import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { Usuario, UsuarioAutenticado } from 'src/common/decorators/usuario.decorator';
import { KeycloakAuthGuard } from 'src/common/guards/keycloak-auth.guard';
import { MensajesService } from '../services/mensajes.service';

class MarcarLeidasDto {
  /** Si no viene, se marcan todas. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}

/**
 * Buzón de notificaciones del usuario autenticado.
 *
 * Todo va contra el `sub` del token, nunca contra un id que llegue por parámetro: un
 * usuario sólo puede ver y tocar su propio buzón, y no hay forma de pedir el de otro.
 */
@ApiTags('Notificaciones')
@ApiBearerAuth('keycloak-jwt')
@UseGuards(KeycloakAuthGuard)
@Controller({ path: 'mensajes', version: '1' })
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  @Get()
  @ApiOperation({
    summary: 'Notificaciones del usuario autenticado',
    description: 'Devuelve el array de notificaciones, de la más reciente a la más antigua.',
  })
  async listar(@Usuario() usuario: UsuarioAutenticado) {
    return this.mensajesService.listar(this.exigirUsuario(usuario).id);
  }

  @Patch('leidas')
  @ApiOperation({
    summary: 'Marcar notificaciones como leídas',
    description: 'Marca las indicadas en `ids`, o todas si no se envía ninguna.',
  })
  async marcarLeidas(@Usuario() usuario: UsuarioAutenticado, @Body() dto: MarcarLeidasDto) {
    const cambiadas = await this.mensajesService.marcarLeidas(
      this.exigirUsuario(usuario).id,
      dto.ids,
    );
    return { cambiadas };
  }

  @Delete('todas')
  @ApiOperation({ summary: 'Vaciar el buzón del usuario autenticado' })
  async limpiar(@Usuario() usuario: UsuarioAutenticado) {
    await this.mensajesService.limpiar(this.exigirUsuario(usuario).id);
    return { ok: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una notificación del buzón' })
  async eliminar(@Usuario() usuario: UsuarioAutenticado, @Param('id') id: string) {
    const eliminada = await this.mensajesService.eliminar(this.exigirUsuario(usuario).id, id);
    return { eliminada };
  }

  /**
   * El guard ya garantiza que hay token, pero no que traiga `sub`. Sin `sub` no hay
   * buzón que consultar, y devolver el de nadie sería peor que fallar.
   */
  private exigirUsuario(usuario: UsuarioAutenticado | null): UsuarioAutenticado {
    if (!usuario) {
      throw new UnauthorizedException('El token no identifica a ningún usuario');
    }
    return usuario;
  }
}
