import {HttpModule} from '@nestjs/axios';
import {Module} from '@nestjs/common';
import {ConfigModule,ConfigService} from '@nestjs/config';
import {ScheduleModule} from '@nestjs/schedule';
import {TypeOrmModule} from '@nestjs/typeorm';
import {IntegratorModule} from 'src/integrator/integrator.module';
import {SettingsModule} from 'src/settings/settings.module';
import {dataSourceFactory} from 'src/utils/ensure-schemas.util';
import {ActiveIngredientController} from './controllers/activeingredents.controller';
import {MaholderController} from './controllers/maholder.controller';
import {WhodrugsController} from './controllers/whodrugs.controller';
import {WhodrugsSyncController} from './controllers/whodrugs.sync.controller';
import {ActiveIngredient} from './models/activeIngredient.entity';
import {AnatomicalTherapeuticChemical} from './models/atomicTerapeutalChemical.entity';
import {CountryOfSale} from './models/countryOfSale.entity';
import {Drug} from './models/drug.entity';
import {DrugSync} from './models/drugSync.entity';
import {IngredientTranslation} from './models/ingredientTranslation.entity';
import {Maholder} from './models/maholder.entity';
import {ActiveIngredientsService} from './services/activeIngredients.service';
import {AnatomicalTherapeuticChemicalService} from './services/anatomicalTherapeuticChemical.service';
import {CountryOfSaleService} from './services/countryofsale.service';
import {DrugService} from './services/drugs.service';
import {IngredientTranslationService} from './services/ingredientsTraslations.service';
import {MaholderService} from './services/maholder.service';
import {WhoDrugsAsAnyService} from './services/whodrugasany.service';
import {WhoDrugsClientService} from './services/whodrugs-client.service';
import {WhoDrugsSyncService} from './services/whodrugs-sync.service';

export const WHODRUGS_DS = 'WHO_DRUG';

@Module({
  imports: [
    SettingsModule,
    IntegratorModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      name: WHODRUGS_DS, // a
      useFactory: (configService: ConfigService) => ({
        name: WHODRUGS_DS, // a
        type: 'postgres',
        host: configService.get('WHD_DB_HOST'),
        port: +configService.get('WHD_DB_PORT'),
        username: configService.get('WHD_DB_USER'),
        password: configService.get('WHD_DB_PASS'),
        database: configService.get('WHD_DB_NAME'),
        schema: 'WHO_DRUG',
        // Clases explícitas en lugar de globs: 'dist/**/models/*.entity' también
        // capturaba entidades de MEDDRA, y ambos datasources apuntan a la misma
        // base, por lo que los dos sincronizaban las mismas tablas a la vez.
        entities: [
          DrugSync,
          Drug,
          ActiveIngredient,
          IngredientTranslation,
          AnatomicalTherapeuticChemical,
          CountryOfSale,
          Maholder,
        ],
        synchronize: configService.get<string>('ENV') === 'DEV',
        poolSize: 5,
      }),
      dataSourceFactory: dataSourceFactory(['WHO_DRUG']),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(
      [DrugSync, Drug, ActiveIngredient, IngredientTranslation, AnatomicalTherapeuticChemical, CountryOfSale, Maholder],
      WHODRUGS_DS,
    ),
    HttpModule.register({
      timeout: 120000,
      maxRedirects: 5,
      // se agrega infinity por el crecimiento del archivo
      maxContentLength: Infinity,
      withCredentials: true,
      // baseURL (WHD_API_URL) y 'umc-license-key'/'umc-client-key' no se fijan aquí:
      // dependen de TC_PARAMETRO (vía ParametroService), que aún no tiene datos
      // sembrados en el momento en que Nest construye este cliente HTTP (el seed
      // corre en onApplicationBootstrap, después de instanciar todos los providers).
      // Se agregan por request en WhoDrugsClientService, que sí puede esperar
      // (await) al ParametroService.
    }),
  ],
  providers: [
    ActiveIngredientsService,
    AnatomicalTherapeuticChemicalService,
    CountryOfSaleService,
    DrugService,
    IngredientTranslationService,
    MaholderService,
    WhoDrugsClientService,
    WhoDrugsSyncService,
    WhoDrugsAsAnyService,
  ],
  controllers: [WhodrugsController, WhodrugsSyncController, MaholderController, ActiveIngredientController],
  exports: [ActiveIngredientsService, MaholderService, DrugService, IngredientTranslationService],
})
export class WhodrugsModule {}
