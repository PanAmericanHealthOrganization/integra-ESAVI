import { Injectable, Logger } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdatePacienteDto, CreatePacienteVigiflowDto } from '../dto';
import { Paciente } from '../entity/paciente.entity';
import { plainToClass } from 'class-transformer';
import { CatalogoPadreService } from './catalogo-padre.service';

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
export class PacienteVigiflowService {
  private readonly logger = new Logger(PacienteVigiflowService.name);

  constructor(
    @InjectRepository(Paciente, 'POSTGRES_INTEGRATOR_DS')
    private readonly pacienteRepository: Repository<Paciente>,
    private readonly catalogoPadreService: CatalogoPadreService,
  ) {}

  async create(createDto: CreatePacienteVigiflowDto): Promise<Paciente> {
    const codigo = createDto.codigoVigiflow?.trim();
    if (codigo) {
      const paciente = await this.findByCodigoOrigen(codigo);
      if (paciente) {
        return paciente;
      } else {
        const paciente = plainToClass(Paciente, {
          ...createDto,
          codigoOrigen: codigo,
        });
        if (createDto.sexoPaciente) {
          paciente.sexo = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(
            GENERO_CODIGO_PADRE,
            normalizarSexo(createDto.sexoPaciente),
          );
        }
        if (createDto.autoIdentificacionPaciente) {
          paciente.autoIdentificacion = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(
            ETNIA_CODIGO_PADRE,
            normalizarEtnia(createDto.autoIdentificacionPaciente),
          );
        }
        paciente.createdBy = process.env.USUARIO_INSERTA_REGISTRO;
        try {
          return await this.pacienteRepository.save(paciente);
        } catch (error) {
          if (
            error instanceof QueryFailedError &&
            (error.driverError?.code === '23505' ||
              error.driverError?.constraint === 'UQ_4ff577c8ff2c90720f455400a92')
          ) {
            this.logger.warn(
              `Registro duplicado para CODIGO_ORIGEN ${codigo}, reutilizando paciente existente`,
            );
            const existing = await this.findByCodigoOrigen(codigo);
            if (existing) {
              return existing;
            }
          }
          throw error;
        }
      }
    }
    throw new Error('Vigiflow code is a mandatory field');
  }

  delete(uuid: string): Promise<Paciente> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<Paciente[]> {
    return this.pacienteRepository.find({ where: { isActive: true } });
  }

  async findOne(uuid: string): Promise<Paciente> {
    const patient = await this.pacienteRepository.findOne({
      where: { isActive: true, id: uuid },
    });
    if (patient) {
      return patient;
    }
    throw new Error(`Paciente ${uuid} is not found`);
  }

  async findByCodigoOrigen(code: string): Promise<Paciente | null> {
    const paciente = await this.pacienteRepository.findOne({
      where: { codigoOrigen: code?.trim() },
    });
    return paciente ?? null;
  }

  async update(uuid: string, updatePersonaDto: UpdatePacienteDto): Promise<Paciente> {
    const paciente = await this.findOne(uuid);
    const sexo = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(
      GENERO_CODIGO_PADRE,
      normalizarSexo(updatePersonaDto.sexoPaciente),
    );
    paciente.sexo = sexo;
    paciente.autoIdentificacion = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(
      ETNIA_CODIGO_PADRE,
      normalizarEtnia(updatePersonaDto.autoIdentificacionPaciente),
    );
    this.pacienteRepository.merge(paciente, updatePersonaDto);
    return this.pacienteRepository.save(paciente);
  }
}
