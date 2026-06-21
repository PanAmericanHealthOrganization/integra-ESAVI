import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReglaHomologacionController } from './controller/regla-homologacion.controller';
import { HomologadorController } from './controller/homologador.controller';
import { ReglaHomologacion } from './entity/regla-homologacion.entity';
import { Homologador } from './entity/homologador.entity';
import { ReglaHomologacionService } from './service/regla-homologacion.service';
import { HomologadorService } from './service/homologador.service';
import { ResolutorService } from './service/resolutor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Homologador, ReglaHomologacion], 'POSTGRES_INTEGRATOR_DS'),
  ],
  controllers: [HomologadorController, ReglaHomologacionController],
  providers: [HomologadorService, ReglaHomologacionService, ResolutorService],
  exports: [ResolutorService],
})
export class HomologadorModule {}
