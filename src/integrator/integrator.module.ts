import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GacetaController } from './controller';
import { AntecedenteEmbarazoController } from './controller/antecedente-embarazo.controller';
import { AntecedenteEventoController } from './controller/antecedente-evento.controller';
import { AntecedenteMedicoController } from './controller/antecedente-medico.controller';
import { AntecedentePreexistenciaController } from './controller/antecedente-preexistencia.controller';
import { DatoEsaviController } from './controller/dato-esavi.controller';
import { DesenlaceEsaviController } from './controller/desenlace-esavi.controller';
import { GrupoEtarioController } from './controller/grupo-etario.controller';
import { IntegradorController } from './controller/integrador.controller';
import { InvestigacionController } from './controller/investigacion.controller';
import { NotificacionController } from './controller/notificacion.controller';
import { PacienteDhis2Controller } from './controller/paciente-dhis2.controller';
import { PacienteEmbarazadaController } from './controller/paciente-embarazada.controller';
import { PacienteVigiflowController } from './controller/paciente-vigiflow.controller';
import { PacienteController } from './controller/paciente.controller';
import { ReporteController } from './controller/reporte.controller';
import { SeedController } from './controller/seed.controller';
import { SyncController } from './controller/sync.controller';
import { VacunometroController } from './controller/vacunometro.controller';
import {
  AntecedenteEmbarazo,
  AntecedenteEvento,
  AntecedenteMedico,
  AntecedentePreexistencia,
  Catalogo,
  CausalidadEsavi,
  DatoEsavi,
  DatoVacuna,
  DatoVacunacion,
  DesenlaceEsavi,
  EmbarazoEsavi,
  Gaceta,
  GravedadEsavi,
  GrupoEtario,
  Medicamento,
  Notificacion,
  NotificacionDhis2,
  NotificacionVigiflow,
  Paciente,
  PacienteDhis2,
  PacienteEmbarazada,
  PacienteVigiflow,
  Parametro,
  SyncProcess,
  TipoCatalogo,
  Vacunacion,
  Vacunometro,
} from './entity';
import { Establecimiento } from './entity/establecimiento.entity';
import { Investigacion } from './entity/investigacion.entity';
import { IntegradorService } from './facade/integrador.service';
import {
  AntecedenteEmbarazoService,
  AntecedenteEventoService,
  AntecedenteMedicoService,
  AntecedentePreexistenciaService,
  CatalogoService,
  CausalidadEsaviService,
  DatoEsaviService,
  DatoVacunaService,
  DatoVacunacionService,
  DesenlaceEsaviService,
  EmbarazoEsaviService,
  GacetaService,
  GravedadEsaviService,
  GrupoEtarioService,
  MedicamentoService,
  NotificacionDhis2Service,
  NotificacionService,
  NotificacionVigiflowService,
  PacienteDhis2Service,
  PacienteEmbarazadaServive,
  PacienteVigiflowService,
  ParametroService,
  ReporteService,
  SeedService,
} from './service';
import { EstablecimientosService } from './service/establecimientos.service';
import { InvestigacionService } from './service/investigacion.service';
import { PacienteService } from './service/paciente.service';
import { SyncService } from './service/sync.service';
import { VacunometroService } from './service/vacunometro.service';
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
        synchronize: false,
        poolSize: 5,
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(
      [
        AntecedenteEmbarazo,
        AntecedenteEvento,
        AntecedenteMedico,
        AntecedentePreexistencia,
        Establecimiento,
        Catalogo,
        CausalidadEsavi,
        DatoEsavi,
        DatoVacuna,
        DatoVacunacion,
        DesenlaceEsavi,
        EmbarazoEsavi,
        GravedadEsavi,
        GrupoEtario,
        Investigacion,
        Medicamento,
        Notificacion,
        NotificacionVigiflow,
        NotificacionDhis2,
        Paciente,
        PacienteVigiflow,
        PacienteDhis2,
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
    AntecedenteMedicoController,
    AntecedentePreexistenciaController,
    DatoEsaviController,
    DesenlaceEsaviController,
    IntegradorController,
    PacienteVigiflowController,
    PacienteDhis2Controller,
    NotificacionController,
    ReporteController,
    PacienteEmbarazadaController,
    DatoEsaviController,
    AntecedenteEmbarazoController,
    SeedController,
    VacunometroController,
    GrupoEtarioController,
    SyncController,
    InvestigacionController,
    PacienteController,
    GacetaController,
  ],
  providers: [
    SyncService,
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
    GrupoEtarioService,
    MedicamentoService,
    NotificacionService,
    NotificacionDhis2Service,
    NotificacionVigiflowService,
    PacienteDhis2Service,
    PacienteVigiflowService,
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
  ],
  exports: [
    SyncService,
    IntegradorService,
    PacienteVigiflowService,
    PacienteDhis2Service,
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
