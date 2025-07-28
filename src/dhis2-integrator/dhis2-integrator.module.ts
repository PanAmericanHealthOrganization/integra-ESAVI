import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IntegratorModule } from '../integrator/integrator.module';
import { Dhis2IntegratorService } from './services/dhis2-integrator.service';
import { Dhis2IntegradorController } from './controllers/dhis2-integrador.controller';
import { Dhis2DataElementService } from './services/dhis2-data-element.service';
import { Dhis2OptionsService } from './services/dhis2-options.service';
import { Dhis2ProgramStageService } from './services/dhis2-program-stage.service';
import { Dhis2ProgramService } from './services/dhis2-program.service';
import { Dhis2EventsService } from './services/dhis2-events.service';
import { Dhis2AnalyticsService } from './services/dhis2-analytics.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 5,
    }),
    IntegratorModule,
  ],
  providers: [
    Dhis2DataElementService,
    Dhis2IntegratorService,
    Dhis2OptionsService,
    Dhis2ProgramService,
    Dhis2ProgramStageService,
    Dhis2EventsService,
    Dhis2AnalyticsService,
  ],
  controllers: [Dhis2IntegradorController],
})
export class Dhis2IntegratorModule { }
