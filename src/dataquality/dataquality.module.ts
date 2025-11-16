import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataqualityController } from './controllers/dataquality.controller';
import { CompletenessService } from './services/complees.service';
import { GeneralService } from './services/general.service';
import { SemanticService } from './services/semantic.service';
import { SintacticService } from './services/sintactic.service';
import { DataQualityDimensions } from './entities/dataQualityDimensions.entity';

const DATAQUALITY_DS = 'DATAQUALITY_DS';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      name: DATAQUALITY_DS,
      useFactory: (configService: ConfigService) => ({
        name: DATAQUALITY_DS,
        type: 'postgres',
        host: configService.get('HOST_DATABASE'),
        port: +configService.get('PORT_DATABASE'),
        username: configService.get('USER_DATABASE'),
        password: configService.get('PASS_DATABASE'),
        database: configService.get('NAME_DATABASE'),
        schema: 'dhi_esavi',
        autoLoadEntities: true,
        synchronize: true,
        poolSize: 5,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([DataQualityDimensions], DATAQUALITY_DS),
  ],
  controllers: [DataqualityController],
  providers: [GeneralService, CompletenessService, SintacticService, SemanticService],
  exports: [GeneralService, CompletenessService, SintacticService, SemanticService],
})
export class DataqualityModule {}
