import {Module} from '@nestjs/common';
import {ConfigModule,ConfigService} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';
import {dataSourceFactory} from 'src/utils/ensure-schemas.util';
import {GacetaController} from './controller';
import {AntecedenteEmbarazoController} from './controller/antecedente-embarazo.controller';
import {AntecedenteEventoController} from './controller/antecedente-evento.controller';
import {AntecedenteMedicoController} from './controller/antecedente-medico.controller';
import {AntecedentePreexistenciaController} from './controller/antecedente-preexistencia.controller';
import {CatalogoPadreController} from './controller/catalogo-padre.controller';
import {DatoEsaviController} from './controller/dato-esavi.controller';
import {DesenlaceEsaviController} from './controller/desenlace-esavi.controller';
import {IntegradorController} from './controller/integrador.controller';
import {InvestigacionController} from './controller/investigacion.controller';
import {NotificacionController} from './controller/notificacion.controller';
import {NotificadorController} from './controller/notificador.controller';
import {PacienteEmbarazadaController} from './controller/paciente-embarazada.controller';
import {PacienteVigiflowController} from './controller/paciente-vigiflow.controller';
import {PacienteController} from './controller/paciente.controller';
import {ParametroController} from './controller/parametro.controller';
import {ReporteController} from './controller/reporte.controller';
import {SeedController} from './controller/seed.controller';
import {SyncController} from './controller/sync.controller';
import {VacunometroController} from './controller/vacunometro.controller';
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
  Notificador,
  Paciente,
  PacienteEmbarazada,
  Parametro,
  SyncProcess,
  TipoCatalogo,
  Vacunacion,
  Vacunometro,
} from './entity';
import {Establecimiento} from './entity/establecimiento.entity';
import {Investigacion} from './entity/investigacion.entity';
import {Homologation} from 'src/homologator/entity/homologation.entity';
import {Homologator} from 'src/homologator/entity/homologator.entity';
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
import {EstablecimientosService} from './service/establecimientos.service';
import {InvestigacionService} from './service/investigacion.service';
import {NotificadorService} from './service/notificador.service';
import {PacienteService} from './service/paciente.service';
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
        CatalogoPadre,
        Establecimiento,
        Catalogo,
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
        PacienteEmbarazada,
        Parametro,
        TipoCatalogo,
        Vacunacion,
        Vacunometro,
        SyncProcess,
        Gaceta,
        Homologator,
        Homologation,
      ],
      POSTGRES_INTEGRATOR_DS,
    ),
  ],
  controllers: [
    AntecedenteEmbarazoController,
    AntecedenteEventoController,
    CatalogoPadreController,
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
    NotificadorController,
  ],
  providers: [
    SyncService,
    CatalogoPadreService,
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
    GacetaService,
    NotificadorService,
  ],
  exports: [
    SyncService,
    IntegradorService,
    PacienteService,
    MedicamentoService,
    NotificacionVigiflowService,
    DatoVacunaService,
    ReporteService,
    PacienteEmbarazadaServive,
    DatoEsaviService,
    AntecedenteEmbarazoService,
    VacunometroService,
    NotificadorService,
  ],
})
export class IntegratorModule {}
