import {HttpModule} from '@nestjs/axios';
import {Module} from '@nestjs/common';
import {ConfigModule,ConfigService} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';
import {IntegratorModule} from 'src/integrator/integrator.module';
import {SettingsModule} from 'src/settings/settings.module';
import {dataSourceFactory} from 'src/utils/ensure-schemas.util';
import {MeddraBusquedaController} from './controllers/meddra.busqueda.controller';
import {MeddraController} from './controllers/meddra.controller';
import {MeddraLltController} from './controllers/meddra.llt.controller';
import {MeddraPtController} from './controllers/meddra.pt.controller';
import {MeddraSocController} from './controllers/meddra.soc.controller';
import {MeddraVersionController} from './controllers/meddra.version.controller';
import {cie10Meddra} from './models/mapping/cie19meddra.entity';
import {MappingDefinition} from './models/mapping/mappingDefinition.entity';
import {Mappings} from './models/mapping/mappings.entity';
import {MeddraQuery} from './models/meddraquerys.entity';
import {CIE10ES} from './models/standar/cie_10_meddra.entity';
import {LLT} from './models/standar/llt.entity';
import {PT} from './models/standar/pt.entity';
import {SOC} from './models/standar/soc.entity';
import {MeddraBusquedaService} from './services/meddra-busqueda.service';
import {MeddraClientService} from './services/meddra-client.service';
import {MeddraHistoryService} from './services/meddra-history.service';
import {MeddraLLTService} from './services/meddra-lt.service';
import {MeddraProcessFilesService} from './services/meddra-process.service';
import {MeddraPtService} from './services/meddra-pt.service';
import {MeddraSocService} from './services/meddra-soc.service';
import {MeddraStandarService} from './services/meddra-standar.service';

export const MEDDRA_DS = 'MEDDRA';
@Module({
  imports: [
    SettingsModule,
    IntegratorModule,
    TypeOrmModule.forRootAsync({
      name: MEDDRA_DS,
      useFactory: (configService: ConfigService) => ({
        name: MEDDRA_DS,
        type: 'postgres',
        // Misma base que DHI_ESAVI y WHO_DRUG: sólo cambia el esquema. Antes había un
        // juego propio de variables (MDD_DB_*) que duplicaba esta conexión y permitía
        // apuntar el diccionario a una base distinta de la de los datos ESAVI.
        host: configService.get('HOST_DATABASE'),
        port: +configService.get('PORT_DATABASE'),
        username: configService.get('USER_DATABASE'),
        password: configService.get('PASS_DATABASE'),
        database: configService.get('NAME_DATABASE'),
        // Clases explícitas en lugar de globs: 'dist/**/models/*.entity' también
        // capturaba las entidades de WHO_DRUG, y ambos datasources apuntan a la
        // misma base, por lo que los dos sincronizaban las mismas tablas a la vez.
        entities: [MeddraQuery, LLT, PT, SOC, MappingDefinition, Mappings, cie10Meddra, CIE10ES],
        schema: 'MEDDRA',
        synchronize: configService.get<string>('ENV') === 'DEV' ? true : false,
        poolSize: 5,
      }),
      dataSourceFactory: dataSourceFactory(['MEDDRA']),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(
      [MeddraQuery, LLT, PT, SOC, MappingDefinition, Mappings, cie10Meddra, CIE10ES],
      MEDDRA_DS,
    ),
    HttpModule,
  ],
  providers: [
    MeddraClientService,
    MeddraStandarService,
    MeddraHistoryService,
    MeddraProcessFilesService,
    MeddraSocService,
    MeddraPtService,
    MeddraLLTService,
    MeddraBusquedaService,
  ],
  controllers: [
    MeddraController,
    MeddraVersionController,
    MeddraSocController,
    MeddraPtController,
    MeddraLltController,
    MeddraBusquedaController,
  ],
  exports: [MeddraSocService, MeddraPtService, MeddraLLTService, MeddraStandarService],
})
export class MeddraModule {}
