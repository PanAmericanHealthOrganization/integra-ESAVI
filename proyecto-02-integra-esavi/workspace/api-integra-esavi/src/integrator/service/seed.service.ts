import {Injectable,Logger,OnApplicationBootstrap} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import {ReglaHomologacion} from 'src/homologator/entity/regla-homologacion.entity';
import {Homologador} from 'src/homologator/entity/homologador.entity';
import {TipoComparacion} from 'src/homologator/enum/tipo-comparacion.enum';
import {TipoDato} from 'src/homologator/enum/tipo-dato.enum';
import {Repository} from 'typeorm';
import {read,utils} from 'xlsx';

// Entidades
import {ISync} from '../dto/sync.dto';
import {IAuditoria,SyncProcess,SyncStatus} from '../entity';
import {Canton} from '../entity/canton.entity';
import {CatalogoPadre} from '../entity/catalogo-padre.entity';
import {Catalogo} from '../entity/catalogo.entity';
import {Establecimiento} from '../entity/establecimiento.entity';
import {CausalidadEsavi} from '../entity/causalidad-esavi.entity';
import {DatoEsavi} from '../entity/dato-esavi.entity';
import {DatoVacuna} from '../entity/dato-vacuna.entity';
import {DatoVacunacion} from '../entity/dato-vacunacion.entity';
import {DesenlaceEsavi} from '../entity/desenlace-esavi.entity';
import {GravedadEsavi} from '../entity/gravedad-esavi.entity';
import {Medicamento} from '../entity/medicamento.entity';
import {Notificacion} from '../entity/notificacion.entity';
import {Paciente} from '../entity/paciente.entity';
import {Parroquia} from '../entity/parroquia.entity';
import {Provincia} from '../entity/provincia.entity';
import {TipoCatalogo} from '../entity/tipo-catalogo.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);
  constructor(
    @InjectRepository(TipoCatalogo, 'POSTGRES_INTEGRATOR_DS')
    private tipoCatalogoRepository: Repository<TipoCatalogo>,
    @InjectRepository(Catalogo, 'POSTGRES_INTEGRATOR_DS')
    private catalogoRepository: Repository<Catalogo>,
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
    @InjectRepository(CatalogoPadre, 'POSTGRES_INTEGRATOR_DS')
    private catalogoPadreRepository: Repository<CatalogoPadre>,
    @InjectRepository(Provincia, 'POSTGRES_INTEGRATOR_DS')
    private provinciaRepository: Repository<Provincia>,
    @InjectRepository(Canton, 'POSTGRES_INTEGRATOR_DS')
    private cantonRepository: Repository<Canton>,
    @InjectRepository(Parroquia, 'POSTGRES_INTEGRATOR_DS')
    private parroquiaRepository: Repository<Parroquia>,
    @InjectRepository(Establecimiento, 'POSTGRES_INTEGRATOR_DS')
    private establecimientoRepository: Repository<Establecimiento>,
    @InjectRepository(Homologador, 'POSTGRES_INTEGRATOR_DS')
    private homologadorRepository: Repository<Homologador>,
    @InjectRepository(ReglaHomologacion, 'POSTGRES_INTEGRATOR_DS')
    private reglaHomologacionRepository: Repository<ReglaHomologacion>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedData();
    await this.seedUbicaciones();
    await this.loadTiposEntidadCatalogoPadre();
    await this.loadEstablecimientosFromCSV();
  }

  async seedData() {
    //console.log('🌱 Iniciando carga de datos de ejemplo...'); // Cuando se cargaban datos fake para pruebas.
    console.log('🌱 Iniciando carga de valores en catálogo de homolgación...');

    // Carga independiente de TC_CATALOGO_PADRE desde CSV (siempre corre, con su propio control de duplicados)
    await this.loadCatalogoPadreFromCSV();

    // Carga independiente de homologador Sexo VigiFlow (siempre corre, con control de duplicados)
    await this.loadHomologadorSexoVigiflow();

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

      // 2.4. loadIcd10meddraFromExcel — eliminado (archivo no disponible)
      // 2.5. loadSymptomToLltFromExcel — eliminado (archivo no disponible)

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
      await queryRunner.query('TRUNCATE TABLE "DHI_ESAVI"."TR_DATO_VACUNACION" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "DHI_ESAVI"."TR_DATO_VACUNA" CASCADE;');

      await queryRunner.query('TRUNCATE TABLE "DHI_ESAVI"."TR_DESENLACE_ESAVI" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "DHI_ESAVI"."TR_GRAVEDAD_ESAVI" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "DHI_ESAVI"."TR_CAUSALIDAD_ESAVI" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "DHI_ESAVI"."TR_MEDICAMENTO" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "DHI_ESAVI"."TR_DATOS_ESAVI" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "DHI_ESAVI"."TR_NOTIFICACION" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "DHI_ESAVI"."TR_PACIENTE" CASCADE;');
      /*
      *
      await queryRunner.query(
        'TRUNCATE TABLE "DHI_ESAVI"."TC_CATALOGO" CASCADE;',
      );
      await queryRunner.query(
        'TRUNCATE TABLE "DHI_ESAVI"."TC_TIPOCATALOGO" CASCADE;',
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
      const err = error as Error;
      // Registrar fallo con auditoría
      await this.createSyncProcess(
        name,
        SyncStatus.FAILED,
        null,
        err.message,
        err.stack,
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
        } 
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
    
        }
      }catch(error){
        console.error('❌ Error al cargar SÍNTOMAS DHIS2 desde Excel:', error);
      }    
    });
  }
  //--fin de carga catálogo Excel mapeo de SÍNTOMAS DE DHIS2 a LLT MedDRA ------------------------------------------------------------------------------------------------------



  // ── Seed TC_CATALOGO_PADRE: Género ──────────────────────────────────────────
  private async loadCatalogoPadreFromCSV() {
    const primerRegistro = await this.catalogoPadreRepository.findOne({ where: { codigo: 'GENERO' } });
    if (primerRegistro) {
      console.log('ℹ️ TC_CATALOGO_PADRE (catalogo_padre.csv) ya cargado. Se omite.');
      return;
    }
    await this.runSyncProcess('Carga de TC_CATALOGO_PADRE desde CSV...', async () => {
      console.log('📂 Cargando TC_CATALOGO_PADRE desde catalogo_padre.csv...');

      try {
        const csvPath = path.join(process.cwd(), 'upload_files', 'catalogos-csv', 'catalogo_padre.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.split('\n').filter((line) => line.trim());

        const auditoria: IAuditoria = {
          createdAt: new Date(),
          createdBy: 'System',
          updatedAt: undefined,
          updatedBy: 'System',
          deletedAt: undefined,
          deletedBy: '',
          isEnabled: true,
          isActive: true,
        };

        // Parsear filas omitiendo el encabezado
        const rows = lines.slice(1).map((line) => {
          const [codigo, codigo_padre, descripcion, codigo_homologado] = line.split(',').map((col) => col.trim());
          return { codigo, codigo_padre, descripcion, codigo_homologado };
        }).filter((row) => row.codigo);

        let insertados = 0;
        let omitidos = 0;

        // Primera pasada: registros sin padre (top-level)
        for (const row of rows.filter((r) => !r.codigo_padre)) {
          const existing = await this.catalogoPadreRepository.findOne({ where: { codigo: row.codigo } });
          if (existing) {
            omitidos++;
          } else {
            await this.catalogoPadreRepository.save({
              codigo: row.codigo,
              nombre: row.descripcion,
              descripcion: row.codigo_homologado || null,
              padre: null,
              ...auditoria,
            } as CatalogoPadre);
            insertados++;
          }
        }

        // Segunda pasada: registros con padre (hijos)
        for (const row of rows.filter((r) => r.codigo_padre)) {
          const existing = await this.catalogoPadreRepository.findOne({ where: { codigo: row.codigo } });
          if (existing) {
            omitidos++;
          } else {
            const padre = await this.catalogoPadreRepository.findOne({ where: { codigo: row.codigo_padre } });
            await this.catalogoPadreRepository.save({
              codigo: row.codigo,
              nombre: row.descripcion,
              descripcion: row.codigo_homologado || null,
              padre: padre || null,
              ...auditoria,
            } as CatalogoPadre);
            insertados++;
          }
        }

        if (omitidos > 0) {
          console.log(`ℹ️ TC_CATALOGO_PADRE: ${omitidos} registro(s) ya estaban cargados y se omitieron.`);
        }
        console.log(`✅ TC_CATALOGO_PADRE procesado: ${insertados} insertado(s), ${omitidos} omitido(s).`);
      } catch (error) {
        console.error('❌ Error al cargar TC_CATALOGO_PADRE desde CSV:', error);
      }
    });
  }

  // ── Carga de TC_PROVINCIA, TC_CANTON, TC_PARROQUIA ──────────────────────────

  async seedUbicaciones() {
    await this.seedProvincias();
    await this.seedCantones();
    await this.seedParroquias();
  }

  private extractCodigoFromParenthesis(text: string): string | null {
    const match = text.match(/\((\d+)\)/);
    return match ? match[1] : null;
  }

  private toSentenceCase(text: string): string {
    if (!text) return text;
    const lower = text.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  private extractNombreFromParenthesis(text: string): string {
    const raw = text.replace(/\s*\(\d+\)\s*$/, '').replace(/^\*/, '').trim();
    return this.toSentenceCase(raw);
  }

  private async seedProvincias() {
    const count = await this.provinciaRepository.count();
    if (count >= 20) {
      console.log(`ℹ️ TC_PROVINCIA ya cargada (${count} registros). Se omite.`);
      return;
    }
    if (count > 0) {
      console.log(`⚠️ TC_PROVINCIA incompleta (${count} registros). Re-cargando desde CSV...`);
    }

    console.log('🗺️ Cargando TC_PROVINCIA desde CSV...');
    try {
      const csvPath = path.join(process.cwd(), 'upload_files', 'catalogos-csv', 'provincias_ecuador.csv');
      const lines = fs.readFileSync(csvPath, 'utf-8').split('\n').filter((l) => l.trim());

      const auditoria: IAuditoria = {
        createdAt: new Date(), createdBy: 'System',
        updatedAt: undefined, updatedBy: 'System',
        deletedAt: undefined, deletedBy: '',
        isEnabled: true, isActive: true,
      };

      let insertados = 0;
      for (let i = 1; i < lines.length; i++) {
        const raw = lines[i].split(',')[0].trim().replace(/"/g, '');
        const codigo = this.extractCodigoFromParenthesis(raw);
        const nombre = this.extractNombreFromParenthesis(raw);
        if (!codigo || !nombre) continue;

        const existing = await this.provinciaRepository.findOne({ where: { codigo } });
        if (!existing) {
          await this.provinciaRepository.save({ codigo, nombre, ...auditoria } as Provincia);
          insertados++;
        }
      }
      console.log(`✅ TC_PROVINCIA: ${insertados} provincia(s) insertada(s).`);
    } catch (error) {
      console.error('❌ Error al cargar TC_PROVINCIA:', error);
    }
  }

  private async seedCantones() {
    const count = await this.cantonRepository.count();
    if (count >= 200) {
      console.log(`ℹ️ TC_CANTON ya cargada (${count} registros). Se omite.`);
      return;
    }
    if (count > 0) {
      console.log(`⚠️ TC_CANTON incompleta (${count} registros). Re-cargando desde CSV...`);
    }

    console.log('🗺️ Cargando TC_CANTON desde CSV...');
    try {
      const csvPath = path.join(process.cwd(), 'upload_files', 'catalogos-csv', 'cantones_dhis2_ecuador.csv');
      const lines = fs.readFileSync(csvPath, 'utf-8').split('\n').filter((l) => l.trim());

      const auditoria: IAuditoria = {
        createdAt: new Date(), createdBy: 'System',
        updatedAt: undefined, updatedBy: 'System',
        deletedAt: undefined, deletedBy: '',
        isEnabled: true, isActive: true,
      };

      let insertados = 0;
      let omitidos = 0;
      for (let i = 1; i < lines.length; i++) {
        const raw = lines[i].split(',')[0].trim().replace(/^[﻿"]+|["]+$/g, '');
        const codigo = this.extractCodigoFromParenthesis(raw);
        const nombre = this.extractNombreFromParenthesis(raw);
        if (!codigo || !nombre || codigo.length !== 4) continue;

        const provinciaCodigo = codigo.substring(0, 2);
        const provincia = await this.provinciaRepository.findOne({ where: { codigo: provinciaCodigo } });
        if (!provincia) {
          omitidos++;
          continue;
        }

        const existing = await this.cantonRepository.findOne({ where: { codigo } });
        if (!existing) {
          await this.cantonRepository.save({ codigo, nombre, provincia, ...auditoria } as Canton);
          insertados++;
        }
      }
      console.log(`✅ TC_CANTON: ${insertados} cantón(es) insertado(s), ${omitidos} omitido(s) por provincia no encontrada.`);
    } catch (error) {
      console.error('❌ Error al cargar TC_CANTON:', error);
    }
  }

  private async seedParroquias() {
    const count = await this.parroquiaRepository.count();
    if (count >= 1400) {
      console.log(`ℹ️ TC_PARROQUIA ya cargada (${count} registros). Se omite.`);
      return;
    }
    if (count > 0) {
      console.log(`⚠️ TC_PARROQUIA incompleta (${count} registros). Re-cargando desde CSV...`);
    }

    console.log('🗺️ Cargando TC_PARROQUIA desde CSV...');
    try {
      const csvPath = path.join(process.cwd(), 'upload_files', 'catalogos-csv', 'parroquias_dhis2_ecuador.csv');
      const lines = fs.readFileSync(csvPath, 'utf-8').split('\n').filter((l) => l.trim());

      const auditoria: IAuditoria = {
        createdAt: new Date(), createdBy: 'System',
        updatedAt: undefined, updatedBy: 'System',
        deletedAt: undefined, deletedBy: '',
        isEnabled: true, isActive: true,
      };

      let insertados = 0;
      let omitidos = 0;
      for (let i = 1; i < lines.length; i++) {
        const raw = lines[i].split(',')[0].trim().replace(/^[﻿"]+|["]+$/g, '');
        const codigo = this.extractCodigoFromParenthesis(raw);
        const nombre = this.extractNombreFromParenthesis(raw);
        if (!codigo || !nombre || codigo.length !== 6) continue;

        const cantonCodigo = codigo.substring(0, 4);
        const canton = await this.cantonRepository.findOne({ where: { codigo: cantonCodigo } });
        if (!canton) {
          omitidos++;
          continue;
        }

        const existing = await this.parroquiaRepository.findOne({ where: { codigo } });
        if (!existing) {
          await this.parroquiaRepository.save({ codigo, nombre, canton, ...auditoria } as Parroquia);
          insertados++;
        }
      }
      console.log(`✅ TC_PARROQUIA: ${insertados} parroquia(s) insertada(s), ${omitidos} omitida(s) por cantón no encontrado.`);

      // Insertar una parroquia "Desconocido-{canton}" por cada cantón
      const todosLosCantones = await this.cantonRepository.find();
      let insertadosDesconocido = 0;
      for (const canton of todosLosCantones) {
        const codigoDesconocido = `${canton.codigo}99`;
        const existing = await this.parroquiaRepository.findOne({ where: { codigo: codigoDesconocido } });
        if (!existing) {
          await this.parroquiaRepository.save({
            codigo: codigoDesconocido,
            nombre: `Desconocido-${canton.nombre}`,
            canton,
            ...auditoria,
          } as Parroquia);
          insertadosDesconocido++;
        }
      }
      console.log(`✅ TC_PARROQUIA: ${insertadosDesconocido} parroquia(s) "Desconocido" insertada(s) por cantón.`);
    } catch (error) {
      console.error('❌ Error al cargar TC_PARROQUIA:', error);
    }
    };
  

  private async loadHomologadorSexoVigiflow() {
    const homologadorExistente = await this.homologadorRepository.findOne({ where: { entity: 'Paciente', field: 'sexo' } });
    if (homologadorExistente) {
      const reglaCount = await this.reglaHomologacionRepository.count({ where: { homologadorId: homologadorExistente.id } });
      if (reglaCount > 0) {
        console.log(`ℹ️ Homologador Sexo ya cargado (${reglaCount} reglas). Se omite.`);
        return;
      }
    }
    await this.runSyncProcess('Carga de homologador Sexo (origen VigiFlow)...', async () => {
      console.log('🔄 Cargando homologador Sexo VigiFlow...');

      try {
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

        let homologador = await this.homologadorRepository.findOne({
          where: { entity: 'Paciente', field: 'sexo' },
        });

        if (!homologador) {
          homologador = await this.homologadorRepository.save({
            entity: 'Paciente',
            field: 'sexo',
            description: 'Sexo de persona - origen VigiFlow',
            targetType: TipoDato.NUMBER,
            ...auditoria,
          } as Homologador);
          console.log('✅ Homologador Sexo creado');
        } else {
          console.log('ℹ️ Homologador Sexo ya existe, se omite creación');
        }

        const csvPath = path.join(
          process.cwd(),
          'upload_files',
          'catalogos-csv',
          'homologador-sexo-vigiflow.csv',
        );
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.split('\n').filter((line) => line.trim());

        let insertados = 0;
        let omitidos = 0;

        for (let i = 1; i < lines.length; i++) {
          const [sourceSystem, sourceField, sourceValue, targetValue, comparisonType, caseSensitiveStr, priorityStr] =
            lines[i].split(',').map((col) => col.trim());

          const existing = await this.reglaHomologacionRepository.findOne({
            where: {
              homologadorId: homologador.id,
              sourceSystem,
              sourceField,
              sourceValue: sourceValue ?? '',
            },
          });

          if (existing) {
            omitidos++;
            continue;
          }

          await this.reglaHomologacionRepository.save({
            homologadorId: homologador.id,
            sourceSystem,
            sourceField,
            sourceValue: sourceValue ?? '',
            targetValue,
            comparisonType: comparisonType as TipoComparacion,
            caseSensitive: caseSensitiveStr === 'true',
            priority: parseInt(priorityStr, 10),
            ...auditoria,
          } as unknown as ReglaHomologacion);
          insertados++;
        }

        if (omitidos > 0) {
          console.log(`ℹ️ Homologaciones Sexo: ${omitidos} regla(s) ya existían y se omitieron.`);
        }
        console.log(`✅ Homologaciones Sexo VigiFlow: ${insertados} regla(s) insertada(s).`);
      } catch (error) {
        console.error('❌ Error al cargar homologador Sexo VigiFlow:', error);
        throw error;
      }
    });
  }

  // ── Carga de tipos de entidad (ENTIDAD) en TC_CATALOGO_PADRE ────────────────
  private async loadTiposEntidadCatalogoPadre() {
    const padreExistente = await this.catalogoPadreRepository.findOne({ where: { codigo: 'ENTIDAD' } });
    if (padreExistente) {
      console.log('ℹ️ Tipos de entidad ya cargados en TC_CATALOGO_PADRE. Se omite.');
      return;
    }
    console.log('🏥 Cargando tipos de entidad en TC_CATALOGO_PADRE...');

    const auditoria: IAuditoria = {
      createdAt: new Date(), createdBy: 'System',
      updatedAt: undefined, updatedBy: 'System',
      deletedAt: undefined, deletedBy: '',
      isEnabled: true, isActive: true,
    };

    const CODIGO_PADRE = 'ENTIDAD';

    let padre = await this.catalogoPadreRepository.findOne({ where: { codigo: CODIGO_PADRE } });
    if (!padre) {
      padre = await this.catalogoPadreRepository.save({
        codigo: CODIGO_PADRE,
        nombre: 'Entidad',
        descripcion: 'Tipos de entidad de establecimiento de salud',
        padre: null,
        ...auditoria,
      } as CatalogoPadre);
      console.log('✅ Padre ENTIDAD creado.');
    }

    const tipos = [
      'Centro de salud tipo A',
      'MSP',
      'Centro de salud tipo B',
      'Hospital especializado',
      'Puesto de salud',
      'Hospital basico',
      'Hospital general',
      'Centro de salud tipo C',
      'Ambulancia de soporte vital avanzado terrestre',
      'Transporte primario o de atencion prehospitalario-ambulancia de soporte vital basico',
      'Ambulancia de soporte vital basico terrestre',
      'Ambulancia de transporte simple terrestre',
      'Consultorio general',
      'Unidad movil general',
      'Transporte secundario-ambulancia de transporte simple',
      'Unidad movil quirurgica',
      'Consultorio general de medicina general',
      'Transporte primario o de atencion prehospitalario-ambulancia de soporte vital avanzado',
      'Laboratorio de analisis clinico de baja complejidad',
      'Centros especializados',
      'Laboratorio de analisis clinico de referencia',
      'Transporte primario o de atencion prehospitalario-vehiculo de asistencia y evaluacion rapida',
      'Coordinaciones distritales',
      'Unidad movil de diagnostico oncologico',
      'Planta central',
      'Coordinaciones zonales',
    ];

    let insertados = 0;
    let omitidos = 0;
    for (const nombre of tipos) {
      const codigo = 'ENTIDAD_' + nombre.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').substring(0, 40);
      const existing = await this.catalogoPadreRepository.findOne({ where: { codigo } });
      if (existing) { omitidos++; continue; }
      await this.catalogoPadreRepository.save({ codigo, nombre, descripcion: null, padre, ...auditoria } as CatalogoPadre);
      insertados++;
    }
    console.log(`✅ Tipos de entidad: ${insertados} insertado(s), ${omitidos} omitido(s).`);
  }

  // ── Carga de TR_ESTABLECIMIENTO desde ENTIDAD_202305121541.csv ──────────────
  private async loadEstablecimientosFromCSV() {
    const count = await this.establecimientoRepository.count({ where: { isEnabled: true } });
    if (count > 0) {
      console.log(`ℹ️ TR_ESTABLECIMIENTO ya cargada (${count} registros). Se omite.`);
      return;
    }

    console.log('🏥 Cargando TR_ESTABLECIMIENTO desde ENTIDAD_202305121541.csv...');

    try {
      const csvPath = path.join(process.cwd(), 'upload_files', 'catalogos-csv', 'ENTIDAD_202305121541.csv');
      const workbook = read(await fs.promises.readFile(csvPath), { type: 'buffer', raw: false });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const rows = utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

      const auditoria: IAuditoria = {
        createdAt: new Date(), createdBy: 'System',
        updatedAt: undefined, updatedBy: 'System',
        deletedAt: undefined, deletedBy: '',
        isEnabled: true, isActive: true,
      };

      const tiposCache = new Map<string, CatalogoPadre>();
      let insertados = 0;
      let omitidos = 0;

      for (const row of rows) {
        const uniCodigo = String(row['UNI_CODIGO'] ?? '').trim().replace(/"/g, '');
        const uniNombre = this.toSentenceCase(String(row['UNI_NOMBRE'] ?? '').trim());
        const direccion = String(row['UNI_DIRECCION'] ?? '').trim();
        const telefono = String(row['UNI_TELEFONO'] ?? '').trim();
        const parCodigo = String(row['PAR_CODIGO'] ?? '').trim();
        const tipoNombre = String(row['TIPO_ENTIDAD'] ?? '').trim();
        const mail = String(row['MAIL'] ?? '').trim();

        if (!uniCodigo || !uniNombre) { omitidos++; continue; }

        const existing = await this.establecimientoRepository.findOne({ where: { uniCodigo, isEnabled: true } });
        if (existing) { omitidos++; continue; }

        const est = this.establecimientoRepository.create({
          uniCodigo,
          uniNombre,
          direccion: direccion || null,
          telefono: telefono || null,
          mail: mail || null,
          ...auditoria,
        });

        if (parCodigo) {
          const parroquia = await this.parroquiaRepository.findOne({ where: { codigo: parCodigo } });
          if (parroquia) est.parroquiaResidencia = parroquia;
        }

        if (tipoNombre) {
          if (!tiposCache.has(tipoNombre)) {
            const codigo = 'ENTIDAD_' + tipoNombre.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').substring(0, 40);
            const tipo = await this.catalogoPadreRepository.findOne({ where: { codigo } });
            if (tipo) tiposCache.set(tipoNombre, tipo);
          }
          const tipo = tiposCache.get(tipoNombre);
          if (tipo) est.tipoEntidad = tipo;
        }

        await this.establecimientoRepository.save(est);
        insertados++;
      }

      console.log(`✅ TR_ESTABLECIMIENTO: ${insertados} insertado(s), ${omitidos} omitido(s).`);
    } catch (error) {
      console.error('❌ Error al cargar TR_ESTABLECIMIENTO desde CSV:', error);
    }
  }

  async truncateNotificacion() {
    console.log('🧹 Truncando TR_NOTIFICACION en cascada...');
    const queryRunner = this.notificacionRepository.manager.connection.createQueryRunner();
    try {
      await queryRunner.query('SET session_replication_role = replica;');
      await queryRunner.query('TRUNCATE TABLE "DHI_ESAVI"."TR_NOTIFICACION" CASCADE;');
      await queryRunner.query('SET session_replication_role = DEFAULT;');
      console.log('✅ TR_NOTIFICACION truncada en cascada exitosamente');
    } catch (error) {
      console.error('❌ Error al truncar TR_NOTIFICACION:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Trunca todas las tablas de todos los esquemas de la base de datos,
   * excepto los esquemas del sistema y "public".
   */
  async cleanTRTables() {
    console.log('🧹 Iniciando limpieza de todas las tablas (todos los esquemas excepto public)...');

    const ESQUEMAS_EXCLUIDOS = [
      'public',
      'pg_catalog',
      'information_schema',
      'pg_toast',
    ];

    const queryRunner = this.datoVacunacionRepository.manager.connection.createQueryRunner();
    try {
      const tablas: { table_schema: string; table_name: string }[] = await queryRunner.query(`
        SELECT t.table_schema, t.table_name
        FROM information_schema.tables t
        WHERE t.table_type = 'BASE TABLE'
          AND t.table_schema NOT IN (${ESQUEMAS_EXCLUIDOS.map((s) => `'${s}'`).join(', ')})
          AND t.table_schema NOT LIKE 'pg_temp_%'
        ORDER BY t.table_schema, t.table_name;
      `);

      if (tablas.length === 0) {
        console.log('ℹ️ No se encontraron tablas para truncar');
        return;
      }

      const esquemas = [...new Set(tablas.map((t) => t.table_schema))];
      console.log(`📋 Esquemas encontrados: ${esquemas.join(', ')}`);
      console.log(`📋 Total de tablas a truncar: ${tablas.length}`);

      const listaTablas = tablas
        .map((t) => `"${t.table_schema}"."${t.table_name}"`)
        .join(', ');

      await queryRunner.query('SET session_replication_role = replica;');
      await queryRunner.query(`TRUNCATE TABLE ${listaTablas} CASCADE;`);
      await queryRunner.query('SET session_replication_role = DEFAULT;');

      console.log(`✅ ${tablas.length} tabla(s) truncadas en ${esquemas.length} esquema(s) exitosamente`);
    } catch (error) {
      console.error('❌ Error al truncar las tablas:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
