import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomologationController } from './controller/homologation.controller';
import { HomologatorController } from './controller/homologator.controller';
import { Homologation } from './entity/homologation.entity';
import { Homologator } from './entity/homologator.entity';
import { HomologationService } from './service/homologation.service';
import { HomologatorService } from './service/homologator.service';
import { ResolverService } from './service/resolver.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Homologator, Homologation], 'POSTGRES_INTEGRATOR_DS'),
  ],
  controllers: [HomologatorController, HomologationController],
  providers: [HomologatorService, HomologationService, ResolverService],
  exports: [ResolverService],
})
export class HomologatorModule {}
