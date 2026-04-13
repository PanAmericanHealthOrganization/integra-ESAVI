import {ConfigModule,ConfigService} from '@nestjs/config';
import {Test,TestingModule} from '@nestjs/testing';
import {TypeOrmModule} from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { DataQualityDimensions } from '../../entities/dataQualityDimensions.entity';
import { DimCompletitudService } from '../dim-completitud.service';
import { DimConsistenciaService } from '../dim-consitencia.service';
import { DimExactitudService } from '../dim-exactitud.service';
import { GeneralService } from '../general.service';
// Load env vars manually to ensure they are available for ConfigModule if needed synchronously or for debugging
dotenv.config();

describe('GeneralService (Integration)', () => {
  let service: GeneralService;
  let module: TestingModule;
  const DATAQUALITY_DS = 'DATAQUALITY_DS';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: path.join(process.cwd(), '.env'),
          isGlobal: true,
        }),
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
            synchronize: false, // Do not synchronize in tests usually, unless specific need
          }),
          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([DataQualityDimensions], DATAQUALITY_DS),
      ],
      providers: [GeneralService, DimExactitudService, DimConsistenciaService, DimCompletitudService],
    }).compile();

    service = module.get<GeneralService>(GeneralService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateQualitySumary', () => {
    it('should la evaluación debe ser igual a la validación', async () => {
      // Use a date that is likely to have data or at least runs without error
      const findByCode = async (dimension, code, jsonDataQuality) => {
        for (const item of jsonDataQuality) {
          if (item.dimension === dimension) {
            for (const item2 of item.jsonDimensionQuality) {
              if (item2.codigo === code) {
                return item2;
              }
            }
          }
        }
      };

      const testDate = new Date('2026-01-01 00:00:00');
      try {
        const result = await service.generateQualitySumary(testDate);
        // eliminar el atributo idNotificacionesNoValidos de los elementos en el atributo jsonQuality de la respuesta
        result.jsonQuality.forEach((item) => {
          item.jsonDimensionQuality.forEach((item2) => {
            delete item2.idNotificacionesNoValidos;
            delete item2.regla;
            delete item2.condicion;
          });
        });
        const { jsonQuality } = result;
        // LEER ARCHIVO VALIDACION_2026.JSON
        const filePath = path.join(__dirname, 'validacion_2026.json');
        const processExample = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8', flag: 'r' }));
        const { jsonQuality: jsonQualityExample } = processExample;
        for (const item of jsonQualityExample) {
          for (const item2 of item.jsonDimensionQuality) {
            const value = await findByCode(item.dimension, item2.codigo, jsonQuality);
            if (
              value.totalRegistros !== undefined &&
              value.totalRegistrosValidos !== undefined &&
              value.totalRegistrosInvalidos !== undefined
            ) {
              console.log(
                `${item2.codigo}; ${item.dimension};${item2.subDimension}; ${value.totalRegistros}; ${item2.totalRegistros}; ${value.totalRegistrosValidos}; ${item2.totalRegistrosValidos}; ${value.totalRegistrosInvalidos}; ${item2.totalRegistrosInvalidos}`,
              );
              expect(item2.totalRegistros).toEqual(value.totalRegistros);
              expect(item2.totalRegistrosValidos).toEqual(value.totalRegistrosValidos);
              expect(item2.totalRegistrosInvalidos).toEqual(value.totalRegistrosInvalidos);
            }
          }
        }
      } catch (error) {
        console.error('Error executing generateQualitySumary:', error);
        throw error;
      }
    }, 60000);
  });

  afterAll(async () => {
    await module.close();
  });
});
