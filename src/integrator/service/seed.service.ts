import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';

// Entidades
import { CRUD } from 'src/utils/interfaces/baseEntity';
import { ISync } from '../dto/sync.dto';
import { Auditoria, SyncProcess } from '../entity';
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

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(TipoCatalogo, 'POSTGRES_INTEGRATOR_DS')
    private tipoCatalogoRepository: Repository<TipoCatalogo>,
    @InjectRepository(Catalogo, 'POSTGRES_INTEGRATOR_DS')
    private catalogoRepository: Repository<Catalogo>,
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

  async seedData() {
    //console.log('🌱 Iniciando carga de datos de ejemplo...'); // Cuando se cargaban datos fake para pruebas.
    console.log('🌱 Iniciando carga de valores en catálogo de homolgación...');
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

      await this.createSyncProcess();
      // Finalizar
      console.log('✅ Valores cargados en catálogo de homologación exitosamente');
    } catch (error) {
      console.error('❌ Error al cargar valores en catálogo de homologación:', error);
      throw error;
    }
  }

  async cleanData() {
    console.log('🧹 Limpiando datos existentes...');

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
    ];

    for (const tipo of tiposCatalogo) {
      const existing = await this.tipoCatalogoRepository.findOne({
        where: { descripcion: tipo.descripcion },
      });

      if (!existing) {
        await this.tipoCatalogoRepository.save(tipo);
      }
    }
  }

  private async createSyncProcess() {
    const l = [];
    for (let i = 0; i < 25; i++) {
      console.log('🔄 Creando proceso de sincronización...');
      const syncProcess: ISync = {
        name: 'Data Seeding',
        status: 'COMPLETED',
        startTime: new Date(),
        endTime: new Date(),
        errorMessage:
          'Proceso de carga de valores en catálogo de homologación, completado exitosamente.',
        errorStack: null,
        errorTrace: null,
        id: undefined, // or null, depending on your entity definition

        // Add required properties with default or mock values
        enabled: true,
        state: true,
        action: CRUD.C,
        actionBy: 'system', // or any appropriate user identifier
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      l.push(syncProcess);
    }
    await this.syncProcessRepository.save(l);
  }
  private async seedCatalogos() {
    console.log('📚 Creando catálogos...');

    const tiposCatalogo = await this.tipoCatalogoRepository.find();

    const catalogos = [
      // Sexo
      {
        vigiflow: 'Masculino',
        dhis2: 'Hombre',
        homologada: 'Masculino',
        tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Sexo'),
      },
      {
        vigiflow: 'Femenino',
        dhis2: 'Mujer',
        homologada: 'Femenino',
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
        vigiflow: 'MESTIZO/A',
        dhis2: 'MESTIZO/A',
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
        homologada: 'Afroecuatoriano',
        tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Autoidentificación Étnica'),
      },

      // Provincias
      {
        vigiflow: 'Pichincha',
        dhis2: 'Pichincha',
        homologada: 'Pichincha',
        tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
      },
      {
        vigiflow: 'Guayas',
        dhis2: 'Guayas',
        homologada: 'Guayas',
        tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
      },
      {
        vigiflow: 'Azuay',
        dhis2: 'Azuay',
        homologada: 'Azuay',
        tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Provincia'),
      },

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
        homologada: 'AÑOS',
        tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
      },
      {
        vigiflow: 'MESES',
        dhis2: 'MESES',
        homologada: 'MESES',
        tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
      },
      {
        vigiflow: 'DÍAS',
        dhis2: 'DÍAS',
        homologada: 'DÍAS',
        tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
      },
      {
        vigiflow: 'DIAS',
        dhis2: 'DIAS',
        homologada: 'DÍAS',
        tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
      },
      {
        vigiflow: 'AÑO',
        dhis2: 'AÑO',
        homologada: 'AÑOS',
        tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
      },
      {
        vigiflow: 'MES',
        dhis2: 'MES',
        homologada: 'MESES',
        tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
      },
      {
        vigiflow: 'SEMANA',
        dhis2: 'SEMANA',
        homologada: 'SEMANAS',
        tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
      },
      {
        vigiflow: 'DIA',
        dhis2: 'DIA',
        homologada: 'DÍAS',
        tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
      },
      {
        vigiflow: 'HORA',
        dhis2: 'HORA',
        homologada: 'HORAS',
        tipoCatalogo: tiposCatalogo.find((t) => t.descripcion === 'Unidad de Edad'),
      },
    ];

    const auditoriaCatalogoHomologacionDto: Auditoria = {
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
  }

  private async seedGruposEtarios() {
    console.log('👥 Creando grupos etarios...');

    /*const gruposEtarios = [
      { inicio: 0, fin: 2, descripcion: 'Lactantes (0-2 años)' },
      { inicio: 3, fin: 5, descripcion: 'Preescolares (3-5 años)' },
      { inicio: 6, fin: 11, descripcion: 'Escolares (6-11 años)' },
      { inicio: 12, fin: 17, descripcion: 'Adolescentes (12-17 años)' },
      { inicio: 18, fin: 64, descripcion: 'Adultos (18-64 años)' },
      { inicio: 65, fin: 120, descripcion: 'Adultos mayores (65+ años)' },
    ];*/
    const auditoriaDto: Auditoria = {
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
      { inicioEdad: 0, finEdad: 11, descripcion: 'Menor 1 año' }, // contiene edades en meses
      { inicioEdad: 1, finEdad: 4, descripcion: '1 A 4 Años' },
      { inicioEdad: 5, finEdad: 9, descripcion: '5 A 9 Año' },
      { inicioEdad: 10, finEdad: 14, descripcion: '10 A 14' },
      { inicioEdad: 15, finEdad: 19, descripcion: '15 A 19' },
      { inicioEdad: 20, finEdad: 64, descripcion: '20 A 64' },
      { inicioEdad: 65, finEdad: 120, descripcion: '65 Año y más' },
    ];

    for (const grupo of gruposEtarios) {
      const existing = await this.grupoEtarioRepository.findOne({
        where: { descripcion: grupo.descripcion },
      });

      if (!existing) {
        await this.grupoEtarioRepository.save({ ...grupo, ...auditoriaDto } as GrupoEtario);
      }
    }
  }

  /* //---inicio del semillero de los datos ficticios------------------------------------------------------------------------------------------------------
  private async seedPacientes() {
    console.log('👤 Creando pacientes...');

    const sexos = await this.catalogoRepository.find({
      where: { tipoCatalogo: { descripcion: 'Sexo' } },
    });

    const autoIdentificaciones = await this.catalogoRepository.find({
      where: { tipoCatalogo: { descripcion: 'Autoidentificación Étnica' } },
    });

    const pacientes = [];

    for (let i = 0; i < 1000; i++) {
      const paciente = new Paciente();
      paciente.nombre = faker.person.fullName();
      paciente.identificacion = faker.string.numeric(10);
      paciente.sexo = faker.helpers.arrayElement(sexos);
      paciente.autoIdentificacion = faker.helpers.arrayElement(autoIdentificaciones);
      paciente.registroSincronizado = faker.datatype.boolean();
      paciente.fechaNacimiento = faker.date.birthdate();

      pacientes.push(paciente);
    }

    await this.pacienteRepository.save(pacientes);
  }

  private async seedNotificaciones() {
    console.log('📢 Creando notificaciones...');

    const pacientes = await this.pacienteRepository.find();
    const provincias = await this.catalogoRepository.find({
      where: { tipoCatalogo: { descripcion: 'Provincia' } },
    });
    const gruposEtarios = await this.grupoEtarioRepository.find();
    const estadosRegistro = await this.catalogoRepository.find({
      where: { tipoCatalogo: { descripcion: 'Estado Registro' } },
    });

    const notificaciones = [];

    for (let i = 0; i < 1000; i++) {
      const notificacion = new Notificacion();
      notificacion.paciente = faker.helpers.arrayElement(pacientes);
      notificacion.provinciaResidencia = faker.helpers.arrayElement(provincias);
      notificacion.peso = faker.number.int({ min: 1, max: 150 });
      notificacion.altura = faker.number.int({ min: 30, max: 220 });
      notificacion.fechaNacimiento = faker.date.birthdate();
      notificacion.edad = faker.number.int({ min: 0, max: 100 });
      notificacion.lactando = faker.datatype.boolean();
      notificacion.grupoEtario = faker.helpers.arrayElement(gruposEtarios);
      notificacion.nombreNotificador = faker.person.fullName();
      notificacion.identificacionNotificador = faker.string.numeric(10);
      notificacion.casoNarrativo = faker.lorem.paragraph();
      notificacion.tituloReporte = faker.lorem.sentence();
      notificacion.estadoRegistro = faker.helpers.arrayElement(estadosRegistro);
      notificacion.fechaNotificacion = faker.date.recent();
      notificacion.fechaReporteNacional = faker.date.recent();
      notificacion.fechaLlenadoFicha = faker.date.recent();
      notificacion.fechaAtencion = faker.date.recent();
      notificacion.codigoUnidadSalud = faker.string.alphanumeric(8);

//(notificacion as any).TIPO_NOTIFICACION = 'ficticia'; // Asignación manual, con esto se evita crear una clase hija de "Notificacion", es decir, "NotificacionFicticia" o crear un campo opcional "tipoNotificacion" en la entidad padre "Notificacion".
      notificaciones.push(notificacion);
    }

    await this.notificacionRepository.save(notificaciones);
  }

  private async seedDatosEsavi() {
    console.log('🏥 Creando datos ESAVI...');

    const notificaciones = await this.notificacionRepository.find();

    const datosEsavi = [];

    for (let i = 0; i < 1500; i++) {
      const datoEsavi = new DatoEsavi();
      datoEsavi.notificacion = faker.helpers.arrayElement(notificaciones);
      datoEsavi.nombre = faker.helpers.arrayElement([
        'Fiebre',
        'Dolor de cabeza',
        'Náuseas',
        'Vómitos',
        'Diarrea',
        'Erupción cutánea',
        'Dolor muscular',
        'Fatiga',
        'Mareos',
        'Dificultad para respirar',
        'Tos',
        'Dolor de garganta',
      ]);
      datoEsavi.descripcion = faker.lorem.sentence();
      datoEsavi.nombreReportado = datoEsavi.nombre;
      datoEsavi.codigoLLT = faker.string.alphanumeric(8);
      datoEsavi.fechaEsavi = faker.date.recent();
      datoEsavi.fechaFinalizacion = faker.date.future();
      datoEsavi.duracion = faker.helpers.arrayElement([
        '1-3 días',
        '4-7 días',
        '8-14 días',
        '15+ días',
      ]);
      datoEsavi.resultado = faker.helpers.arrayElement([
        'Resuelto',
        'En curso',
        'Secuelas',
        'Fallecimiento',
      ]);
      datoEsavi.codigoCaso = faker.string.alphanumeric(10);

      datosEsavi.push(datoEsavi);
    }

    await this.datoEsaviRepository.save(datosEsavi);
  }

  private async seedMedicamentos() {
    console.log('💊 Creando medicamentos...');

    const medicamentos = [];

    for (let i = 0; i < 500; i++) {
      const medicamento = new Medicamento();
      medicamento.nombre = faker.helpers.arrayElement([
        'Paracetamol',
        'Ibuprofeno',
        'Aspirina',
        'Omeprazol',
        'Loratadina',
        'Cetirizina',
        'Dexametasona',
        'Prednisona',
        'Amoxicilina',
        'Azitromicina',
      ]);
      medicamento.rolMedicamento = faker.helpers.arrayElement([
        'Sospechoso',
        'Concomitante',
        'Interaccion',
      ]);
      medicamento.codigoATC = faker.string.alphanumeric(7);
      medicamento.sistemaCodificacion = faker.helpers.arrayElement(['ATC', 'WHO Drug']);
      medicamento.codigo = faker.string.alphanumeric(8);
      medicamento.nombreNormalizado = medicamento.nombre;
      medicamento.codigoFormaFarmaceutica = faker.string.alphanumeric(4);
      medicamento.nombreFormaFarmaceutica = faker.helpers.arrayElement([
        'Tableta',
        'Cápsula',
        'Jarabe',
        'Inyección',
      ]);
      medicamento.codigoViaAdministracion = faker.string.alphanumeric(4);
      medicamento.nombreViaAdministracion = faker.helpers.arrayElement([
        'Oral',
        'Intramuscular',
        'Intravenosa',
        'Tópica',
      ]);

      medicamentos.push(medicamento);
    }

    await this.medicamentoRepository.save(medicamentos);
  }

  private async seedCausalidadesEsavi() {
    console.log('🔍 Creando causalidades ESAVI...');

    const notificaciones = await this.notificacionRepository.find();
    const datosEsavi = await this.datoEsaviRepository.find();

    const causalidades = [];

    for (let i = 0; i < 300; i++) {
      const causalidad = new CausalidadEsavi();
      causalidad.datoEsavi = faker.helpers.arrayElement(datosEsavi);
      causalidad.fechaCausalidadEsavi = faker.date.recent();
      causalidad.sistemaClasificacionCausalidad = faker.helpers.arrayElement([
        'WHO-AEFI',
        'WHO-UMC',
        'Naranjo',
      ]);
      causalidad.clasificacionCausaEsavi = faker.lorem.sentence();
      causalidad.clasificacionCausalidadWHOAEFI = faker.helpers.arrayElement([
        'Definitiva',
        'Probable',
        'Posible',
        'Improbable',
      ]);
      causalidad.clasificacionCausalidadWHOUMC = faker.helpers.arrayElement([
        'Certain',
        'Probable',
        'Possible',
        'Unlikely',
      ]);
      causalidad.clasificacionCausalidadNaranjo = faker.helpers.arrayElement([
        'Definitiva',
        'Probable',
        'Posible',
        'Dudosa',
      ]);
      causalidad.notificacion = faker.helpers.arrayElement(notificaciones);

      causalidades.push(causalidad);
    }

    await this.causalidadEsaviRepository.save(causalidades);
  }

  private async seedGravedadesEsavi() {
    console.log('⚠️ Creando gravedades ESAVI...');

    const notificaciones = await this.notificacionRepository.find();
    const gravedades = [];

    for (let i = 0; i < 200; i++) {
      const gravedad = new GravedadEsavi();
      gravedad.tipo = faker.helpers.arrayElement([
        'Leve',
        'Moderada',
        'Grave',
        'Muy grave',
        'Fatal',
      ]);
      gravedad.muerte = faker.datatype.boolean();
      gravedad.riesgoVida = faker.datatype.boolean();
      gravedad.discapacidad = faker.datatype.boolean();
      gravedad.hospitalizacion = faker.datatype.boolean();
      gravedad.anomaliaCongenita = faker.datatype.boolean();
      gravedad.aborto = faker.datatype.boolean();
      gravedad.muerteFetal = faker.datatype.boolean();
      gravedad.eventoImportante = faker.datatype.boolean();
      gravedad.comentarioEventoImportante = faker.lorem.sentence();
      gravedad.parteEventosPreocupacion = faker.datatype.boolean();
      gravedad.nuevoEventos = faker.datatype.boolean();
      gravedad.condicionEgreso = faker.lorem.sentence();
      gravedad.notificacion = faker.helpers.arrayElement(notificaciones);

      gravedades.push(gravedad);
    }

    await this.gravedadEsaviRepository.save(gravedades);
  }

  private async seedDesenlacesEsavi() {
    console.log('📈 Creando desenlaces ESAVI...');

    const notificaciones = await this.notificacionRepository.find();
    const catalogos = await this.catalogoRepository.find();
    const desenlaces = [];

    for (let i = 0; i < 400; i++) {
      const desenlace = new DesenlaceEsavi();
      desenlace.codigo = faker.string.alphanumeric(8);
      desenlace.fechaMuerte = faker.datatype.boolean() ? faker.date.recent() : null;
      desenlace.autopsia = faker.number.int({ min: 0, max: 1 });
      desenlace.fechaNotificacionMuerte = faker.date.recent();
      desenlace.autopsiaFetal = faker.number.int({ min: 0, max: 1 });
      desenlace.fechaNotififacionMuerteFetal = faker.date.recent();
      desenlace.comentarios = faker.lorem.paragraph();
      desenlace.fechaInicioInvestigacion = faker.date.recent();
      desenlace.clasificacionFinalCaso = faker.lorem.sentence();
      desenlace.clasificacionFinalCasoA = faker.lorem.sentence();
      desenlace.clasificacionFinalCasoB = faker.lorem.sentence();
      desenlace.notificacion = faker.helpers.arrayElement(notificaciones);
      desenlace.causalidadEsavi = faker.helpers.arrayElement(catalogos);

      desenlaces.push(desenlace);
    }

    await this.desenlaceEsaviRepository.save(desenlaces);
  }

  private async seedDatosVacunas() {
    console.log('💉 Creando datos de vacunas...');

    const notificaciones = await this.notificacionRepository.find();
    const datosVacunas = [];

    for (let i = 0; i < 800; i++) {
      const datoVacuna = new DatoVacuna();
      datoVacuna.codigoAtc = faker.string.alphanumeric(7);
      datoVacuna.rolVacuna = faker.helpers.arrayElement(['Sospechosa', 'Concomitante']);
      datoVacuna.sistemaDeCodificacion = faker.helpers.arrayElement(['WHUDRUG', 'ATC']);
      datoVacuna.nombreVacuna = faker.helpers.arrayElement([
        'BCG',
        'Pentavalente',
        'Rotavirus',
        'Neumococo',
        'Influenza',
        'COVID-19',
        'Hepatitis B',
        'Triple Viral',
        'Varicela',
      ]);
      datoVacuna.nombreVacunaPatenteWhoDrug = datoVacuna.nombreVacuna;
      datoVacuna.drugCode = faker.string.alphanumeric(8);
      datoVacuna.codigoOtro = faker.string.alphanumeric(8);
      datoVacuna.identificadorVacuna = faker.string.alphanumeric(10);
      datoVacuna.nombreFabricante = faker.company.name();
      datoVacuna.nombreFabricanteWhoDrug = datoVacuna.nombreFabricante;
      datoVacuna.codigoFabricanteWhoDrug = faker.string.alphanumeric(6);
      datoVacuna.numeroDosisVacuna = faker.number.int({ min: 1, max: 5 });
      datoVacuna.dosis = faker.helpers.arrayElement(['1ra dosis', '2da dosis', '3ra dosis']);
      datoVacuna.dosis1 = faker.helpers.arrayElement(['0.5ml', '1ml', '0.25ml']);
      datoVacuna.intervaloDosificacion = faker.helpers.arrayElement([
        '4 semanas',
        '8 semanas',
        '6 meses',
      ]);
      datoVacuna.numeroLote = faker.string.alphanumeric(8);
      datoVacuna.fechaVencimientoVacuna = faker.date.future();
      datoVacuna.nombreDiluyenteVacuna = faker.lorem.words(2);
      datoVacuna.fechaVencimientoDiluyente = faker.date.future();
      datoVacuna.paisAutorizacion = faker.location.country();
      datoVacuna.concentracion = faker.helpers.arrayElement(['0.5ml', '1ml', '0.25ml']);
      datoVacuna.ingredienteSospechoso = faker.lorem.words(2);
      datoVacuna.accionTomada = faker.lorem.sentence();
      datoVacuna.informacionAdicionalMedicamento = faker.lorem.paragraph();
      datoVacuna.indicacionMeddra = faker.lorem.sentence();
      datoVacuna.indicacionNotificadorPrimario = faker.lorem.sentence();
      datoVacuna.duracion = faker.helpers.arrayElement(['1 día', '3 días', '7 días']);
      datoVacuna.inicioAdministracion = faker.date.recent();
      datoVacuna.finAdministracion = faker.date.future();
      datoVacuna.formaFarmaceutica = faker.helpers.arrayElement(['Inyección', 'Oral', 'Nasal']);
      datoVacuna.formaFarmaceuticaEDQM = datoVacuna.formaFarmaceutica;
      datoVacuna.viaAdministracion = faker.helpers.arrayElement([
        'Intramuscular',
        'Subcutánea',
        'Oral',
        'Intradérmica',
      ]);
      datoVacuna.viaAdministracionEDQM = datoVacuna.viaAdministracion;
      datoVacuna.notificacion = faker.helpers.arrayElement(notificaciones);

      datosVacunas.push(datoVacuna);
    }

    await this.datoVacunaRepository.save(datosVacunas);
  }

  private async seedDatosVacunacion() {
    console.log('📋 Creando datos de vacunación...');

    const notificaciones = await this.notificacionRepository.find();
    const catalogos = await this.catalogoRepository.find();
    const datosVacunacion = [];

    for (let i = 0; i < 1200; i++) {
      const datoVacunacion = new DatoVacunacion();
      datoVacunacion.nombreVacunatorio = faker.company.name();
      datoVacunacion.fechaVacunacion = faker.date.recent();
      datoVacunacion.horaVacunacion = faker.date.recent();
      datoVacunacion.provincia = faker.helpers.arrayElement(catalogos);
      datoVacunacion.canton = faker.helpers.arrayElement(catalogos);
      datoVacunacion.parroquia = faker.helpers.arrayElement(catalogos);
      datoVacunacion.otraParroquia = faker.lorem.words(2);
      datoVacunacion.direccion = faker.location.streetAddress();
      datoVacunacion.codigoMecanismoVerificacion = faker.string.alphanumeric(8);
      datoVacunacion.nombreOtroMecanismo = faker.lorem.words(3);
      datoVacunacion.fechaReconstitucion = faker.date.recent();
      datoVacunacion.horaReconstitucion = faker.date.recent();
      datoVacunacion.notificacion = faker.helpers.arrayElement(notificaciones);

      datosVacunacion.push(datoVacunacion);
    }

    await this.datoVacunacionRepository.save(datosVacunacion);
  } //---fin del semillero de los datos ficticios------------------------------------------------------------------------------------------------------
  */
  //--inicio carga de provincias desde CSV------------------------------------------------------------------------------------------------------
  private async loadProvinciasFromCSV() {
    console.log('🗺️ Cargando provincias desde CSV...');

    try {
      const csvPath = path.join(
        process.cwd(),
        'upload_files',
        'catalogos-csv',
        'provincias_ecuador.csv',
      );
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
        const [vigiflow, dhis2, homologada] = lines[i]
          .split(',')
          .map((col) => col.trim().replace(/"/g, ''));

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
  }
  //--fin carga de provincias desde CSV------------------------------------------------------------------------------------------------------

  //--inicio carga de cantones desde CSV------------------------------------------------------------------------------------------------------
  private async loadCantonesFromCSV() {
    console.log('🗺️ Cargando cantones desde CSV...');

    try {
      const csvPath = path.join(
        process.cwd(),
        'upload_files',
        'catalogos-csv',
        'cantones_dhis2_ecuador.csv',
      );
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
        const [vigiflow, dhis2, homologada] = lines[i]
          .split(',')
          .map((col) => col.trim().replace(/"/g, ''));

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
  }
  //--fin carga de cantones desde CSV------------------------------------------------------------------------------------------------------

  //--inicio carga de parroquias desde CSV------------------------------------------------------------------------------------------------------
  private async loadParroquiasFromCSV() {
    console.log('🗺️ Cargando parroquias desde CSV...');

    try {
      const csvPath = path.join(
        process.cwd(),
        'upload_files',
        'catalogos-csv',
        'parroquias_dhis2_ecuador.csv',
      );
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
        const [vigiflow, dhis2, homologada] = lines[i]
          .split(',')
          .map((col) => col.trim().replace(/"/g, ''));

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
  }
  //--fin carga de parroquias desde CSV------------------------------------------------------------------------------------------------------
}
