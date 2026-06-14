import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MeddraModule } from 'src/meddra/meddra.module';
import { WhodrugsModule } from 'src/whodrugs/whodrugs.module';
import { IntegratorModule } from '../integrator/integrator.module';
import { VigiflowIntegradorController } from './controller/vigiflow-integrador.controller';
import { VigiflowCrawlerService } from './service/vigiflow-crawler.service';
import { VigiflowIntegradorService } from './service/vigiflow-integrador.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 300000, // 5 minutos
      maxRedirects: 5,
    }),
    IntegratorModule,
    WhodrugsModule,
    MeddraModule,
  ],
  providers: [VigiflowIntegradorService, VigiflowCrawlerService],
  controllers: [VigiflowIntegradorController],
})
export class VigiflowIntegratorModule {}
