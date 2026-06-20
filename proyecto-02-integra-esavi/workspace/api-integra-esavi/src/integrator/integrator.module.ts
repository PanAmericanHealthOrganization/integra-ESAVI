import {Module} from '@nestjs/common';
import {ConfigModule,ConfigService} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';
import {dataSourceFactory} from 'src/utils/ensure-schemas.util';
import {GacetaController} from './controller';
import {AntecedenteEmbarazoController} from './controller/antecedente-embarazo.controller';
import {CantonController} from './controller/canton.controller';
import {ParroquiaController} from './controller/parroquia.controller';
import {ProvinciaController} from './controller/provincia.controller';
import {AntecedenteEventoController} from './controller/antecedente-evento.controller';
import {AntecedenteMedicoController} from './controller/antecedente-medico.controller';
import {AntecedentePreexistenciaController} from './controller/antecedente-preexistencia.controller';
import {CatalogoPadreController} from './controller/catalogo-padre.controller';
import {DatoEsaviController} from './controller/dato-esavi.controller';
import {DesenlaceEsaviController} from './controller/desenlace-esavi.controller';
import {IntegradorController} from './controller/integrador.controller';
import {InvestigacionController} from './controller/investigacion.controller';
import {NotificacionController} from './controller/notificacion.controller';
import {PacienteEmbarazadaController} from './controller/paciente-embarazada.controller';
import {PacienteVigiflowController} from './controller/paciente-vigiflow.controller';
import {PacienteController} from './controller/paciente.controller';
import {ParametroController} from './controller/parametro.controller';
import {ReporteController} from './controller/reporte.controller';
import {SeedController} from './controller/seed.controller';
import {SyncController} from './controller/sync.controller';
import {VacunometroController} from './controller/vacunometro.controller';
import {Canton} from './entity/canton.entity';
import {Parroquia} from './entity/parroquia.entity';
import {Provincia} from './entity/provincia.entity';
import {CantonService} from './service/canton.service';
import {ParroquiaService} from './service/parroquia.service';
import {ProvinciaService} from './service/provincia.service';
import {
  AntecedenteEmbarazo,
  AntecedenteEvento,
  AntecedenteMedico,
  AntecedentePreexistencia,
  Catalogo,
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
  Paciente,
  PacienteEmbarazada,
  Parametro,
  SyncProcess,
  TipoCatalogo,
  Vacunacion,
  Vacunometro,
} from './entity';
import {CtIcd10meddra} from './entity/ct-icd10meddra.entity';
import {CtSymptom2llt} from './entity/ct-symptom2llt.entity';
import {Establecimiento} from './entity/establecimiento.entity';
import {Investigacion} from './entity/investigacion.entity';
import {WhodrugHomologaVacs} from './entity/whodrug-homologavacs.entity';
import {WhodrugVacsTemp} from './entity/whodrug-vacstemp.entity';
import {IntegradorService} from './facade/integrador.service';
import {
  AntecedenteEmbarazoService,
  AntecedenteEventoService,
  AntecedenteMedicoService,
  AntecedentePreexistenciaService,
  CatalogoPadreService,
  CatalogoService,
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
  PacienteEmbarazadaServive,
  ParametroService,
  ReporteService,
  SeedService,
} from './service';
import {CtIcd10meddraService} from './service/ct-icd10meddra.service';
import {CtSymptom2lltService} from './service/ct-symptom2llt.service';
import {EstablecimientosService} from './service/establecimientos.service';
import {InvestigacionService} from './service/investigacion.service';
import {PacienteService} from './service/paciente.service';
import {SyncService} from './service/sync.service';
import {VacunometroService} from './service/vacunometro.service';
import {WhodrugHomologaVacsService} from './service/whodrug-homologavacs.service';
import {WhodrugVacsTempService} from './service/whodrug-vacstemp.service';

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
        Catalogo,
        Parroquia,
        Provincia,
        CausalidadEsavi,
        CtIcd10meddra,
        CtSymptom2llt,
        WhodrugHomologaVacs,
        WhodrugVacsTemp,
        DatoEsavi,
        DatoVacuna,
        DatoVacunacion,
        DesenlaceEsavi,
        EmbarazoEsavi,
        GravedadEsavi,
        Investigacion,
        Medicamento,
        Notificacion,
        Paciente,
        PacienteEmbarazada,
        Parametro,
        TipoCatalogo,
        Vacunacion,
        Vacunometro,
        SyncProcess,
        Gaceta,
      ],
      POSTGRES_INTEGRATOR_DS,
    ),
  ],
  controllers: [
    AntecedenteEmbarazoController,
    AntecedenteEventoController,
    CantonController,
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
    PacienteEmbarazadaController,
    DatoEsaviController,
    AntecedenteEmbarazoController,
    SeedController,
    VacunometroController,
    SyncController,
    InvestigacionController,
    PacienteController,
    ParametroController,
    GacetaController,
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
    CatalogoService,
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
    PacienteEmbarazadaServive,
    DatoEsaviService,
    AntecedenteEmbarazoService,
    SeedService,
    VacunometroService,
    InvestigacionService,
    CtSymptom2lltService,
    CtIcd10meddraService,
    WhodrugVacsTempService,
    WhodrugHomologaVacsService,
    GacetaService,
  ],
  exports: [
    SyncService,
    IntegradorService,
    CtIcd10meddraService,
    CtSymptom2lltService,
    WhodrugVacsTempService,
    WhodrugHomologaVacsService,
    PacienteService,
    MedicamentoService,
    NotificacionVigiflowService,
    DatoVacunaService,
    ReporteService,
    PacienteEmbarazadaServive,
    DatoEsaviService,
    AntecedenteEmbarazoService,
    VacunometroService,
  ],
})
export class IntegratorModule {}
