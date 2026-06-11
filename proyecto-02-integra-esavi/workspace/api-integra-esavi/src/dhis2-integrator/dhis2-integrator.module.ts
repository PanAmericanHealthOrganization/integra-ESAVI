import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { IntegratorModule } from '../integrator/integrator.module';
import { Dhis2IntegradorController } from './controllers/dhis2-integrador.controller';
import { Dhis2AnalyticsService } from './services/dhis2-analytics.service';
import { Dhis2DataElementService } from './services/dhis2-data-element.service';
import { Dhis2DuplicateHandlerService } from './services/dhis2-duplicate-handler.service';
import { Dhis2EventsService } from './services/dhis2-events.service';
import { Dhis2IntegratorService } from './services/dhis2-integrator.service';
import { Dhis2OptionsService } from './services/dhis2-options.service';
import { Dhis2ProcessingLogService } from './services/dhis2-processing-log.service';
import { Dhis2ProgramStageService } from './services/dhis2-program-stage.service';
import { Dhis2ProgramService } from './services/dhis2-program.service';
import { MeddraModule } from 'src/meddra/meddra.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 150000000,
      maxRedirects: 5,
    }),
    IntegratorModule,
    MeddraModule,
  ],
  providers: [
    Dhis2DataElementService,
    Dhis2IntegratorService,
    Dhis2OptionsService,
    Dhis2ProgramService,
    Dhis2ProgramStageService,
    Dhis2EventsService,
    Dhis2AnalyticsService,
    Dhis2ProcessingLogService,
    Dhis2DuplicateHandlerService,
  ],
  controllers: [Dhis2IntegradorController],
})
export class Dhis2IntegratorModule {}
