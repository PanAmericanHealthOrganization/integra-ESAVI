import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { read, utils, WorkBook } from 'xlsx';

// Entidades
import { ISync } from '../dto/sync.dto';
import { IAuditoria, SyncProcess, SyncStatus } from '../entity';
import { Catalogo } from '../entity/catalogo.entity';
import { CausalidadEsavi } from '../entity/causalidad-esavi.entity';
import { DatoEsavi } from '../entity/dato-esavi.entity';
import { DatoVacuna } from '../entity/dato-vacuna.entity';
import { DatoVacunacion } from '../entity/dato-vacunacion.entity';
import { DesenlaceEsavi } from '../entity/desenlace-esavi.entity';
import { GravedadEsavi } from '../entity/gravedad-esavi.entity';
import { CreateGrupoEtarioDto, GrupoEtario } from '../entity/grupo-etario.entity';
import { Medicamento } from '../entity/medicamento.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { Paciente } from '../entity/paciente.entity';
import { TipoCatalogo } from '../entity/tipo-catalogo.entity';
import { CreateCtIcd10meddraDto, CtIcd10meddra } from '../entity/ct-icd10meddra.entity';
import { CreateCtSymptom2lltDto, CtSymptom2llt } from '../entity/ct-symptom2llt.entity';
import { CreateWhodrugHomologaVacsDto, WhodrugHomologaVacs } from '../entity/whodrug-homologavacs.entity';
import { CreateWhodrugVacsTempDto, WhodrugVacsTemp } from '../entity/whodrug-vacstemp.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);
  constructor(
    @InjectRepository(TipoCatalogo, 'POSTGRES_INTEGRATOR_DS')
    private tipoCatalogoRepository: Repository<TipoCatalogo>,
    @InjectRepository(Catalogo, 'POSTGRES_INTEGRATOR_DS')
    private catalogoRepository: Repository<Catalogo>,
    @InjectRepository(CtIcd10meddra, 'POSTGRES_INTEGRATOR_DS')
    private ctIcd10meddraRepository: Repository<CtIcd10meddra>,
    @InjectRepository(CtSymptom2llt, 'POSTGRES_INTEGRATOR_DS')
    private ctSymptom2lltRepository: Repository<CtSymptom2llt>,
    @InjectRepository(WhodrugHomologaVacs, 'POSTGRES_INTEGRATOR_DS')
    private whodrugHomologaVacsRepository: Repository<WhodrugHomologaVacs>,
    @InjectRepository(WhodrugVacsTemp, 'POSTGRES_INTEGRATOR_DS')
    private whodrugVacsTempRepository: Repository<WhodrugVacsTemp>,
    @InjectRepository(GrupoEtario, 'POSTGRES_INTEGRATOR_DS')
    private grupoEtarioRepository: Repository<GrupoEtario>,
    @InjectRepository(Paciente, 'POSTGRES_INTEGRATOR_DS')
    private pacienteRepository: Repository<Paciente>,
    @InjectRepository(Notificacion, 'POSTGRES_INTEGRATOR_DS')
    private notificacionRepository: Repository<Notificacion>,
    @InjectRepository(DatoEsavi, 'POSTGRES_INTEGRATOR_DS')
    private datoEsaviRepository: Repository<DatoEsavi>,
    @InjectRepository(Medicamento, 'POSTGRES_INTEGRATOR_DS')
    private medicamentoRepository: Repository<Medicamento>,
    @InjectRepository(CausalidadEsavi, 'POSTGRES_INTEGRATOR_DS')
    private causalidadEsaviRepository: Repository<CausalidadEsavi>,
    @InjectRepository(GravedadEsavi, 'POSTGRES_INTEGRATOR_DS')
    private gravedadEsaviRepository: Repository<GravedadEsavi>,
    @InjectRepository(DesenlaceEsavi, 'POSTGRES_INTEGRATOR_DS')
    private desenlaceEsaviRepository: Repository<DesenlaceEsavi>,
    @InjectRepository(DatoVacuna, 'POSTGRES_INTEGRATOR_DS')
    private datoVacunaRepository: Repository<DatoVacuna>,
    @InjectRepository(DatoVacunacion, 'POSTGRES_INTEGRATOR_DS')
    private datoVacunacionRepository: Repository<DatoVacunacion>,
    @InjectRepository(SyncProcess, 'POSTGRES_INTEGRATOR_DS')
    private syncProcessRepository: Repository<SyncProcess>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedData();
  }

  async seedData() {
    //console.log('🌱 Iniciando carga de datos de ejemplo...'); // Cuando se cargaban datos fake para pruebas.
    console.log('🌱 Iniciando carga de valores en catálogo de homolgación...');

    const existingCount = await this.tipoCatalogoRepository.count();
    if (existingCount > 0) {
      console.log(`ℹ️ Catálogos ya cargados (${existingCount} tipos de catálogo encontrados). Se omite la carga inicial.`);
      return;
    }

    try {
      // 0. Limpiar datos existentes (opcional)
      await this.cleanData();

      // 1. Crear tipos de catálogo
      await this.seedTiposCatalogo();

      // 2. Crear catálogos
      await this.seedCatalogos();

      // 2.1. Cargar provincias desde CSV
      await this.loadProvinciasFromCSV();

      // 2.2. Cargar cantones desde CSV
      await this.loadCantonesFromCSV();

      // 2.3. Cargar parroquias desde CSV
      await this.loadParroquiasFromCSV();

      // 2.4. Cargar reacciones, diagnósticos o enfermedades desde Excel
      await this.loadIcd10meddraFromExcel();

      // 2.5. Cargar síntomas DHIS2 a LLT desde Excel
      await this.loadSymptomToLltFromExcel();

      // 2.6. Cargar WHODrug Vacunas Provisional o Temporal desde Excel
      await this.loadWhodrugVacsTempFromExcel();

      //2.7. Cargar WHODrug Homologación de Vacunas VigiFlow desde Excel
      await this.loadWhodrugHomologacionVfFromExcel();

      // 3. Crear grupos etarios
      await this.seedGruposEtarios();
      //----fin catalogos / registros para homologación---------------------------------------------------------------------------------------------------------
      // 4. Crear pacientes
      /*await this.seedPacientes();

      // 5. Crear notificaciones
      await this.seedNotificaciones();

      // 6. Crear datos ESAVI
      await this.seedDatosEsavi();

      // 7. Crear medicamentos
      await this.seedMedicamentos();

      // 8. Crear causalidades ESAVI
      await this.seedCausalidadesEsavi();

      // 9. Crear gravedades ESAVI
      await this.seedGravedadesEsavi();

      // 10. Crear desenlaces ESAVI
      await this.seedDesenlacesEsavi();

      // 11. Crear datos de vacunas
      await this.seedDatosVacunas();

      // 12. Crear datos de vacunación
      await this.seedDatosVacunacion();
*/

      //await this.createSyncProcess();/// ---VERSIÓN ANTERIOR DE CREACIÓN DE PROCESO DE SINCRONIZACIÓN SIN AUDITORÍA DETALLADA----
      // Finalizar


      //-----------
      console.log('✅ Valores cargados en catálogo de homologación exitosamente');
    } catch (error) {
      console.error('❌ Error al cargar valores en catálogo de homologación:', error);
      throw error;
    }
  }

  async cleanData() {
    console.log('🧹 Limpiando datos existentes con el método "cleanData"...');

    try {
      // Obtener el query runner para ejecutar SQL directo
      const queryRunner = this.datoVacunacionRepository.manager.connection.createQueryRunner();

      // Deshabilitar temporalmente las restricciones de clave foránea
      await queryRunner.query('SET session_replication_role = replica;');

      // Limpiar todas las tablas usando TRUNCATE (más rápido que DELETE)
      await queryRunner.query('TRUNCATE TABLE "dhi_esavi"."TR_DATO_VACUNACION" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "dhi_esavi"."TR_DATO_VACUNA" CASCADE;');

      await queryRunner.query('TRUNCATE TABLE "dhi_esavi"."TR_DESENLACE_ESAVI" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "dhi_esavi"."TR_GRAVEDAD_ESAVI" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "dhi_esavi"."TR_CAUSALIDAD_ESAVI" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "dhi_esavi"."TR_MEDICAMENTO" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "dhi_esavi"."TR_DATOS_ESAVI" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "dhi_esavi"."TR_NOTIFICACION" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "dhi_esavi"."TR_PACIENTE" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "dhi_esavi"."TC_GRUPO_ETARIO" CASCADE;');
      /*
      * 
      await queryRunner.query(
        'TRUNCATE TABLE "dhi_esavi"."TC_CATALOGO" CASCADE;',
      );
      await queryRunner.query(
        'TRUNCATE TABLE "dhi_esavi"."TC_TIPOCATALOGO" CASCADE;',
      );
      */

      // Restaurar las restricciones de clave foránea
      await queryRunner.query('SET session_replication_role = DEFAULT;');

      // Liberar el query runner
      await queryRunner.release();

      console.log('✅ Datos limpiados exitosamente');
    } catch (error) {
      console.error('❌ Error al limpiar datos:', error);
      throw error;
    }
  }

  private async seedTiposCatalogo() {
    await this.runSyncProcess('Carga de Tipos de Catálogo...', async () => {
      console.log('📋 Creando tipos de catálogo...');

      const tiposCatalogo = [
        { codigo: 'SEX', descripcion: 'Sexo' },
        { codigo: 'ETN', descripcion: 'Autoidentificación Étnica' },
        { codigo: 'PRO', descripcion: 'Provincia' },
        { codigo: 'CAN', descripcion: 'Cantón' },
        { codigo: 'PAR', descripcion: 'Parroquia' },
        { codigo: 'UED', descripcion: 'Unidad de Edad' },
        { codigo: 'PRF', descripcion: 'Profesión Notificador' },
        { codigo: 'EST', descripcion: 'Estado Registro' },
        { codigo: 'BOOL-TF', descripcion: 'Tipo de dato booleano verdadero falso' },
        { codigo: 'BOOL-YN', descripcion: 'Tipo de dato booleano Sí No' },
        { codigo: 'BOOL-YNU', descripcion: 'Tipo de dato booleano Sí No Desconocido' },
        { codigo: 'ROL-MED', descripcion: 'Rol del medicamento o vacuna' },
      ];// Algunos catálogos han sido gestionados fuera de este seeders (Catálogo de homologación Principal) por su volumen o complejidad. Por ejemplo: GrupoEtario, ICDF10-MEDDRA, Medicamentos, Vacunas, etc.

      const auditoriaDto: IAuditoria = {
        createdAt: new Date(),
        createdBy: 'System',
        updatedAt: undefined,
        updatedBy: '',
        deletedAt: undefined,
        deletedBy: '',
        isEnabled: true,
        isActive: true,
      };

      for (const tipo of tiposCatalogo) {
        const existing = await this.tipoCatalogoRepository.findOne({
          where: { descripcion: tipo.descripcion },
        });

        if (!existing) {
          await this.tipoCatalogoRepository.save({ ...tipo, ...auditoriaDto } as TipoCatalogo);
        }
      }
    });
  }

  //----------inicio de definición de la creación del proceso de sync (SINCRONIZACIÓN) para registrar la carga de datos en catálogo de homologación--------------------------------------------------------------
  private async createSyncProcess(
    name: string,
    status: SyncStatus,
    message?: string,
    errorMessage?: string,
    errorStack?: string,
    errorTrace?: string,
    createdBy: string = 'System',
    startTime: Date = new Date(),
  ): Promise<ISync> {
    const syncProcess: ISync = {
      id: undefined,
      name,
      status,
      startTime,
      endTime: new Date(),
      message,
      errorMessage,
      errorStack,
      errorTrace,
      createdAt: new Date(),
      createdBy,
      updatedAt: undefined,
      updatedBy: '',
      deletedAt: undefined,
      deletedBy: '',
      isEnabled: true,
      isActive: true,
    };
  
    return await this.syncProcessRepository.save(syncProcess);
  }

  private async runSyncProcess(
    name: string,
    action: () => Promise<void>,
    createdBy: string = 'System',
  ): Promise<void> {
    const startTime = new Date();
  
    try {
      // Registrar inicio con auditoría
      await this.createSyncProcess(
        name,
        SyncStatus.RUNNING,
        `Proceso ${name} iniciado`,
        null,
        null,
        null,
        createdBy,
        startTime,
      );
  
      // Ejecutar la acción principal
      await action();
  
      // Registrar éxito con auditoría
      await this.createSyncProcess(
        name,
        SyncStatus.COMPLETED,
        `Proceso ${name} completado exitosamente`,
        null,
        null,
        null,
        createdBy,
        startTime,
      );
    } catch (error) {
      // Registrar fallo con auditoría
      await this.createSyncProcess(
        name,
        SyncStatus.FAILED,
        null,
        error.message,
        error.stack,
        JSON.stringify(error),
        createdBy,
        startTime,
      );
      throw error;
    }
  }
  
  
  
  /*private async createSyncProcess() {
    const l = [];
    //for (let i = 0; i < 25; i++) {
      console.log('🔄 Creando proceso de sincronización...');
      const syncProcess: ISync = {
        name: 'Data Seeding',
        status: 'COMPLETED',//SyncStatus.COMPLETED,
        startTime: new Date(),
        endTime: new Date(),
        message: 'Proceso de carga de valores en catálogo de homologación, completado exitosamente.',
        errorMessage: null,//'Proceso de carga de valores en catálogo de homologación, completado exitosamente.',
        errorStack: null,
        errorTrace: null,
        id: undefined,
        createdAt: new Date(),
        createdBy: 'System',
        updatedAt: undefined,
        updatedBy: '',
        deletedAt: undefined,
        deletedBy: '',
        isEnabled: true,
        isActive: true,
      };
      l.push(syncProcess);
    //}
    await this.syncProcessRepository.save(l);
  }*/

  // ------fin------ definición de creación de proceso de sincronización-------------------------------------------------------------------------------------------------------------------------------------------------
    
  private async seedCatalogos() {
    await this.runSyncProcess('Carga de otros Catálogos: Sexo, Autoidentificación, Provincias-VigiFlow, Unidad de Edad, etc...', async () => {
      console.log('📚 Creando catálogos...');

      const tiposCatalogo = await this.tipoCatalogoRepository.find();

      const catalogos = [
        // Sexo
        {
          vigiflow: 'Masculino',
          dhis2: 'Hombre',
          homologada: '1',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Sexo'),
        },
        {
          vigiflow: 'Femenino',
          dhis2: 'Mujer',
          homologada: '2',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Sexo'),
        },
        {
          vigiflow: 'Hombre',
          dhis2: 'Hombre',
          homologada: '1',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Sexo'),
        },
        {
          vigiflow: 'Mujer',
          dhis2: 'Mujer',
          homologada: '2',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Sexo'),
        },
        {
          vigiflow: 'Otro',
          dhis2: 'Otro',
          homologada: '3',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Sexo'),
        },


        // Autoidentificación Étnica
        {
          vigiflow: 'Mestizo',
          dhis2: 'Mestizo',
          homologada: 'Mestizo',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Autoidentificación Étnica'),
        },
        {
          vigiflow: 'Indígena',
          dhis2: 'Indigenous',
          homologada: 'Indígena',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Autoidentificación Étnica'),
        },
        {
          vigiflow: 'Afroecuatoriano',
          dhis2: 'Afro-Ecuadorian',
          homologada: 'Afrodescendiente',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Autoidentificación Étnica'),
        },
        {
          vigiflow: 'INDÍGENA',
          dhis2: 'INDÍGENA',
          homologada: 'Indígena',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Autoidentificación Étnica'),
        },
        {
          vigiflow: 'AFROECUATORIANO/A AFRODESCENDIENTE',
          dhis2: 'AFROECUATORIANO/A AFRODESCENDIENTE',
          homologada: 'Afrodescendiente',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Autoidentificación Étnica'),
        },
        {
          vigiflow: 'NEGRO/A',
          dhis2: 'NEGRO/A',
          homologada: 'Negro',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Autoidentificación Étnica'),
        },
        {
          vigiflow: 'MULATO/A',
          dhis2: 'MULATO/A',
          homologada: 'Mulato',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Autoidentificación Étnica'),
        },
        {
          vigiflow: 'MONTUBIO/A',
          dhis2: 'MONTUBIO/A',
          homologada: 'Montubio',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Autoidentificación Étnica'),
        },
        {
          vigiflow: 'MESTIZO/A',
          dhis2: 'MESTIZO/A',
          homologada: 'Mestizo',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Autoidentificación Étnica'),
        },
        {
          vigiflow: 'BLANCO/A',
          dhis2: 'BLANCO/A',
          homologada: 'Blanco',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Autoidentificación Étnica'),
        },
        {
          vigiflow: 'OTROS',
          dhis2: 'OTROS',
          homologada: 'Otros',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Autoidentificación Étnica'),
        },

        // ----------inicio Provincias para VigiFlow -------------
        {
          vigiflow: 'GUAYAS',
          dhis2: 'GUAYAS',
          homologada: 'GUAYAS',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'PICHINCHA',
          dhis2: 'PICHINCHA',
          homologada: 'PICHINCHA',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'CARCHI',
          dhis2: 'CARCHI',
          homologada: 'CARCHI',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'IMBABURA',
          dhis2: 'IMBABURA',
          homologada: 'IMBABURA',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'COTOPAXI',
          dhis2: 'COTOPAXI',
          homologada: 'COTOPAXI',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'EL ORO',
          dhis2: 'EL ORO',
          homologada: 'EL ORO',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'LOJA',
          dhis2: 'LOJA',
          homologada: 'LOJA',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'SANTO DOMINGO DE LOS TSACHILAS',
          dhis2: 'SANTO DOMINGO DE LOS TSACHILAS',
          homologada: 'SANTO DOMINGO DE LOS TSÁCHILAS',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'SANTO DOMINGO DE LOS TSÁCHILAS',
          dhis2: 'SANTO DOMINGO DE LOS TSÁCHILAS',
          homologada: 'SANTO DOMINGO DE LOS TSÁCHILAS',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'MANABI',
          dhis2: 'MANABI',
          homologada: 'MANABÍ',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'MANABÍ',
          dhis2: 'MANABÍ',
          homologada: 'MANABÍ',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'BOLIVAR',
          dhis2: 'BOLIVAR',
          homologada: 'BOLÍVAR',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'BOLÍVAR',
          dhis2: 'BOLÍVAR',
          homologada: 'BOLÍVAR',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'CAÑAR',
          dhis2: 'CAÑAR',
          homologada: 'CAÑAR',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'AZUAY',
          dhis2: 'AZUAY',
          homologada: 'AZUAY',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'ZAMORA CHINCHIPE',
          dhis2: 'ZAMORA CHINCHIPE',
          homologada: 'ZAMORA CHINCHIPE',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'ESMERALDAS',
          dhis2: 'ESMERALDAS',
          homologada: 'ESMERALDAS',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'SUCUMBIOS',
          dhis2: 'SUCUMBIOS',
          homologada: 'SUCUMBÍOS',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'SUCUMBÍOS',
          dhis2: 'SUCUMBÍOS',
          homologada: 'SUCUMBÍOS',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'PASTAZA',
          dhis2: 'PASTAZA',
          homologada: 'PASTAZA',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'GALAPAGOS',
          dhis2: 'GALAPAGOS',
          homologada: 'GALÁPAGOS',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'GALÁPAGOS',
          dhis2: 'GALÁPAGOS',
          homologada: 'GALÁPAGOS',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'LOS RIOS',
          dhis2: 'LOS RIOS',
          homologada: 'LOS RÍOS',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'LOS RÍOS',
          dhis2: 'LOS RÍOS',
          homologada: 'LOS RÍOS',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'TUNGURAHUA',
          dhis2: 'TUNGURAHUA',
          homologada: 'TUNGURAHUA',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'CHIMBORAZO',
          dhis2: 'CHIMBORAZO',
          homologada: 'CHIMBORAZO',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'ORELLANA',
          dhis2: 'ORELLANA',
          homologada: 'ORELLANA',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'SANTA ELENA',
          dhis2: 'SANTA ELENA',
          homologada: 'SANTA ELENA',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'NAPO',
          dhis2: 'NAPO',
          homologada: 'NAPO',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'MORONA SANTIAGO',
          dhis2: 'MORONA SANTIAGO',
          homologada: 'MORONA SANTIAGO',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        {
          vigiflow: 'DESCONOCIDO',
          dhis2: 'DESCONOCIDO',
          homologada: 'DESCONOCIDO',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
        },
        // ----------------------------------------fin Provincias para VigiFlow

        // Estados de Registro
        {
          vigiflow: 'Activo',
          dhis2: 'Active',
          homologada: 'Activo',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Estado Registro'),
        },
        {
          vigiflow: 'Inactivo',
          dhis2: 'Inactive',
          homologada: 'Inactivo',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Estado Registro'),
        },

        //Profesión notificador
        /**
         * const profesiones = [
          'AUXILIAR',
          'ENFERMERA',
          'ESTUDIANTE',
          'FARMACEUTICO',
          'INTERNO',
          'MEDICO',
          'CONSUMIDOR U OTRO PROFESIONAL',
          'OTRO PROFESIONAL DE LA SALUD',
        ];
        */
        {
          vigiflow: 'AUXILIAR',
          dhis2: 'AUXILIAR',
          homologada: 'AUXILIAR',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Profesión Notificador'),
        },
        {
          vigiflow: 'ENFERMERA',
          dhis2: 'ENFERMERA',
          homologada: 'ENFERMERA',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Profesión Notificador'),
        },
        {
          vigiflow: 'ESTUDIANTE',
          dhis2: 'ESTUDIANTE',
          homologada: 'ESTUDIANTE',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Profesión Notificador'),
        },
        {
          vigiflow: 'ESTUDIANTES',
          dhis2: 'ESTUDIANTES',
          homologada: 'ESTUDIANTE',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Profesión Notificador'),
        },
        {
          vigiflow: 'FARMACEUTICO',
          dhis2: 'Pharmacist',
          homologada: 'FARMACEUTICO',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Profesión Notificador'),
        },
        {
          vigiflow: 'INTERNO',
          dhis2: 'INTERNO',
          homologada: 'INTERNO',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Profesión Notificador'),
        },
        {
          vigiflow: 'MEDICO',
          dhis2: 'MEDICO',
          homologada: 'MEDICO',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Profesión Notificador'),
        },
        {
          vigiflow: 'MÉDICO',
          dhis2: 'MÉDICO',
          homologada: 'MEDICO',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Profesión Notificador'),
        },
        {
          vigiflow: 'CONSUMIDOR U OTRO PROFESIONAL',
          dhis2: 'Other professional',
          homologada: 'CONSUMIDOR U OTRO PROFESIONAL',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Profesión Notificador'),
        },
        {
          vigiflow: 'OTRO PROFESIONAL DE LA SALUD',
          dhis2: 'Other health professional',
          homologada: 'OTRO PROFESIONAL DE LA SALUD',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Profesión Notificador'),
        },
        {
          vigiflow: 'OTRO',
          dhis2: 'OTRO',
          homologada: 'OTRO',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Profesión Notificador'),
        },
        {
          vigiflow: 'DESCONOCIDO',
          dhis2: 'DESCONOCIDO',
          homologada: 'DESCONOCIDO',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Profesión Notificador'),
        },

        //Unidad de Edad, o Tipo de edades
        /**
         * const unidadesEdad = [
         * 'AÑOS',
         * 'MESES',
         * 'DÍAS',
         * 'DIAS', //por si acaso alguien lo escribe sin tilde, para la homologación.
         * 'AÑO',
         * 'MES',
         * 'SEMANA',
         * 'DIA',
         * 'HORA',
         * ];
         */
        {
          vigiflow: 'AÑOS',
          dhis2: 'AÑOS',
          homologada: '1',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
        },
        {
          vigiflow: 'MESES',
          dhis2: 'MESES',
          homologada: '2',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
        },
        {
          vigiflow: 'DÍAS',
          dhis2: 'DÍAS',
          homologada: '3',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
        },
        {
          vigiflow: 'DIAS',
          dhis2: 'DIAS',
          homologada: '3',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
        },
        {
          vigiflow: 'DIA',
          dhis2: 'DIA',
          homologada: '3',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
        },
        {
          vigiflow: 'DÍA',
          dhis2: 'DÍA',
          homologada: '3',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
        },
        {
          vigiflow: 'AÑO',
          dhis2: 'AÑO',
          homologada: '1',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
        },
        {
          vigiflow: 'MES',
          dhis2: 'MES',
          homologada: '2',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
        },
        {
          vigiflow: 'SEMANA',
          dhis2: 'SEMANA',
          homologada: '5',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
        },
        {
          vigiflow: 'HORA',
          dhis2: 'HORA',
          homologada: '4',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
        },
        {
          vigiflow: 'true',
          dhis2: 'true',
          homologada: '1',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Tipo de dato booleano verdadero falso'),
        },
        {
          vigiflow: 'false',
          dhis2: 'false',
          homologada: '0',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Tipo de dato booleano verdadero falso'),
        },
        {
          vigiflow: 'Sí',
          dhis2: 'Sí',
          homologada: '1',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Tipo de dato booleano Sí No'),
        },
        {
          vigiflow: 'No',
          dhis2: 'No',
          homologada: '2',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Tipo de dato booleano Sí No'),
        },
        {
          vigiflow: 'Sí',
          dhis2: 'Sí',
          homologada: '1',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Tipo de dato booleano Sí No Desconocido'),
        },
        {
          vigiflow: 'No',
          dhis2: 'No',
          homologada: '0',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Tipo de dato booleano Sí No Desconocido'),
        },
        {
          vigiflow: 'Desconocido', //'Desconocido'
          dhis2: 'Desconocido', //'Desconocido'
          homologada: '2',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Tipo de dato booleano Sí No Desconocido'),
        },
        {
          vigiflow: '', //'Desconocido'
          dhis2: '', //'Desconocido'
          homologada: '2',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Tipo de dato booleano Sí No Desconocido'),
        },
        {
          vigiflow: null, //'Desconocido'
          dhis2: null, //'Desconocido'
          homologada: '2',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Tipo de dato booleano Sí No Desconocido'),
        },

        //----Homologación de roles de medicamentos y vacunas //Falta cubrir los valores NULL. El valor false='0', solo es para el caso de DHIS2. Para las opciones de VigiFlow, ya está definida su propia regla de transformación, en donde la opción "SOSPECHOSO=1" coincide con "true=1" de DHIS2.
        {
          vigiflow: '1', //para no implementar más control de flujo en el servicio, se reutiliza el método de VigiFlow también para DHIS2.
          dhis2: '1',
          homologada: '1',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Rol del medicamento o vacuna'),
        },
        {
          vigiflow: '0', //para no implementar más control de flujo en el servicio, se reutiliza el método de VigiFlow también para DHIS2.
          dhis2: '0',
          homologada: '0',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Rol del medicamento o vacuna'),
        },
        {
          vigiflow: 'SOSPECHOSO',
          dhis2: 'SOSPECHOSO',
          homologada: '1',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Rol del medicamento o vacuna'),
        },
        {
          vigiflow: 'CONCOMITANTE',
          dhis2: 'CONCOMITANTE',
          homologada: '2',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Rol del medicamento o vacuna'),
        },
        {
          vigiflow: 'INTERACTUANTANTE',
          dhis2: 'INTERACTUANTANTE',
          homologada: '2',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Rol del medicamento o vacuna'),
        },
        {
          vigiflow: 'MEDICAMENTO NO ADMINISTRADO',
          dhis2: 'MEDICAMENTO NO ADMINISTRADO',
          homologada: '2',
          tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Rol del medicamento o vacuna'),
        },
      ];

      //------------------Fin de arreglo ("TABLA") de homologación----------------------
      //--------------------------------------------------------------------------------


      const auditoriaCatalogoHomologacionDto: IAuditoria = {
        createdAt: new Date(),
        createdBy: 'System',
        updatedAt: undefined,
        updatedBy: '',
        deletedAt: undefined,
        deletedBy: '',
        isEnabled: true,
        isActive: true,
      };

      for (const catalogo of catalogos) {
        const existing = await this.catalogoRepository.findOne({
          where: {
            vigiflow: catalogo.vigiflow,
            tipoCatalogo: catalogo.tipoCatalogo,
          },
        });

        if (!existing) {
          await this.catalogoRepository.save({
            ...catalogo,
            ...auditoriaCatalogoHomologacionDto,
          } as Catalogo);
        }
      }
    });
  }

  //----carga de catálogo de grupos etarios---------------------------------------------------------------------------------------------------------------------------------
  private async seedGruposEtarios() {
    await this.runSyncProcess('Carga de catálogo de Grupos Etarios según el Ministerio...', async () => {
      console.log('👥 Creando grupos etarios...');

      const auditoriaDto: IAuditoria = {
        createdAt: new Date(),
        createdBy: 'System',
        updatedAt: undefined,
        updatedBy: '',
        deletedAt: undefined,
        deletedBy: '',
        isEnabled: true,
        isActive: true,
      };
      const gruposEtarios: CreateGrupoEtarioDto[] = [
        { inicioEdad: 0, finEdad: 11, unidadEdad: 'MESES', descripcion: 'Menor 1 año', ...auditoriaDto },
        { inicioEdad: 1, finEdad: 4, unidadEdad: 'AÑOS', descripcion: '1 A 4 Años', ...auditoriaDto },
        { inicioEdad: 5, finEdad: 9, unidadEdad: 'AÑOS', descripcion: '5 A 9 Años', ...auditoriaDto },
        { inicioEdad: 10, finEdad: 14, unidadEdad: 'AÑOS', descripcion: '10 A 14 Años', ...auditoriaDto },
        { inicioEdad: 15, finEdad: 19, unidadEdad: 'AÑOS', descripcion: '15 A 19 Años', ...auditoriaDto },
        { inicioEdad: 20, finEdad: 64, unidadEdad: 'AÑOS', descripcion: '20 A 64 Años', ...auditoriaDto },
        { inicioEdad: 65, finEdad: 120, unidadEdad: 'AÑOS', descripcion: '65 Años y más', ...auditoriaDto },
      ];

      for (const grupo of gruposEtarios) {
        const existing = await this.grupoEtarioRepository.findOne({ // findOne devuelve todo el objeto o "registro con todas sus columnas" que coincide con la condición de where.
          where: { descripcion: grupo.descripcion },
        });

        if (!existing) {
          await this.grupoEtarioRepository.save({ ...grupo, ...auditoriaDto } as GrupoEtario);
        }
      }
    });
  }

  /* //---inicio del semillero de los datos ficticios------------------------------------------------------------------------------------------------------
  
  } //---fin del semillero de los datos ficticios------------------------------------------------------------------------------------------------------
  */
  //--inicio carga de provincias desde CSV------------------------------------------------------------------------------------------------------
  private async loadProvinciasFromCSV() {
    await this.runSyncProcess('Carga de catálogo de provincias del Ecuador, para homologación en DHIS2...', async () => {
      console.log('🗺️ Cargando provincias desde CSV...');

      try {
        const csvPath = path.join(process.cwd(), 'upload_files', 'catalogos-csv', 'provincias_ecuador.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.split('\n').filter((line) => line.trim());

        const tipoProvincia = await this.tipoCatalogoRepository.findOne({
          where: { descripcion: 'Provincia' },
        });

        if (!tipoProvincia) {
          console.error('Tipo de catálogo "Provincia" no encontrado');
          return;
        }

        const auditoria = {
          createdAt: new Date(),
          createdBy: 'System',
          updatedAt: undefined,
          updatedBy: '',
          deletedAt: undefined,
          deletedBy: '',
          isEnabled: true,
          isActive: true,
        };

        for (let i = 1; i < lines.length; i++) {
          // Skip header
          const [vigiflow, dhis2, homologada] = lines[i].split(',').map((col) => col.trim().replace(/"/g, ''));

          if (vigiflow && dhis2 && homologada) {
            const existing = await this.catalogoRepository.findOne({
              where: { vigiflow, tipoCatalogo: tipoProvincia },
            });

            if (!existing) {
              await this.catalogoRepository.save({
                vigiflow,
                dhis2,
                homologada,
                tipoCatalogo: tipoProvincia,
                ...auditoria,
              } as Catalogo);
            }
          }
        }

        console.log('✅ Provincias cargadas desde CSV');
      } catch (error) {
        console.error('❌ Error al cargar provincias desde CSV:', error);
      }
    });
  }
  //--fin carga de provincias desde CSV------------------------------------------------------------------------------------------------------

  //--inicio carga de cantones desde CSV------------------------------------------------------------------------------------------------------
  private async loadCantonesFromCSV() {
    await this.runSyncProcess('Carga de cantones del Ecuador para homologación desde DHIS2...', async () => {
      console.log('🗺️ Cargando cantones desde CSV...');

      try {
        const csvPath = path.join(process.cwd(), 'upload_files', 'catalogos-csv', 'cantones_dhis2_ecuador.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.split('\n').filter((line) => line.trim());

        const tipoCanton = await this.tipoCatalogoRepository.findOne({
          where: { descripcion: 'Cantón' }, // observar que debe ser con tilde.
        });

        if (!tipoCanton) {
          console.error('Tipo de catálogo "Canton" no encontrado');
          return;
        }

        const auditoria = {
          createdAt: new Date(),
          createdBy: 'System',
          updatedAt: undefined,
          updatedBy: '',
          deletedAt: undefined,
          deletedBy: '',
          isEnabled: true,
          isActive: true,
        };

        for (let i = 1; i < lines.length; i++) {
          // Skip header
          const [vigiflow, dhis2, homologada] = lines[i].split(',').map((col) => col.trim().replace(/"/g, ''));

          if (vigiflow && dhis2 && homologada) {
            const existing = await this.catalogoRepository.findOne({
              where: { vigiflow, tipoCatalogo: tipoCanton },
            });

            if (!existing) {
              await this.catalogoRepository.save({
                vigiflow,
                dhis2,
                homologada,
                tipoCatalogo: tipoCanton,
                ...auditoria,
              } as Catalogo);
            }
          }
        }

        console.log('✅ Cantones cargados desde CSV');
      } catch (error) {
        console.error('❌ Error al cargar cantones desde CSV:', error);
      }
    });
  }
  //--fin carga de cantones desde CSV------------------------------------------------------------------------------------------------------

  //--inicio carga de parroquias desde CSV------------------------------------------------------------------------------------------------------
  private async loadParroquiasFromCSV() {
    await this.runSyncProcess('Carga de catálogo de parroquias de Ecuador, para homologación DHIS2...', async () => {
      console.log('🗺️ Cargando parroquias desde CSV...');

      try {
        const csvPath = path.join(process.cwd(), 'upload_files', 'catalogos-csv', 'parroquias_dhis2_ecuador.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');

        // split() separa las líneas de "csvContent", para esto usa el salto de línea '\n', y
        // el resultado es retornado como un arreglo de líneas. Luego,
        // filter() transforma y devuelve un nuevo arreglo según la condición devuelta por
        // la función de devolución de llamada (callback). Esta función flecha, mediante trim()
        // elimina los espacios en blanco al inicio y al final de cada línea,
        // y verifica si la línea no está vacía. Si está vacía, retorna una cadena vacía '', es decir,
        // false (falsy en JavaScript), y filter() la excluye del arreglo final.
        const lines = csvContent.split('\n').filter((line) => line.trim());

        const tipoParroquia = await this.tipoCatalogoRepository.findOne({
          where: { descripcion: 'Parroquia' },
        });

        if (!tipoParroquia) {
          console.error('Tipo de catálogo "Parroquia" no encontrado');
          return;
        }

        const auditoria: IAuditoria = {
          createdAt: new Date(),
          createdBy: 'System',
          updatedAt: undefined,
          updatedBy: 'System',
          deletedAt: undefined,
          deletedBy: 'System',
          isEnabled: true,
          isActive: true,
        };

        for (let i = 1; i < lines.length; i++) {
          // Skip header "i=0"
          /**
           * .split(', ') separa cada línea en columnas, usando la coma seguida de un espacio como delimitador.
           * .map(col => col.trim().replace(/"/g, '')) elimina las comillas dobles de cada columna y
           * luego elimina los espacios en blanco alrededor de cada columna. La iteración por las columnas
           * se realiza mediante la función de devolución de llamada (callback) de map(), por lo que no se
           * requiere un lazo for adicional.
           * Recordar que: map() llama a una función de devolución de llamada, para cada elemento
           * de una matriz y devuelve una matriz que contiene los resultados.
           */
          const [vigiflow, dhis2, homologada] = lines[i].split(',').map((col) => col.trim().replace(/"/g, ''));

          if (vigiflow && dhis2 && homologada) {
            const existing = await this.catalogoRepository.findOne({
              where: { vigiflow, tipoCatalogo: tipoParroquia },
            });

            if (!existing) {
              await this.catalogoRepository.save({
                vigiflow,
                dhis2,
                homologada,
                tipoCatalogo: tipoParroquia,
                ...auditoria,
              } as Catalogo);
            }
          }
        }

        console.log('✅ Parroquias-DHIS2 cargadas desde CSV');
      } catch (error) {
        console.error('❌ Error al cargar parroquias-DHIS2 desde CSV:', error);
      }
    });
  }
  //--fin carga de parroquias desde CSV------------------------------------------------------------------------------------------------------

  //--inicio de la carga del catálogo para el mapeo de ICD-10 MedDRA desde el documento Excel------------------------------------------------------------------------------------------------------
  private async loadIcd10meddraFromExcel() {
    await this.runSyncProcess('Carga de catálogo CIE-10 MedDRA, para el mapeo de ICD-10 MedDRA...', async () => {
      console.log('🗺️ Cargando registros ICD-10 MedDRA desde Excel...');
      try{
        const catalogoIcd10meddra = read(
          await fs.promises.readFile(path.join(process.cwd(), 'upload_files', 'catalogos-excel', 'ICD-10_to_MedDRA_28.0_Map-June2025.xlsx')),
        );
        const ws = catalogoIcd10meddra.Sheets[catalogoIcd10meddra.SheetNames[0]];
        const importRange = 'A3:I11195'; //Rango de datos a importar desde el archivo Excel, excluyendo las filas de encabezado.
        const headers = 'A'; //Fila de encabezados en el archivo Excel.
        const catalogoJson = utils.sheet_to_json(ws, { 
          range: importRange, 
          header: headers,//utils.sheet_to_json(ws, { range: headers, header: 1 })[0] });
        });
        this.logger.log(`📋 Se encontraron ${catalogoJson.length} registros ICD-10 MedDRA en el archivo Excel.`);

        // Usar for...of para esperar que cada operación asíncrona termine
        for (const col of catalogoJson) {
          // TODO: colocar auditoria correcta
          const auditoria: IAuditoria = {
            createdAt: new Date(),
            createdBy: 'System',
            updatedAt: undefined,
            updatedBy: 'System',
            deletedAt: undefined,
            deletedBy: 'System',
            isEnabled: true,
            isActive: true,
          };     
    
          // Create CtICD10MedDRADto object
          const ctIcd10meddra = new CreateCtIcd10meddraDto();
          ctIcd10meddra.icd10ChapterNumber = col['A'];
          ctIcd10meddra.icd10ChapterTitle = col['B'];
          ctIcd10meddra.icd10Code = col['C'];
          ctIcd10meddra.icd10Term = col['D'];
          ctIcd10meddra.meddraLlt = col['E'];
          ctIcd10meddra.meddraLltCode = col['F'];
          ctIcd10meddra.mapAttribute = col['G'];
          ctIcd10meddra.meddraPt = col['H'];
          ctIcd10meddra.meddraPtCode = col['I'];

          const existing =  await this.ctIcd10meddraRepository.findOne({
            where: {
              //icd10ChapterNumber: col['A'],
              //icd10ChapterTitle: col['B'],
              icd10Code: col['C'], //ctIcd10meddra.icd10Code,
              //icd10Term: col['D'],
              //meddraLlt: col['E'],
              meddraLltCode: col['F'], //ctIcd10meddra.meddraLltCode,
              //mapAttribute: col['G'],
              //meddraPt: col['H'],
              //meddraPtCode: col['I'],
            }
          });
          if(!existing){
            await this.ctIcd10meddraRepository.save({ ...ctIcd10meddra, ...auditoria } as CtIcd10meddra);
          }        

        } //--fin del for...of
        const total = await this.ctIcd10meddraRepository.count();
        console.log(`✅ Total de registros ICD-10 MedDRA en la base de datos: ${total}`);
        console.log('✅ Registros ICD-10 MedDRA cargados desde Excel');
      }catch(error){
        console.error('❌ Error al cargar ICD-10 MedDRA desde Excel:', error);
      }    
    });
  }
  //--fin de carga catálogo Excel mapeo de ICD-10 MedDRA------------------------------------------------------------------------------------------------------
  //--inicio de la carga del catálogo para el mapeo de SÍNTOMAS DE DHIS2 a LLT MedDRA desde el documento Excel------------------------------------------------------------------------------------------------------
  private async loadSymptomToLltFromExcel() {
    await this.runSyncProcess('Carga de catálogo SÍNTOMAS DHIS2, para el mapeo a LLT MedDRA...', async () => {
      console.log('🗺️ Cargando registros SÍNTOMAS DHIS2 desde Excel...');
      try{
        const catalogoSymptom2llt = read(
          await fs.promises.readFile(path.join(process.cwd(), 'upload_files', 'catalogos-excel', 'Sintomas-DHIS2_MedDRA-LLT.xlsx')),
        );
        const ws = catalogoSymptom2llt.Sheets[catalogoSymptom2llt.SheetNames[0]];
        const importRange = 'A2:E68'; //Rango de datos a importar desde el archivo Excel, excluyendo las filas de encabezado.
        const headers = 'A'; //Fila de encabezados en el archivo Excel.
        const catalogoJson = utils.sheet_to_json(ws, { 
          range: importRange, 
          header: headers,//utils.sheet_to_json(ws, { range: headers, header: 1 })[0] });
        });
        this.logger.log(`📋 Se encontraron ${catalogoJson.length} registros SÍNTOMAS DHIS2 en el archivo Excel.`);

        // Usar for...of para esperar que cada operación asíncrona termine
        for (const col of catalogoJson) {
          // TODO: colocar auditoria correcta
          const auditoria: IAuditoria = {
            createdAt: new Date(),
            createdBy: 'System',
            updatedAt: undefined,
            updatedBy: 'System',
            deletedAt: undefined,
            deletedBy: 'System',
            isEnabled: true,
            isActive: true,
          };     
    
          // Create CtSymtom2llt object
          const ctSymptom2llt = new CreateCtSymptom2lltDto();
          ctSymptom2llt.item = col['A'] && col['A'] ? col['A'] : null;
          ctSymptom2llt.symptom = col['B'] && col['B'] ? col['B'] : null; //col['B'] && col['B'] ? col['B'] : null;
          ctSymptom2llt.lltName = col['C'] && col['C'] ? col['C'] : null;
          ctSymptom2llt.lltCode = col['D'] && col['D'] ? col['D'] : null;
          ctSymptom2llt.observation = col['E'] && col['E'] ? col['E'] : null;

          const existing =  await this.ctSymptom2lltRepository.findOne({
            where: {
              symptom: ctSymptom2llt.symptom,
              lltCode: ctSymptom2llt.lltCode,
            }
          });
          if(!existing){
            await this.ctSymptom2lltRepository.save({ ...ctSymptom2llt, ...auditoria } as CtSymptom2llt);
          }        

        } //--fin del for...of
        const total = await this.ctSymptom2lltRepository.count();
        console.log(`✅ Total de registros SÍNTOMAS DHIS2 en la base de datos: ${total}`);
        console.log('✅ Registros SÍNTOMAS DHIS2 cargados desde Excel');
      }catch(error){
        console.error('❌ Error al cargar SÍNTOMAS DHIS2 desde Excel:', error);
      }    
    });
  }
  //--fin de carga catálogo Excel mapeo de SÍNTOMAS DE DHIS2 a LLT MedDRA ------------------------------------------------------------------------------------------------------

  //--inicio de la carga del catálogo Provisional o TEMPORAL WHODrug desde el documento Excel------------------------------------------------------------------------------------------------------
  private async loadWhodrugVacsTempFromExcel() { //TODO: Comprobar las características (por ejemplo tipo de dato, que la última fila y columna estén vacías) del archivo Excel, para no cargar por error registros de otro catálogo. Puede ser un paso adicional de validación antes de proceder a la carga, o en la capa de Presentación o Usuario (Frontend).
    await this.runSyncProcess('Carga de catálogo Provisional WHODrug, para mapeo con VigiFLow...', async () => {
      console.log('🗺️ Cargando registros WHODRUG PROVISIONAL desde Excel...');
      try{
        const catalogoWhodrugVacsTemp = read(
          await fs.promises.readFile(path.join(process.cwd(), 'upload_files', 'catalogos-excel', '20260126-WHODrug-vacunas-temporal.xlsx')),
        );
        const ws = catalogoWhodrugVacsTemp.Sheets[catalogoWhodrugVacsTemp.SheetNames[0]];
        const importRange = 'A2:T318'; //Rango de datos a importar desde el archivo Excel, excluyendo las filas de encabezado.
        const headers = 'A'; //Fila de encabezados en el archivo Excel.
        const catalogoJson = utils.sheet_to_json(ws, { 
          range: importRange, 
          header: headers,//utils.sheet_to_json(ws, { range: headers, header: 1 })[0] });
          raw: true, // 👈 fuerza a no convertir tipos
          defval: '', // 👈 opcional: asigna valor por defecto si la celda está vacía, con esto se muestran todas las columnas, incluso si etán vacías.
        });
        this.logger.log(`📋 Se encontraron ${catalogoJson.length} registros WHODRUG PROVISIONAL en el archivo Excel.`);

        // Usar for...of para esperar que cada operación asíncrona termine
        for (const col of catalogoJson) {
          // TODO: colocar auditoria correcta
          const auditoria: IAuditoria = {
            createdAt: new Date(),
            createdBy: 'System',
            updatedAt: undefined,
            updatedBy: 'System',
            deletedAt: undefined,
            deletedBy: 'System',
            isEnabled: true,
            isActive: true,
          };     
    
          // Create WhodrugVacsTemp object
          const whodrugVacsTemp = new CreateWhodrugVacsTempDto();
          whodrugVacsTemp.item = col['A'] && col['A'] ? col['A'] : null;
          whodrugVacsTemp.drugCode = col['B'] && col['B'] ? col['B'] : null; //col['B'] && col['B'] ? col['B'] : null;
          whodrugVacsTemp.drugName = col['C'] && col['C'] ? col['C'] : null;
          whodrugVacsTemp.medicinalProductId = col['D'] && col['D'] ? col['D'] : null;
          whodrugVacsTemp.atcCode = col['E'] && col['E'] ? col['E'] : null;
          whodrugVacsTemp.abbreviation = col['F'] && col['F'] ? col['F'] : null;
          whodrugVacsTemp.activeIngredient = col['G'] && col['G'] ? col['G'] : null;
          whodrugVacsTemp.actiIngredientTranslation = col['H'] && col['H'] ? col['H'] : null;
          whodrugVacsTemp.languageCode = col['I'] && col['I'] ? col['I'] : null;
          whodrugVacsTemp.countryIso3Code = col['J'] && col['J'] ? col['J'] : null;
          whodrugVacsTemp.countryMediProdId = col['K'] && col['K'] ? col['K'] : null;
          whodrugVacsTemp.maHolder = col['L'] && col['L'] ? col['L'] : null;
          whodrugVacsTemp.maHolderMediProdId = col['M'] && col['M'] ? col['M'] : null;
          whodrugVacsTemp.pharmaceuticalForm = col['N'] && col['N'] ? col['N'] : null;
          whodrugVacsTemp.pharFormTranslation = col['O'] && col['O'] ? col['O'] : null;
          whodrugVacsTemp.pharFormMediProdId = col['P'] && col['P'] ? col['P'] : null;
          whodrugVacsTemp.strength = col['Q'] && col['Q'] ? col['Q'] : null;
          whodrugVacsTemp.strengthMediProdId = col['R'] && col['R'] ? col['R'] : null;
          whodrugVacsTemp.isGeneric = col['S'] && col['S'] ? String( col['S'] ) : null;
          whodrugVacsTemp.isPreferred = col['T'] && col['T'] ? String( col['T'] ) : null;

          const existing =  await this.whodrugVacsTempRepository.findOne({
            where: {
              //A  //Otra opción sería asegurarse de que esta primera columna "item" sea única en el archivo Excel. Y al usar este filtro, ya se comentarían todos los filtros  de las otras 10 columnas (BCDJKLMPQR).
              /*item: whodrugVacsTemp.item,*/

              //B
              drugCode: whodrugVacsTemp.drugCode,

              //C
              drugName: whodrugVacsTemp.drugName,

              //D
              medicinalProductId: whodrugVacsTemp.medicinalProductId,

              //J
              countryIso3Code: whodrugVacsTemp.countryIso3Code,

              //K
              countryMediProdId: whodrugVacsTemp.countryMediProdId,

              //L
              maHolder: whodrugVacsTemp.maHolder,

              //M
              maHolderMediProdId: whodrugVacsTemp.maHolderMediProdId,

              //P
              pharFormMediProdId: whodrugVacsTemp.pharFormMediProdId,

              //Q
              strength: whodrugVacsTemp.strength,

              //R
              strengthMediProdId: whodrugVacsTemp.strengthMediProdId,
            }
          });
          if(!existing){
            await this.whodrugVacsTempRepository.save({ ...whodrugVacsTemp, ...auditoria } as WhodrugVacsTemp);
          }        

        } //--fin del for...of
        const total = await this.whodrugVacsTempRepository.count();
        console.log(`✅ Total de registros WHODRUG VACS PROVISIONAL en la base de datos: ${total}`);
        console.log('✅ Registros WHODRUG VACS PROVISIONAL cargados desde Excel');
      }catch(error){
        console.error('❌ Error al cargar WHODRUG VACS PROVISIONAL desde Excel:', error);
      }    
    });
  }
  //--fin de carga catálogo Excel WHODrug Provisional VigiFlow ------------------------------------------------------------------------------------------------------

  //--inicio de la carga del catálogo auxiliar WHODrug Homologación Vacunas VigiFlow desde el documento Excel------------------------------------------------------------------------------------------------------
  private async loadWhodrugHomologacionVfFromExcel() { //TODO: Comprobar las características (por ejemplo tipo de dato, que la última fila y columna estén vacías) del archivo Excel, para no cargar por error registros de otro catálogo. Puede ser un paso adicional de validación antes de proceder a la carga, o en la capa de Presentación o Usuario (Frontend).
    await this.runSyncProcess('Carga de catálogo auxiliar WHODrug Homologación Vacunas VigiFlow, para mapeo...', async () => {
      console.log('🗺️ Cargando registros WHODRUG HOMOLOGACIÓN VACUNAS VigiFlow desde Excel...');
      try{
        const catalogoWhodrugHomologaVf = read(
          await fs.promises.readFile(path.join(process.cwd(), 'upload_files', 'catalogos-excel', '20260126-ECU-WHODrug-Homologacion-Vacunas-VigiFlow.xlsx')),
        );
        const ws = catalogoWhodrugHomologaVf.Sheets[catalogoWhodrugHomologaVf.SheetNames[0]];
        const importRange = 'A2:C36'; //Rango de datos a importar desde el archivo Excel, excluyendo las filas de encabezado.
        const headers = 'A'; //Fila de encabezados en el archivo Excel.
        const catalogoJson = utils.sheet_to_json(ws, { 
          range: importRange, 
          header: headers,//utils.sheet_to_json(ws, { range: headers, header: 1 })[0] });
          raw: true, // 👈 fuerza a no convertir tipos
          defval: '', // 👈 opcional: asigna valor por defecto si la celda está vacía, con esto se muestran todas las columnas, incluso si etán vacías.
        });
        this.logger.log(`📋 Se encontraron ${catalogoJson.length} registros WHODRUG HOMOLOGACIÓN VACUNAS VigiFlow en el archivo Excel.`);

        // Usar for...of para esperar que cada operación asíncrona termine
        for (const col of catalogoJson) {
          // TODO: colocar auditoria correcta
          const auditoria: IAuditoria = {
            createdAt: new Date(),
            createdBy: 'System',
            updatedAt: undefined,
            updatedBy: 'System',
            deletedAt: undefined,
            deletedBy: 'System',
            isEnabled: true,
            isActive: true,
          };     
    
          // Create WhodrugVacsTemp object
          const whodrugHomologaVacs = new CreateWhodrugHomologaVacsDto();
          whodrugHomologaVacs.patenteWhodrugVigiflow = col['A'] && col['A'] ? col['A'] : null;
          whodrugHomologaVacs.drugNameWhodrug = col['B'] && col['B'] ? col['B'] : null; //col['B'] && col['B'] ? col['B'] : null;
          whodrugHomologaVacs.mpIdWhodrug = col['C'] && col['C'] ? col['C'] : null;
          
          const existing =  await this.whodrugHomologaVacsRepository.findOne({
            where: {
              patenteWhodrugVigiflow: whodrugHomologaVacs.patenteWhodrugVigiflow,
            }
          });
          if(!existing){
            await this.whodrugHomologaVacsRepository.save({ ...whodrugHomologaVacs, ...auditoria } as WhodrugHomologaVacs);
          }        

        } //--fin del for...of
        const total = await this.whodrugHomologaVacsRepository.count();
        console.log(`✅ Total de registros WHODRUG HOMOLOGACIÓN VACUNAS VigiFlow en la base de datos: ${total}`);
        console.log('✅ Registros WHODRUG HOMOLOGACIÓN VACUNAS VigiFlow cargados desde Excel');
      }catch(error){
        console.error('❌ Error al cargar WHODRUG HOMOLOGACIÓN VACUNAS VigiFlow desde Excel:', error);
      }    
    });
  }
  //--fin de carga catálogo Excel WHODRUG HOMOLOGACIÓN VACUNAS VigiFlow ------------------------------------------------------------------------------------------------------


  /**
   * Método para limpiar el contenido de todas las tablas que inician con "TR"
   */
  async cleanTRTables() {
    console.log('🧹 Iniciando limpieza de todas las tablas que inician con "TR"...');

    try {
      // Obtener el query runner para ejecutar SQL directo
      const queryRunner = this.datoVacunacionRepository.manager.connection.createQueryRunner();

      // Obtener todas las tablas del esquema que inician con "TR"
      const tablesResult = await queryRunner.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'dhi_esavi' 
        AND table_name LIKE 'TR_%'
        ORDER BY table_name;
      `);

      console.log(`📋 Se encontraron ${tablesResult.length} tablas que inician con "TR"`);

      if (tablesResult.length === 0) {
        console.log('ℹ️ No se encontraron tablas que inician con "TR"');
        await queryRunner.release();
        return;
      }

      // Deshabilitar temporalmente las restricciones de clave foránea
      await queryRunner.query('SET session_replication_role = replica;');

      // Limpiar el contenido de cada tabla encontrada
      for (const table of tablesResult) {
        const tableName = table.table_name;
        console.log(`🧹 Limpiando contenido de tabla: ${tableName}`);

        try {
          await queryRunner.query(`TRUNCATE TABLE "dhi_esavi"."${tableName}" CASCADE;`);
          console.log(`✅ Tabla ${tableName} limpiada exitosamente`);
        } catch (tableError) {
          console.error(`❌ Error al limpiar tabla ${tableName}:`, tableError);
          // Continuamos con las demás tablas aunque falle una
        }
      }

      // Restaurar las restricciones de clave foránea
      await queryRunner.query('SET session_replication_role = DEFAULT;');

      // Liberar el query runner
      await queryRunner.release();

      console.log('✅ Proceso de limpieza de tablas "TR" completado exitosamente');
    } catch (error) {
      console.error('❌ Error al limpiar tablas que inician con "TR":', error);
      throw error;
    }
  }
}
