import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IntegratorModule } from '../integrator/integrator.module';
import { BatchService } from './services/batch.service';
import { VigiflowIntegradorService } from 'src/vigiflow-integrator/service/vigiflow-integrador.service';
import { VigiflowIntegratorModule } from 'src/vigiflow-integrator/vigiflow-integrator.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    IntegratorModule,
    
  ],
  providers: [BatchService],
  controllers: [],
})
export class ScheduleModule {}
