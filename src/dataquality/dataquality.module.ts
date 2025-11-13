import { Module } from '@nestjs/common';
import { DataqualityService } from './dataquality.service';
import { DataqualityController } from './dataquality.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableCompleteness } from './entities/table-completeness.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
        entities: ['dist/**/dataquality/entities/*.entity{.ts,.js}'],
        synchronize: configService.get('ENV') === 'DEV',
        poolSize: 5,
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([TableCompleteness], DATAQUALITY_DS),
  ],
  controllers: [DataqualityController],
  providers: [DataqualityService],
})
export class DataqualityModule {}
