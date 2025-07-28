import { Module } from '@nestjs/common';
import { VigiflowIntegradorService } from './service/vigiflow-integrador.service';
import { VigiflowIntegradorController } from './controller/vigiflow-integrador.controller';
import { VigiflowCrawlerService } from './service/vigiflow-crawler.service';
import { HttpModule } from '@nestjs/axios';
import { IntegratorModule } from '../integrator/integrator.module';
import { WhodrugsModule } from 'src/whodrugs/whodrugs.module';
import { MeddraModule } from 'src/meddra/meddra.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 100000,
      maxRedirects: 5,
    }),
    IntegratorModule,
    WhodrugsModule,
    MeddraModule
  ],
  providers: [VigiflowIntegradorService, VigiflowCrawlerService],
  controllers: [VigiflowIntegradorController],
})

export class VigiflowIntegratorModule { }
