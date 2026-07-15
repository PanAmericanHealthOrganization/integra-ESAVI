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
import {Parametro} from '../entity/parametro.entity';
import {Parroquia} from '../entity/parroquia.entity';
import {Provincia} from '../entity/provincia.entity';
import {Vacunometro} from '../entity/vacunometro.entity';
import {encryptValue} from '../utils/parametro-crypto.util';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);
  constructor(
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
    @InjectRepository(Vacunometro, 'POSTGRES_INTEGRATOR_DS')
    private vacunometroRepository: Repository<Vacunometro>,
    @InjectRepository(Parametro, 'POSTGRES_INTEGRATOR_DS')
    private parametroRepository: Repository<Parametro>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedData();
    await this.seedUbicaciones();
    await this.loadTiposEntidadCatalogoPadre();
    await this.loadEstablecimientosFromCSV();
    await this.migrarTipoEmisor();
    await this.seedParametrosDev();
  }

  // ── Seed TC_PARAMETRO: valores dummy solo para entornos de desarrollo ──────
  // Evita que un despliegue nuevo en DEV falle por falta de parámetros
  // (DHIS2, VIGIFLOW, WHODRUG, MEDDRA) que ParametroService.getValor() exige.
  // En PROD estos valores deben reemplazarse manualmente desde el módulo de
  // Parámetros; por eso solo se insertan si ENV=DEV y la clave no existe aún.
  private async seedParametrosDev() {
    if ((process.env.ENV || '').toUpperCase() !== 'DEV') {
      return;
    }

    await this.runSyncProcess('Carga de parámetros dummy de desarrollo (TC_PARAMETRO)...', async () => {
      console.log('🔧 Verificando parámetros de desarrollo en TC_PARAMETRO...');

      // es_encriptado: true únicamente para contraseñas y llaves/tokens sensibles
      // (DHIS2_USER_KEY, *_PASSWD, WHD_UMC_*_KEY). El resto (URLs, usuarios,
      // client id, grant type, scope) no son secretos y viajan en texto plano.
      const parametrosDev = [
        {
          modulo: 'DHIS2',
          clave: 'DHIS2_URL',
          valor: 'https://dev-ops-gss.msp.gob.ec',
          descripcion: 'URL base del servidor DHIS2 (valor dummy de desarrollo, reemplazar antes de usar)',
          es_encriptado: false,
        },
        {
          modulo: 'DHIS2',
          clave: 'DHIS2_USER_KEY',
          valor: 'CAMBIAR_DHIS2_USER_KEY',
          descripcion: 'Personal Access Token de DHIS2 (valor dummy de desarrollo, reemplazar antes de usar)',
          es_encriptado: true,
        },
        {
          modulo: 'DHIS2',
          clave: 'DHIS2_USERNAME',
          valor: 'CAMBIAR_DHIS2_USERNAME',
          descripcion: 'Usuario de DHIS2 (valor dummy de desarrollo, reemplazar antes de usar)',
          es_encriptado: false,
        },
        {
          modulo: 'DHIS2',
          clave: 'DHIS2_PASSWD',
          valor: 'CAMBIAR_DHIS2_PASSWD',
          descripcion: 'Contraseña de DHIS2 (valor dummy de desarrollo, reemplazar antes de usar)',
          es_encriptado: true,
        },
        {
          modulo: 'VIGIFLOW',
          clave: 'VIGIFLOW_USERNAME',
          valor: 'CAMBIAR_VIGIFLOW_USERNAME',
          descripcion: 'Usuario de VigiFlow (valor dummy de desarrollo, reemplazar antes de usar)',
          es_encriptado: false,
        },
        {
          modulo: 'VIGIFLOW',
          clave: 'VIGIFLOW_PASSWD',
          valor: 'CAMBIAR_VIGIFLOW_PASSWD',
          descripcion: 'Contraseña de VigiFlow (valor dummy de desarrollo, reemplazar antes de usar)',
          es_encriptado: true,
        },
        {
          modulo: 'WHODRUG',
          clave: 'WHD_API_URL',
          valor: 'https://api.who-umc.org/',
          descripcion: 'URL base de la API de WHODrug (UMC)',
          es_encriptado: false,
        },
        {
          modulo: 'WHODRUG',
          clave: 'WHD_UMC_LICENSE_KEY',
          valor: 'CAMBIAR_WHD_UMC_LICENSE_KEY',
          descripcion: 'License key de WHODrug (valor dummy de desarrollo, reemplazar antes de usar)',
          es_encriptado: true,
        },
        {
          modulo: 'WHODRUG',
          clave: 'WHD_UMC_CLIENT_KEY',
          valor: 'CAMBIAR_WHD_UMC_CLIENT_KEY',
          descripcion: 'Client key de WHODrug (valor dummy de desarrollo, reemplazar antes de usar)',
          es_encriptado: true,
        },
        {
          modulo: 'MEDDRA',
          clave: 'MED_URL_TOKEN',
          valor: 'https://mid.meddra.org/connect/token',
          descripcion: 'URL del endpoint OAuth (token) de MedDRA',
          es_encriptado: false,
        },
        {
          modulo: 'MEDDRA',
          clave: 'MED_URL_API',
          valor: 'https://mapisbx.meddra.org/api/search',
          descripcion: 'URL del endpoint de búsqueda (API) de MedDRA',
          es_encriptado: false,
        },
        {
          modulo: 'MEDDRA',
          clave: 'MED_GRANT_TYPE',
          valor: 'password',
          descripcion: 'Grant type OAuth de MedDRA (valor dummy de desarrollo, reemplazar antes de usar)',
          es_encriptado: false,
        },
        {
          modulo: 'MEDDRA',
          clave: 'MED_CLIENT_ID',
          valor: 'CAMBIAR_MED_CLIENT_ID',
          descripcion: 'Client ID de MedDRA (valor dummy de desarrollo, reemplazar antes de usar)',
          es_encriptado: false,
        },
        {
          modulo: 'MEDDRA',
          clave: 'MED_USER_NAME',
          valor: 'CAMBIAR_MED_USER_NAME',
          descripcion: 'Usuario de MedDRA (valor dummy de desarrollo, reemplazar antes de usar)',
          es_encriptado: false,
        },
        {
          modulo: 'MEDDRA',
          clave: 'MED_PASSWORD',
          valor: 'CAMBIAR_MED_PASSWORD',
          descripcion: 'Contraseña de MedDRA (valor dummy de desarrollo, reemplazar antes de usar)',
          es_encriptado: true,
        },
        {
          modulo: 'MEDDRA',
          clave: 'MED_SCOPE',
          valor: 'CAMBIAR_MED_SCOPE',
          descripcion: 'Scope OAuth de MedDRA (valor dummy de desarrollo, reemplazar antes de usar)',
          es_encriptado: false,
        },
      ];

      const auditoria: IAuditoria = {
        createdAt: new Date(),
        createdBy: 'System',
        updatedAt: undefined,
        updatedBy: '',
        deletedAt: undefined,
        deletedBy: '',
        isEnabled: true,
        isActive: true,
      };

      for (const parametro of parametrosDev) {
        const existing = await this.parametroRepository.findOne({ where: { clave: parametro.clave } });
        if (!existing) {
          await this.parametroRepository.save({
            ...parametro,
            valor: parametro.es_encriptado ? encryptValue(parametro.valor) : parametro.valor,
            tipo_dato: TipoDato.STRING,
            ...auditoria,
          } as Parametro);
        }
      }

      console.log('✅ Parámetros dummy de desarrollo verificados en TC_PARAMETRO');
    });
  }

  async seedData() {
    console.log('🌱 Iniciando carga de valores en catálogo de homolgación...');

    // Carga independiente de TC_CATALOGO_PADRE desde CSV (siempre corre, con su propio control de duplicados)
    await this.loadCatalogoPadreFromCSV();

    // Carga independiente de homologador Sexo VigiFlow (siempre corre, con control de duplicados)
    await this.loadHomologadorSexoVigiflow();

    console.log('✅ Valores cargados en catálogo de homologación exitosamente');
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

  // ── Carga de TC_DPA_PROVINCIA, TC_DPA_CANTON, TC_DPA_PARROQUIA ──────────────────────────

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
      console.log(`ℹ️ TC_DPA_PROVINCIA ya cargada (${count} registros). Se omite.`);
      return;
    }
    if (count > 0) {
      console.log(`⚠️ TC_DPA_PROVINCIA incompleta (${count} registros). Re-cargando desde CSV...`);
    }

    console.log('🗺️ Cargando TC_DPA_PROVINCIA desde CSV...');
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
      console.log(`✅ TC_DPA_PROVINCIA: ${insertados} provincia(s) insertada(s).`);
    } catch (error) {
      console.error('❌ Error al cargar TC_DPA_PROVINCIA:', error);
    }
  }

  private async seedCantones() {
    const count = await this.cantonRepository.count();
    if (count >= 200) {
      console.log(`ℹ️ TC_DPA_CANTON ya cargada (${count} registros). Se omite.`);
      return;
    }
    if (count > 0) {
      console.log(`⚠️ TC_DPA_CANTON incompleta (${count} registros). Re-cargando desde CSV...`);
    }

    console.log('🗺️ Cargando TC_DPA_CANTON desde CSV...');
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
      console.log(`✅ TC_DPA_CANTON: ${insertados} cantón(es) insertado(s), ${omitidos} omitido(s) por provincia no encontrada.`);
    } catch (error) {
      console.error('❌ Error al cargar TC_DPA_CANTON:', error);
    }
  }

  private async seedParroquias() {
    const count = await this.parroquiaRepository.count();
    if (count >= 1400) {
      console.log(`ℹ️ TC_DPA_PARROQUIA ya cargada (${count} registros). Se omite.`);
      return;
    }
    if (count > 0) {
      console.log(`⚠️ TC_DPA_PARROQUIA incompleta (${count} registros). Re-cargando desde CSV...`);
    }

    console.log('🗺️ Cargando TC_DPA_PARROQUIA desde CSV...');
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
      console.log(`✅ TC_DPA_PARROQUIA: ${insertados} parroquia(s) insertada(s), ${omitidos} omitida(s) por cantón no encontrado.`);

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
      console.log(`✅ TC_DPA_PARROQUIA: ${insertadosDesconocido} parroquia(s) "Desconocido" insertada(s) por cantón.`);
    } catch (error) {
      console.error('❌ Error al cargar TC_DPA_PARROQUIA:', error);
    }
    };
  

  // TARGET_VALUE de estas reglas es el id (uuid) del registro correspondiente en
  // TC_CATALOGO_PADRE/GENERO (HOMBRE/MUJER/OTRO), no un código numérico arbitrario:
  // PacienteService.resolveSexo() resuelve por TR_HOMOLOGADOR/TR_HOMOLOGACION_REGLA y usa
  // ese id para buscar directamente el registro de catálogo. Por eso los ids se resuelven
  // en tiempo de ejecución (se generan al sembrar TC_CATALOGO_PADRE) en vez de hardcodearse.
  private async loadHomologadorSexoVigiflow() {
    await this.runSyncProcess('Carga de homologador Sexo (VigiFlow/DHIS2)...', async () => {
      console.log('🔄 Cargando homologador Sexo (VigiFlow/DHIS2)...');

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
            description: 'Sexo de persona (origen VigiFlow/DHIS2). TARGET_VALUE = id de TC_CATALOGO_PADRE/GENERO.',
            targetType: TipoDato.STRING,
            ...auditoria,
          } as Homologador);
          console.log('✅ Homologador Sexo creado');
        } else if (homologador.targetType !== TipoDato.STRING) {
          homologador.targetType = TipoDato.STRING;
          homologador = await this.homologadorRepository.save(homologador);
          console.log('🔧 Homologador Sexo: TARGET_TYPE corregido a STRING (guarda un id de catálogo, no un número).');
        }

        const [hombre, mujer, otro] = await Promise.all([
          this.catalogoPadreRepository.findOne({ where: { codigo: 'HOMBRE' } }),
          this.catalogoPadreRepository.findOne({ where: { codigo: 'MUJER' } }),
          this.catalogoPadreRepository.findOne({ where: { codigo: 'OTRO' } }),
        ]);

        if (!hombre || !mujer || !otro) {
          console.error('❌ Homologador Sexo: faltan HOMBRE/MUJER/OTRO en TC_CATALOGO_PADRE/GENERO. Se omite.');
          return;
        }

        const reglas: {
          sourceSystem: string;
          sourceValue: string;
          targetId: string;
          comparisonType: TipoComparacion;
          priority: number;
        }[] = [
          { sourceSystem: 'VIGIFLOW', sourceValue: 'Femenino', targetId: mujer.id, comparisonType: TipoComparacion.EQUALS, priority: 1 },
          { sourceSystem: 'VIGIFLOW', sourceValue: 'Masculino', targetId: hombre.id, comparisonType: TipoComparacion.EQUALS, priority: 2 },
          { sourceSystem: 'VIGIFLOW', sourceValue: '.*', targetId: otro.id, comparisonType: TipoComparacion.REGEX, priority: 99 },
          { sourceSystem: 'DHIS2', sourceValue: 'Hombre', targetId: hombre.id, comparisonType: TipoComparacion.EQUALS, priority: 1 },
          { sourceSystem: 'DHIS2', sourceValue: 'Mujer', targetId: mujer.id, comparisonType: TipoComparacion.EQUALS, priority: 2 },
          { sourceSystem: 'DHIS2', sourceValue: 'Otro', targetId: otro.id, comparisonType: TipoComparacion.EQUALS, priority: 3 },
          { sourceSystem: 'DHIS2', sourceValue: '.*', targetId: otro.id, comparisonType: TipoComparacion.REGEX, priority: 99 },
        ];

        let insertados = 0;
        let corregidos = 0;
        let omitidos = 0;

        for (const regla of reglas) {
          const existente = await this.reglaHomologacionRepository.findOne({
            where: {
              homologadorId: homologador.id,
              sourceSystem: regla.sourceSystem,
              sourceField: 'sexo',
              sourceValue: regla.sourceValue,
            },
          });

          if (existente) {
            if (existente.targetValue !== regla.targetId) {
              existente.targetValue = regla.targetId;
              await this.reglaHomologacionRepository.save(existente);
              corregidos++;
            } else {
              omitidos++;
            }
            continue;
          }

          await this.reglaHomologacionRepository.save({
            homologadorId: homologador.id,
            sourceSystem: regla.sourceSystem,
            sourceField: 'sexo',
            sourceValue: regla.sourceValue,
            targetValue: regla.targetId,
            comparisonType: regla.comparisonType,
            caseSensitive: false,
            priority: regla.priority,
            ...auditoria,
          } as unknown as ReglaHomologacion);
          insertados++;
        }

        console.log(`✅ Homologaciones Sexo: ${insertados} insertada(s), ${corregidos} corregida(s), ${omitidos} ya correcta(s).`);
      } catch (error) {
        console.error('❌ Error al cargar homologador Sexo VigiFlow/DHIS2:', error);
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
        const uniCodigo = String(row['UNI_CODIGO'] ?? '').trim().replace(/"/g, '').padStart(6, '0');
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

  /**
   * Genera datos simulados en TR_VACUNOMETRO para pruebas y demos.
   * Usa unicodigos reales de TR_ESTABLECIMIENTO cuando existen; caso contrario,
   * genera códigos sintéticos.
   * @param registros cantidad de registros a generar
   * @param dias rango hacia atrás desde hoy para las fechas de aplicación
   */
  async seedVacunometro(registros = 1000, dias = 365): Promise<{ insertados: number }> {
    const VACUNAS = [
      'BCG',
      'Hepatitis B pediátrica',
      'Rotavirus',
      'fIPV',
      'bOPV',
      'Pentavalente (DPT-HB-Hib)',
      'Neumococo conjugada',
      'SRP (Sarampión-Rubéola-Parotiditis)',
      'Fiebre Amarilla',
      'Varicela',
      'DPT refuerzo',
      'HPV',
      'dT adulto',
      'Influenza estacional',
      'COVID-19',
    ];
    const GRUPOS_ETARIOS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    const aleatorio = (max: number) => Math.floor(Math.random() * max);

    let insertados = 0;
    await this.runSyncProcess(`Simulación de ${registros} registros de VACUNOMETRO...`, async () => {
      const establecimientos = await this.establecimientoRepository.find({
        select: { uniCodigo: true },
        take: 300,
      });
      const unicodigos =
        establecimientos.length > 0
          ? establecimientos.map((e) => e.uniCodigo)
          : Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(6, '0'));

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

      const ahora = Date.now();
      const rangoMs = dias * 24 * 60 * 60 * 1000;
      const lote: Partial<Vacunometro>[] = Array.from({ length: registros }, () => {
        const totalHombres = aleatorio(250);
        const totalMujeres = aleatorio(250);
        return {
          unicodigo: unicodigos[aleatorio(unicodigos.length)],
          nombreVacuna: VACUNAS[aleatorio(VACUNAS.length)],
          grupoEtario: GRUPOS_ETARIOS[aleatorio(GRUPOS_ETARIOS.length)],
          fechaAplicacion: new Date(ahora - aleatorio(rangoMs)),
          totalHombres,
          totalMujeres,
          total: totalHombres + totalMujeres,
          ...auditoriaDto,
        };
      });

      const CHUNK_SIZE = 1000;
      for (let i = 0; i < lote.length; i += CHUNK_SIZE) {
        const chunk = lote.slice(i, i + CHUNK_SIZE);
        await this.vacunometroRepository.insert(chunk);
        insertados += chunk.length;
        console.log(`✅ TR_VACUNOMETRO: ${insertados} de ${lote.length} registros simulados insertados.`);
      }
    });

    return { insertados };
  }

  /**
   * Simula la carga diaria de vacunación tal como la entrega la entidad de vacunación (HCUE):
   * registros agregados por día, establecimiento, vacuna y grupo etario, con totales por sexo
   * (mismo formato que produce VacunacionNominalService.procesarVacunasAgregadas).
   * Genera datos para TODOS los establecimientos existentes, un lote por cada día del rango.
   * @param dias cantidad de días hacia atrás desde hoy a simular (1 a 365)
   */
  async seedSimulacionVacunacionDiaria(dias = 7): Promise<{ insertados: number; establecimientos: number; dias: number }> {
    // Nombres en mayúsculas, igual que UPPER(NOMBRE_VACUNA) en la consulta a la entidad de vacunación
    const VACUNAS = [
      'BCG',
      'HEPATITIS B PEDIÁTRICA',
      'ROTAVIRUS',
      'FIPV',
      'BOPV',
      'PENTAVALENTE (DPT-HB-HIB)',
      'NEUMOCOCO CONJUGADA',
      'SRP (SARAMPIÓN-RUBÉOLA-PAROTIDITIS)',
      'FIEBRE AMARILLA',
      'VARICELA',
      'DPT REFUERZO',
      'HPV',
      'DT ADULTO',
      'INFLUENZA ESTACIONAL',
      'COVID-19',
    ];
    // Grupos etarios 1 a 7, igual que el CASE de grupo_etario del origen HCUE
    const GRUPOS_ETARIOS = [1, 2, 3, 4, 5, 6, 7];

    const aleatorio = (max: number) => Math.floor(Math.random() * max);
    const diasRango = Math.min(Math.max(Math.trunc(dias) || 7, 1), 365);

    let insertados = 0;
    let totalEstablecimientos = 0;

    await this.runSyncProcess(
      `Simulación de vacunación diaria (${diasRango} días) para todos los establecimientos...`,
      async () => {
        const establecimientos = await this.establecimientoRepository.find({
          select: { uniCodigo: true },
        });
        if (establecimientos.length === 0) {
          throw new Error(
            'No existen establecimientos registrados: cargue TR_ESTABLECIMIENTO antes de simular vacunaciones',
          );
        }
        totalEstablecimientos = establecimientos.length;

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

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const CHUNK_SIZE = 1000;
        for (let d = diasRango - 1; d >= 0; d--) {
          const fechaAplicacion = new Date(hoy.getTime() - d * 24 * 60 * 60 * 1000);
          const lote: Partial<Vacunometro>[] = [];

          for (const { uniCodigo } of establecimientos) {
            // Cada establecimiento reporta entre 1 y 3 vacunas distintas por día
            const cantidadVacunas = 1 + aleatorio(3);
            const inicio = aleatorio(VACUNAS.length);
            for (let v = 0; v < cantidadVacunas; v++) {
              const totalHombres = aleatorio(120);
              const totalMujeres = aleatorio(120);
              lote.push({
                unicodigo: uniCodigo,
                nombreVacuna: VACUNAS[(inicio + v) % VACUNAS.length],
                grupoEtario: GRUPOS_ETARIOS[aleatorio(GRUPOS_ETARIOS.length)],
                fechaAplicacion,
                totalHombres,
                totalMujeres,
                total: totalHombres + totalMujeres,
                ...auditoriaDto,
              });
            }
          }

          for (let i = 0; i < lote.length; i += CHUNK_SIZE) {
            const chunk = lote.slice(i, i + CHUNK_SIZE);
            await this.vacunometroRepository.insert(chunk);
            insertados += chunk.length;
          }
          console.log(
            `✅ TR_VACUNOMETRO: día ${fechaAplicacion.toISOString().slice(0, 10)} simulado para ${totalEstablecimientos} establecimientos (${insertados} registros acumulados).`,
          );
        }
      },
    );

    return { insertados, establecimientos: totalEstablecimientos, dias: diasRango };
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

  // ── Migración de TIPO_EMISOR (texto/número) → CT_TIPO_EMISOR_ID ─────────────
  private async migrarTipoEmisor(): Promise<void> {
    const queryRunner = this.notificacionRepository.manager.connection.createQueryRunner();
    try {
      // Verificar si la columna legada TIPO_EMISOR todavía existe
      const columnaExiste: { exists: boolean }[] = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'DHI_ESAVI'
            AND table_name   = 'TR_NOTIFICACION'
            AND column_name  = 'TIPO_EMISOR'
        ) AS exists
      `);
      if (!columnaExiste[0]?.exists) {
        console.log('ℹ️ Migración TIPO_EMISOR: columna legada no encontrada. Se omite.');
        return;
      }

      const pendientes: { total: string }[] = await queryRunner.query(`
        SELECT COUNT(*) AS total FROM "DHI_ESAVI"."TR_NOTIFICACION"
        WHERE "TIPO_EMISOR" IS NOT NULL AND "CT_TIPO_EMISOR_ID" IS NULL
      `);
      const total = parseInt(pendientes[0]?.total ?? '0', 10);
      if (total === 0) {
        console.log('ℹ️ Migración TIPO_EMISOR: sin registros pendientes. Se omite.');
        return;
      }
      console.log(`🔄 Migración TIPO_EMISOR: ${total} registro(s) pendiente(s)...`);

      // Reverso del mapa numérico heredado de VigiFlow
      const mapaNumerico: Record<string, string> = {
        '1': 'Profesional de la salud',
        '2': 'Paciente / consumidor',
        '3': 'Laboratorio farmacéutico',
        '4': 'Centro regional de farmacovigilancia',
        '5': 'Otro',
      };

      const subcategorias = await this.catalogoPadreRepository.find({
        where: { padre: { codigo: 'TIPO_EMISOR' }, isEnabled: true },
        relations: ['padre'],
      });

      const rows: { ID: string; TIPO_EMISOR: string }[] = await queryRunner.query(`
        SELECT "ID", "TIPO_EMISOR" FROM "DHI_ESAVI"."TR_NOTIFICACION"
        WHERE "TIPO_EMISOR" IS NOT NULL AND "CT_TIPO_EMISOR_ID" IS NULL
      `);

      let actualizados = 0;
      let sinMatch = 0;

      for (const row of rows) {
        const textoOriginal = row['TIPO_EMISOR']?.toString().trim() ?? '';
        const textoResuelto = mapaNumerico[textoOriginal] ?? textoOriginal;
        const normBuscado = this.normalizarMigracion(textoResuelto);

        let mejorMatch: CatalogoPadre | null = null;
        let mejorSim = 0;
        for (const sub of subcategorias) {
          const sim = this.similitudMigracion(normBuscado, this.normalizarMigracion(sub.nombre));
          if (sim > mejorSim) { mejorSim = sim; mejorMatch = sub; }
        }

        if (mejorMatch && mejorSim >= 0.9) {
          await queryRunner.query(
            `UPDATE "DHI_ESAVI"."TR_NOTIFICACION" SET "CT_TIPO_EMISOR_ID" = $1 WHERE "ID" = $2`,
            [mejorMatch.id, row['ID']],
          );
          actualizados++;
        } else {
          this.logger.warn(`TIPO_EMISOR "${textoOriginal}" sin coincidencia ≥90% (mejor: ${(mejorSim * 100).toFixed(1)}%)`);
          sinMatch++;
        }
      }

      console.log(`✅ Migración TIPO_EMISOR: ${actualizados} actualizado(s), ${sinMatch} sin match ≥90%.`);
    } catch (error) {
      console.error('❌ Error en migración TIPO_EMISOR:', error);
    } finally {
      await queryRunner.release();
    }
  }

  private normalizarMigracion(texto: string): string {
    return texto.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  private similitudMigracion(a: string, b: string): number {
    if (a === b) return 1;
    const la = a.length; const lb = b.length;
    if (la === 0 || lb === 0) return 0;
    const m: number[][] = Array.from({ length: lb + 1 }, (_, i) =>
      Array.from({ length: la + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= lb; i++)
      for (let j = 1; j <= la; j++)
        m[i][j] = b[i-1] === a[j-1] ? m[i-1][j-1]
          : Math.min(m[i-1][j-1] + 1, m[i][j-1] + 1, m[i-1][j] + 1);
    return (Math.max(la, lb) - m[lb][la]) / Math.max(la, lb);
  }
}
