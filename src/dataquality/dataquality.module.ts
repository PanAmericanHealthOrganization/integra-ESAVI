import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataqualityController } from './controllers/dataquality.controller';
import { DataqualityDimensions } from './entities/dataquality.entity';
import { GeneralService } from './services/general.service';
import { CompletenessService } from './services/complees.service';

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
        schema: 'dataquality',
        autoLoadEntities: true,
        synchronize: false,
        poolSize: 5,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([DataqualityDimensions], DATAQUALITY_DS),
  ],
  controllers: [DataqualityController],
  providers: [GeneralService, CompletenessService],
  exports: [GeneralService, CompletenessService],
})
export class DataqualityModule {}
