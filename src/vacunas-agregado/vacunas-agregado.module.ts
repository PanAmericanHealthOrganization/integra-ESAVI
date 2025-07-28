import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VacunasAgregadoController } from './controllers/vacunas-agegado.controller';
import { PoblacionVacunada } from './models/poblacion-vacunada.entity';
import { PoblacionVacunadaService } from './services/poblacion-vacunada.service';
import { WHODRUGS_DS } from 'src/whodrugs/whodrugs.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: WHODRUGS_DS, // a
      useFactory: (configService: ConfigService) => ({
        name: 'vacunas_agregado', // a
        type: 'postgres',
        host: configService.get('WHD_DB_HOST'),
        port: +configService.get('WHD_DB_PORT'),
        username: configService.get('WHD_DB_USER'),
        password: configService.get('WHD_DB_PASS'),
        database: configService.get('WHD_DB_NAME'),
        schema: 'vacunas_agregado', // a
        entities: ['dist/**/models/*.entity{.ts,.js}'],
        synchronize: configService.get('ENV') === 'DEV',
        poolSize: 5,
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([PoblacionVacunada]),
  ],
  controllers: [VacunasAgregadoController],
  providers: [PoblacionVacunadaService],
  exports: [],
})
export class VacunasAgregadoModule {}
