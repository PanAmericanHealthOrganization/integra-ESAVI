import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataqualityMaintenanceController } from './controllers/dataquality-maintenance.controller';
import { DataqualityController } from './controllers/dataquality.controller';
import { DataQualityDimensions } from './entities/dataQualityDimensions.entity';
import { DimConsistenciaService } from './services/dim-consitencia';
import { DimExactitudService } from './services/dim-exactitud.service';
import { GeneralService } from './services/general.service';
import { DataqualityMaintenanceService } from './services/maintenance.service';

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
        synchronize: configService.get<string>('ENV') === 'DEV' ? true : false,
        poolSize: 15,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([DataQualityDimensions], DATAQUALITY_DS),
  ],
  controllers: [DataqualityController, DataqualityMaintenanceController],
  providers: [GeneralService, DimExactitudService, DimConsistenciaService, DataqualityMaintenanceService],
})
export class DataqualityModule {}
