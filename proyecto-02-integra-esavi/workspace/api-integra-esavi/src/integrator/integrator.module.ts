import {Module} from '@nestjs/common';
import {ConfigModule,ConfigService} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Homologador} from 'src/homologator/entity/homologador.entity';
import {ReglaHomologacion} from 'src/homologator/entity/regla-homologacion.entity';
import {HomologadorModule} from 'src/homologator/homologador.module';
import {dataSourceFactory} from 'src/utils/ensure-schemas.util';
import {GacetaController} from './controller';
import {AntecedenteEmbarazoController} from './controller/antecedente-embarazo.controller';
import {AntecedenteEventoController} from './controller/antecedente-evento.controller';
import {AntecedenteMedicoController} from './controller/antecedente-medico.controller';
import {AntecedentePreexistenciaController} from './controller/antecedente-preexistencia.controller';
import {CantonController} from './controller/canton.controller';
import {CatalogoPadreController} from './controller/catalogo-padre.controller';
import {DatoEsaviController} from './controller/dato-esavi.controller';
import {DesenlaceEsaviController} from './controller/desenlace-esavi.controller';
import {EstablecimientoController} from './controller/establecimiento.controller';
import {IntegradorController} from './controller/integrador.controller';
import {InvestigacionController} from './controller/investigacion.controller';
import {NotificacionController} from './controller/notificacion.controller';
import {NotificadorController} from './controller/notificador.controller';
import {PacienteVigiflowController} from './controller/paciente-vigiflow.controller';
import {PacienteController} from './controller/paciente.controller';
import {ParametroController} from './controller/parametro.controller';
import {ParroquiaController} from './controller/parroquia.controller';
import {ProvinciaController} from './controller/provincia.controller';
import {ReporteController} from './controller/reporte.controller';
import {SeedController} from './controller/seed.controller';
import {SyncController} from './controller/sync.controller';
import {VacunometroController} from './controller/vacunometro.controller';
import {
  AntecedenteEmbarazo,
  AntecedenteEvento,
  AntecedenteMedico,
  AntecedentePreexistencia,
  CatalogoPadre,
  CausalidadEsavi,
  DatoEsavi,
  DatoVacuna,
  DatoVacunacion,
  DesenlaceEsavi,
  EmbarazoEsavi,
  Gaceta,
  GravedadEsavi,
  Medicamento,
  Notificacion,
  Notificador,
  Paciente,
  Parametro,
  SyncProcess,
  Vacunometro,
} from './entity';
import {Canton} from './entity/canton.entity';
import {Establecimiento} from './entity/establecimiento.entity';
import {Investigacion} from './entity/investigacion.entity';
import {Parroquia} from './entity/parroquia.entity';
import {Provincia} from './entity/provincia.entity';
import {IntegradorService} from './facade/integrador.service';
import {
  AntecedenteEmbarazoService,
  AntecedenteEventoService,
  AntecedenteMedicoService,
  AntecedentePreexistenciaService,
  CatalogoPadreService,
  CausalidadEsaviService,
  DatoEsaviService,
  DatoVacunaService,
  DatoVacunacionService,
  DesenlaceEsaviService,
  EmbarazoEsaviService,
  GacetaService,
  GravedadEsaviService,
  MedicamentoService,
  NotificacionDhis2Service,
  NotificacionService,
  NotificacionVigiflowService,
  ParametroService,
  ReporteService,
  SeedService,
} from './service';
import {CantonService} from './service/canton.service';
import {EstablecimientosService} from './service/establecimientos.service';
import {Icd10MeddraService} from './service/icd10-meddra.service';
import {InvestigacionService} from './service/investigacion.service';
import {NotificadorService} from './service/notificador.service';
import {PacienteService} from './service/paciente.service';
import {ParroquiaService} from './service/parroquia.service';
import {ProvinciaService} from './service/provincia.service';
import {SyncService} from './service/sync.service';
import {VacunometroService} from './service/vacunometro.service';

const POSTGRES_INTEGRATOR_DS = 'POSTGRES_INTEGRATOR_DS';
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: POSTGRES_INTEGRATOR_DS,
      useFactory: (configService: ConfigService) => ({
        name: POSTGRES_INTEGRATOR_DS,
        type: 'postgres',
        host: configService.get('HOST_DATABASE'),
        port: +configService.get('PORT_DATABASE'),
        username: configService.get('USER_DATABASE'),
        password: configService.get('PASS_DATABASE'),
        database: configService.get('NAME_DATABASE'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('ENV') === 'DEV' ? true : false,
        poolSize: 5,
      }),
      dataSourceFactory: dataSourceFactory(['DHI_ESAVI']),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(
      [
        AntecedenteEmbarazo,
        AntecedenteEvento,
        AntecedenteMedico,
        AntecedentePreexistencia,
        Canton,
        CatalogoPadre,
        Establecimiento,
        Parroquia,
        Provincia,
        CausalidadEsavi,
        DatoEsavi,
        DatoVacuna,
        DatoVacunacion,
        DesenlaceEsavi,
        EmbarazoEsavi,
        GravedadEsavi,
        Investigacion,
        Medicamento,
        Notificacion,
        Notificador,
        Paciente,
        Parametro,
        Vacunometro,
        SyncProcess,
        Gaceta,
        Homologador,
        ReglaHomologacion,
      ],
      POSTGRES_INTEGRATOR_DS,
    ),
    HomologadorModule,
  ],
  controllers: [
    AntecedenteEmbarazoController,
    AntecedenteEventoController,
    CantonController,
    EstablecimientoController,
    CatalogoPadreController,
    ParroquiaController,
    ProvinciaController,
    AntecedenteMedicoController,
    AntecedentePreexistenciaController,
    DatoEsaviController,
    DesenlaceEsaviController,
    IntegradorController,
    PacienteVigiflowController,
    NotificacionController,
    ReporteController,
    DatoEsaviController,
    AntecedenteEmbarazoController,
    SeedController,
    VacunometroController,
    SyncController,
    InvestigacionController,
    PacienteController,
    ParametroController,
    GacetaController,
    NotificadorController,
  ],
  providers: [
    SyncService,
    CantonService,
    CatalogoPadreService,
    ParroquiaService,
    ProvinciaService,
    AntecedenteEmbarazoService,
    AntecedenteEventoService,
    AntecedenteMedicoService,
    AntecedentePreexistenciaService,
    EstablecimientosService,
    CausalidadEsaviService,
    DatoEsaviService,
    DatoVacunaService,
    DatoVacunacionService,
    DesenlaceEsaviService,
    EmbarazoEsaviService,
    GravedadEsaviService,
    MedicamentoService,
    NotificacionService,
    NotificacionDhis2Service,
    NotificacionVigiflowService,
    PacienteService,
    ParametroService,
    IntegradorService,
    ReporteService,
    DatoEsaviService,
    AntecedenteEmbarazoService,
    SeedService,
    VacunometroService,
    InvestigacionService,
    GacetaService,
    NotificadorService,
    Icd10MeddraService,
  ],
  exports: [
    SyncService,
    IntegradorService,
    PacienteService,
    MedicamentoService,
    NotificacionVigiflowService,
    EmbarazoEsaviService,
    DesenlaceEsaviService,
    GravedadEsaviService,
    DatoVacunaService,
    DatoVacunacionService,
    ReporteService,
    DatoEsaviService,
    AntecedenteEmbarazoService,
    VacunometroService,
    NotificadorService,
    EstablecimientosService,
    Icd10MeddraService,
    ParametroService,
  ],
})
export class IntegratorModule {}
