import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import 'reflect-metadata';
import { Dhis2IntegratorModule } from './dhis2-integrator/dhis2-integrator.module';
import { AntecedenteEmbarazo } from './integrator/entity/antecedente-embarazo.entity';
import { AntecedenteEvento } from './integrator/entity/antecedente-evento.entity';
import { AntecedenteMedico } from './integrator/entity/antecedente-medico.entity';
import { AntecedentePreexistencia } from './integrator/entity/antecedente-preexistencia.entity';
import { Catalogo } from './integrator/entity/catalogo.entity';
import { CausalidadEsavi } from './integrator/entity/causalidad-esavi.entity';
import { DatoEsavi } from './integrator/entity/dato-esavi.entity';
import { DatoVacuna } from './integrator/entity/dato-vacuna.entity';
import { DatoVacunacion } from './integrator/entity/dato-vacunacion.entity';
import { DesenlaceEsavi } from './integrator/entity/desenlace-esavi.entity';
import { EmbarazoEsavi } from './integrator/entity/embarazo-esavi.entity';
import { GravedadEsavi } from './integrator/entity/gravedad-esavi.entity';
import { GrupoEtario } from './integrator/entity/grupo-etario.entity';
import { Medicamento } from './integrator/entity/medicamento.entity';
import { NotificacionDhis2 } from './integrator/entity/notificacion-dhis2.entity';
import { NotificacionVigiflow } from './integrator/entity/notificacion-vigiflow.entity';
import { Notificacion } from './integrator/entity/notificacion.entity';
import { PacienteDhis2 } from './integrator/entity/paciente-dhis2.entity';
import { PacienteEmbarazada } from './integrator/entity/paciente-embarazada.entity';
import { PacienteVigiflow } from './integrator/entity/paciente-vigiflow.entity';
import { Paciente } from './integrator/entity/paciente.entity';
import { Parametro } from './integrator/entity/parametro.entity';
import { TipoCatalogo } from './integrator/entity/tipo-catalogo.entity';
import { Vacunacion } from './integrator/entity/vacunacion.entity';
import { Vacunometro } from './integrator/entity/vacunometro.entity';
import { IntegratorModule } from './integrator/integrator.module';
import { MeddraModule } from './meddra/meddra.module';
import { HttpExceptionFilter } from './providers/http-exception.filter';
import { HeaderApiKeyStrategy } from './strategy/header-api-key.strategy';
import { VacunacionIntegratorModule } from './vacunacion-integrator/vacunacion-integrator.module';
import { VigiflowIntegratorModule } from './vigiflow-integrator/vigiflow-integrator.module';
import { WhodrugsModule } from './whodrugs/whodrugs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: `.${process.env.NODE_ENV}.env`,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.HOST_DATABASE,
      port: Number(process.env.PORT_DATABASE),
      username: process.env.USER_DATABASE,
      password: process.env.PASS_DATABASE,
      database: process.env.NAME_DATABASE,
      schema: process.env.SCHEMA_DATABASE,

      entities: [
        AntecedenteEvento,
        AntecedenteEmbarazo,
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
        NotificacionDhis2,
        NotificacionVigiflow,
        Paciente,
        PacienteVigiflow,
        PacienteDhis2,
        PacienteEmbarazada,
        Parametro,
        TipoCatalogo,
        Vacunacion,
        Vacunometro,
      ],
      retryDelay: Number(process.env.RETRYDELAY_DATABASE),
      retryAttempts: Number(process.env.RETRYATTEMPTS_DATABASE),
      synchronize: true,
    }),
    IntegratorModule,
    Dhis2IntegratorModule,
    VigiflowIntegratorModule,
    VacunacionIntegratorModule.forRoot(),
    WhodrugsModule,
    MeddraModule,
  ],
  providers: [
    HeaderApiKeyStrategy,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
