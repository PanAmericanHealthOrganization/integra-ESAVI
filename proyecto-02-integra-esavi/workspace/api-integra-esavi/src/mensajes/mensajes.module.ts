import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajesController } from './controllers/mensajes.controller';
import { Mensaje } from './entity/mensaje.entity';
import { MensajesGateway } from './gateway/mensajes.gateway';
import { MensajesService } from './services/mensajes.service';

/**
 * Notificaciones asíncronas por usuario.
 *
 * No importa `IntegratorModule` aunque use su datasource: `TypeOrmModule.forRoot` deja
 * el DataSource registrado globalmente, así que basta con declarar la entidad aquí. Lo
 * contrario crearía un ciclo, porque es `IntegratorModule` quien consume este módulo
 * para notificar el fin de cada sincronización.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Mensaje], 'POSTGRES_INTEGRATOR_DS')],
  providers: [MensajesService, MensajesGateway],
  controllers: [MensajesController],
  exports: [MensajesService],
})
export class MensajesModule {}
