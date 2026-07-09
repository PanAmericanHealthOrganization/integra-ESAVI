import { Injectable, Logger } from '@nestjs/common';
import { In, QueryFailedError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { CreatePacienteDhis2Dto, CreatePacienteVigiflowDto, UpdatePacienteDto } from '../dto';
import { Paciente } from '../entity/paciente.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';
import { CatalogoService } from './catalogo.service';
import { CatalogoPadreService } from './catalogo-padre.service';

const ETNIA_CODIGO_PADRE = 'ETNIA';
const GENERO_CODIGO_PADRE = 'GENERO';
// VigiFlow ha exportado históricamente el sexo tanto como "Masculino/Femenino" como "Hombre/Mujer".
// TC_CATALOGO_PADRE/GENERO solo tiene Hombre/Mujer/Otro, así que se homologan los sinónimos antes de buscar por similitud.
const SINONIMOS_SEXO: Record<string, string> = { MASCULINO: 'HOMBRE', FEMENINO: 'MUJER' };
const normalizarSexo = (valor: string): string => SINONIMOS_SEXO[valor?.trim().toUpperCase()] ?? valor;

@Injectable()
export class PacienteService {
  private readonly logger = new Logger(PacienteService.name);

  constructor(
    @InjectRepository(Paciente, 'POSTGRES_INTEGRATOR_DS')
    private readonly pacientRepository: Repository<Paciente>,
    private readonly catalogoService: CatalogoService,
    private readonly catalogoPadreService: CatalogoPadreService,
  ) {}

  /**
   * Homologa el valor crudo de autoidentificación étnica (VigiFlow/DHIS2) al
   * término estandarizado vía TC_CATALOGO y resuelve el registro correspondiente
   * en TC_CATALOGO_PADRE (hijo de ETNIA) por similitud de nombre.
   */
  private async resolveAutoIdentificacionEtnica(
    raw: string,
    homologar: (valor: string) => Promise<{ homologada: string }>,
  ) {
    const homologado = await homologar(raw);
    const etnia = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(
      ETNIA_CODIGO_PADRE,
      homologado.homologada,
    );
    if (!etnia) {
      this.logger.warn(`Autoidentificación étnica "${raw}" (homologada: "${homologado.homologada}") sin coincidencia en TC_CATALOGO_PADRE/ETNIA`);
    }
    return etnia;
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
      if (changed) {
        return await this.pacientRepository.save(existing);
      }
      return existing;
    }

    const paciente = plainToClass(Paciente, { ...createDto, codigoOrigen: codigo }) as Paciente;
    if (createDto.sexoPaciente) {
      paciente.sexo = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(
        GENERO_CODIGO_PADRE,
        normalizarSexo(createDto.sexoPaciente),
      );
    }
    if (createDto.autoIdentificacionPaciente) {
      paciente.autoIdentificacion = await this.resolveAutoIdentificacionEtnica(
        createDto.autoIdentificacionPaciente,
        (v) => this.catalogoService.findByDescriptionToVigiflow(v),
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
        paciente.sexo = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(
          GENERO_CODIGO_PADRE,
          normalizarSexo(createDto.sexoPaciente),
        );
      }
      if (createDto.autoIdentificacionPaciente) {
        const autoId = createDto.autoIdentificacionPaciente.toUpperCase().replace('Í', 'I');
        paciente.autoIdentificacion = await this.resolveAutoIdentificacionEtnica(
          autoId,
          (v) => this.catalogoService.findByDescriptionToDhis2(v),
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

  delete(uuid: string): Promise<Paciente> {
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
      paciente.sexo = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(
        GENERO_CODIGO_PADRE,
        normalizarSexo(updatePersonaDto.sexoPaciente),
      );
    }
    this.pacientRepository.merge(paciente, updatePersonaDto);
    return this.pacientRepository.save(paciente);
  }
}
