import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AntecedenteEmbarazoController } from './controller/antecedente-embarazo.controller';
import { AntecedenteEventoController } from './controller/antecedente-evento.controller';
import { AntecedenteMedicoController } from './controller/antecedente-medico.controller';
import { AntecedentePreexistenciaController } from './controller/antecedente-preexistencia.controller';
import { DatoEsaviController } from './controller/dato-esavi.controller';
import { DesenlaceEsaviController } from './controller/desenlace-esavi.controller';
import { IntegradorController } from './controller/integrador.controller';
import { NotificacionController } from './controller/notificacion.controller';
import { PacienteDhis2Controller } from './controller/paciente-dhis2.controller';
import { PacienteEmbarazadaController } from './controller/paciente-embarazada.controller';
import { PacienteVigiflowController } from './controller/paciente-vigiflow.controller';
import { ReporteController } from './controller/reporte.controller';
import { SeedController } from './controller/seed.controller';
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
  GravedadEsaviService,
  GrupoEtarioService,
  MedicamentoService,
  NotificacionService,
  NotificacionDhis2Service,
  NotificacionVigiflowService,
  PacienteDhis2Service,
  PacienteEmbarazadaServive,
  PacienteVigiflowService,
  ParametroService,
  ReporteService,
  SeedService,
} from './service';
import { VacunometroService } from './service/vacunometro.service';
import { IntegradorService } from './facade/integrador.service';
import {
  AntecedenteEmbarazo,
  DatoVacuna,
  DatoVacunacion,
  DesenlaceEsavi,
  EmbarazoEsavi,
  GravedadEsavi,
  GrupoEtario,
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
  AntecedenteEvento,
  AntecedenteMedico,
  AntecedentePreexistencia,
  Catalogo,
  CausalidadEsavi,
  DatoEsavi,
  SyncProcess,
} from './entity';
import { SyncService } from './service/sycn.service';
import { VacunometroController } from './controller/vacunometro.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
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
      GravedadEsavi,
      GrupoEtario,
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
    ]),
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
    // GrupoEtarioController
  ],
  providers: [
    SyncService,
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
    GravedadEsaviService,
    GrupoEtarioService,
    MedicamentoService,
    NotificacionService,
    NotificacionDhis2Service,
    NotificacionVigiflowService,
    PacienteDhis2Service,
    PacienteVigiflowService,
    ParametroService,
    IntegradorService,
    ReporteService,
    PacienteEmbarazadaServive,
    DatoEsaviService,
    AntecedenteEmbarazoService,
    SeedService,
    VacunometroService,
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
