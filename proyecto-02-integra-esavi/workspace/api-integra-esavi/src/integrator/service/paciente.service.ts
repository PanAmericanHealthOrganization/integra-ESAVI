import { Injectable, Logger } from '@nestjs/common';
import { In, QueryFailedError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { ResolutorService } from 'src/homologator/service/resolutor.service';
import { CreatePacienteDhis2Dto, CreatePacienteVigiflowDto, UpdatePacienteDto } from '../dto';
import { Paciente } from '../entity/paciente.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';
import { CatalogoPadreService } from './catalogo-padre.service';
import { CatalogoPadre } from '../entity/catalogo-padre.entity';

const ETNIA_CODIGO_PADRE = 'ETNIA';
const GENERO_CODIGO_PADRE = 'GENERO';
// VigiFlow ha exportado históricamente el sexo tanto como "Masculino/Femenino" como "Hombre/Mujer".
// TC_CATALOGO_PADRE/GENERO solo tiene Hombre/Mujer/Otro, así que se homologan los sinónimos antes de buscar por similitud.
const SINONIMOS_SEXO: Record<string, string> = { MASCULINO: 'HOMBRE', FEMENINO: 'MUJER' };
const normalizarSexo = (valor: string): string => SINONIMOS_SEXO[valor?.trim().toUpperCase()] ?? valor;

// DHIS2 entrega la etnia en inglés y VigiFlow con variantes que no matchean por similitud
// contra TC_CATALOGO_PADRE (ej. "Afroecuatoriano" vs "Afrodescendiente"), así que se homologan
// los alias semánticos antes de buscar por similitud. Las variantes "/A" las resuelve
// CatalogoPadreService.normalizar() cortando en el primer '/'.
const SINONIMOS_ETNIA: Record<string, string> = {
  AFROECUATORIANO: 'AFRODESCENDIENTE',
  'AFRO-ECUADORIAN': 'AFRODESCENDIENTE',
  INDIGENOUS: 'INDIGENA',
};
const normalizarEtnia = (valor: string): string => {
  const clave = valor?.trim().toUpperCase().split('/')[0];
  return SINONIMOS_ETNIA[clave] ?? valor;
};

@Injectable()
export class PacienteService {
  private readonly logger = new Logger(PacienteService.name);

  constructor(
    @InjectRepository(Paciente, 'POSTGRES_INTEGRATOR_DS')
    private readonly pacientRepository: Repository<Paciente>,
    private readonly catalogoPadreService: CatalogoPadreService,
    private readonly resolutorService: ResolutorService,
  ) {}

  /**
   * Resuelve el valor crudo de autoidentificación étnica (VigiFlow/DHIS2) al
   * registro correspondiente en TC_CATALOGO_PADRE (hijo de ETNIA) por similitud de nombre.
   */
  private async resolveAutoIdentificacionEtnica(raw: string) {
    const etnia = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(
      ETNIA_CODIGO_PADRE,
      normalizarEtnia(raw),
    );
    if (!etnia) {
      this.logger.warn(`Autoidentificación étnica "${raw}" sin coincidencia en TC_CATALOGO_PADRE/ETNIA`);
    }
    return etnia;
  }

  /**
   * Resuelve el sexo crudo (VigiFlow/DHIS2) usando primero TR_HOMOLOGADOR/TR_HOMOLOGACION_REGLA
   * (entity="Paciente", field="sexo"), donde TARGET_VALUE guarda el id del registro correspondiente
   * en TC_CATALOGO_PADRE. Si no hay regla configurada para ese sourceSystem (o el id referenciado
   * ya no existe), cae al match por similitud de nombre contra TC_CATALOGO_PADRE/GENERO.
   */
  private async resolveSexo(sourceSystem: string, raw: string): Promise<CatalogoPadre | null> {
    if (!raw?.trim()) return null;

    const resultado = await this.resolutorService.resolver({
      entity: 'Paciente',
      field: 'sexo',
      sourceSystem,
      sourceValue: raw,
    });

    if (resultado.coincidio && resultado.valorDestino) {
      const catalogo = await this.catalogoPadreService.findOne(resultado.valorDestino).catch(() => null);
      if (catalogo) return catalogo;
      this.logger.warn(
        `Regla de homologación Paciente.sexo (${sourceSystem}) apunta a un TC_CATALOGO_PADRE inexistente: "${resultado.valorDestino}"`,
      );
    }

    const sexo = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(
      GENERO_CODIGO_PADRE,
      normalizarSexo(raw),
    );
    if (!sexo) {
      this.logger.warn(`Sexo "${raw}" (${sourceSystem}) sin coincidencia en homologación ni en TC_CATALOGO_PADRE/GENERO`);
    }
    return sexo;
  }

  async findByCodigosOrigen(codigos: string[]): Promise<Map<string, Paciente>> {
    if (!codigos.length) return new Map();
    const pacientes = await this.pacientRepository.find({ where: { codigoOrigen: In(codigos) } });
    return new Map(pacientes.map(p => [p.codigoOrigen?.trim(), p]));
  }

  async createFromVigiflow(createDto: CreatePacienteVigiflowDto, preloaded?: Paciente): Promise<Paciente> {
    const codigo = createDto.codigoVigiflow?.trim();
    if (!codigo) throw new Error('Vigiflow code is a mandatory field');

    const existing = preloaded ?? await this.findByCodigoOrigen(codigo);
    if (existing) {
      let changed = false;
      const incomingId = createDto.identificacion ?? null;
      if (incomingId !== existing.identificacion) {
        existing.identificacion = incomingId;
        changed = true;
      }
      if (createDto.fechaNacimiento) {
        const incomingTime = new Date(createDto.fechaNacimiento).getTime();
        const existingTime = existing.fechaNacimiento ? new Date(existing.fechaNacimiento).getTime() : null;
        if (incomingTime !== existingTime) {
          existing.fechaNacimiento = createDto.fechaNacimiento;
          changed = true;
        }
      }
      // El paciente pudo haberse creado sin sexo/etnia resueltos (p. ej. antes de que
      // TC_CATALOGO_PADRE/GENERO tuviera los valores cargados, o porque la primera
      // notificación no traía el dato). Se reintenta la homologación en cada sync
      // mientras el campo siga vacío, para no dejarlo huérfano indefinidamente.
      if (!existing.sexo && createDto.sexoPaciente) {
        const sexo = await this.resolveSexo('VIGIFLOW', createDto.sexoPaciente);
        if (sexo) {
          existing.sexo = sexo;
          changed = true;
        }
      }
      if (!existing.autoIdentificacion && createDto.autoIdentificacionPaciente) {
        const autoIdentificacion = await this.resolveAutoIdentificacionEtnica(
          createDto.autoIdentificacionPaciente,
        );
        if (autoIdentificacion) {
          existing.autoIdentificacion = autoIdentificacion;
          changed = true;
        }
      }
      if (changed) {
        return await this.pacientRepository.save(existing);
      }
      return existing;
    }

    const paciente = plainToClass(Paciente, { ...createDto, codigoOrigen: codigo }) as Paciente;
    if (createDto.sexoPaciente) {
      paciente.sexo = await this.resolveSexo('VIGIFLOW', createDto.sexoPaciente);
    }
    if (createDto.autoIdentificacionPaciente) {
      paciente.autoIdentificacion = await this.resolveAutoIdentificacionEtnica(
        createDto.autoIdentificacionPaciente,
      );
    }
    paciente.createdBy = process.env.USUARIO_INSERTA_REGISTRO;
    try {
      return await this.pacientRepository.save(paciente);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError?.code === '23505' ||
          error.driverError?.constraint === 'UQ_4ff577c8ff2c90720f455400a92')
      ) {
        this.logger.warn(`Registro duplicado para CODIGO_ORIGEN ${codigo}, reutilizando paciente existente`);
        const retried = await this.findByCodigoOrigen(codigo);
        if (retried) return retried;
      }
      throw error;
    }
  }

  async createFromDhis2(createDto: CreatePacienteDhis2Dto): Promise<Paciente> {
    try {
      const codigo = createDto.codigoDhis2?.trim();
      const existing = await this.findByCodigoOrigen(codigo);
      if (existing) {
        await this.update(existing.id, createDto);
        return existing;
      }

      const paciente = plainToClass(Paciente, { ...createDto, codigoOrigen: codigo }) as Paciente;
      if (createDto.sexoPaciente) {
        paciente.sexo = await this.resolveSexo('DHIS2', createDto.sexoPaciente);
      }
      if (createDto.autoIdentificacionPaciente) {
        paciente.autoIdentificacion = await this.resolveAutoIdentificacionEtnica(
          createDto.autoIdentificacionPaciente,
        );
      }
      paciente.createdBy = process.env.USUARIO_INSERTA_REGISTRO;
      return await this.pacientRepository.save(paciente);
    } catch (error) {
      console.error('Error en la creación o actualización del paciente:', error);
      throw new Error('Hubo un problema al crear o actualizar el paciente');
    }
  }

  async findByCodigoOrigen(code: string): Promise<Paciente | null> {
    return (await this.pacientRepository.findOne({ where: { codigoOrigen: code?.trim() } })) ?? null;
  }

  delete(_uuid: string): Promise<Paciente> {
    return Promise.resolve(undefined);
  }

  async findAll(): Promise<Paciente[]> {
    return this.pacientRepository.find({ where: { isActive: true } });
  }

  async findOne(uuid: string): Promise<Paciente> {
    const patient = await this.pacientRepository.findOne({
      where: { isActive: true, id: uuid },
    });
    if (patient) return patient;
    throw new EntityNotFoundException('Paciente', uuid);
  }

  async update(uuid: string, updatePersonaDto: UpdatePacienteDto): Promise<Paciente> {
    const paciente = await this.findOne(uuid);
    if (updatePersonaDto.sexoPaciente) {
      paciente.sexo = await this.resolveSexo('DHIS2', updatePersonaDto.sexoPaciente);
    }
    if (updatePersonaDto.autoIdentificacionPaciente) {
      const autoIdentificacion = await this.resolveAutoIdentificacionEtnica(
        updatePersonaDto.autoIdentificacionPaciente,
      );
      if (autoIdentificacion) {
        paciente.autoIdentificacion = autoIdentificacion;
      }
    }
    this.pacientRepository.merge(paciente, updatePersonaDto);
    return this.pacientRepository.save(paciente);
  }
}
