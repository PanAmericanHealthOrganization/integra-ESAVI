import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreatePacienteDhis2Dto, UpdatePacienteDto } from '../dto';
import { Paciente } from '../entity/paciente.entity';
import { CatalogoPadreService } from './catalogo-padre.service';

const ETNIA_CODIGO_PADRE = 'ETNIA';
const GENERO_CODIGO_PADRE = 'GENERO';
// DHIS2 entrega el sexo ya homologado como Hombre/Mujer/Otro, pero se normaliza igual por consistencia.
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
export class PacienteDhis2Service {
  private readonly logger = new Logger(PacienteDhis2Service.name);

  constructor(
    @InjectRepository(Paciente, 'POSTGRES_INTEGRATOR_DS')
    private readonly pacienteRepository: Repository<Paciente>,
    private readonly catalogoPadreService: CatalogoPadreService,
  ) {}

  async create(createDto: CreatePacienteDhis2Dto): Promise<Paciente> {
    try {
      const pacienteExistente = await this.findByCodigoOrigen(createDto.codigoDhis2.trim());

      if (pacienteExistente) {
        await this.update(pacienteExistente.id, createDto);
        return pacienteExistente;
      } else {
        const paciente = plainToClass(Paciente, {
          ...createDto,
          codigoOrigen: createDto.codigoDhis2?.trim(),
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

        const nuevoPaciente = await this.pacienteRepository.create(paciente);
        return await this.pacienteRepository.save(nuevoPaciente);
      }
    } catch (error) {
      console.error('Error en la creación o actualización del paciente:', error);
      throw new Error('Hubo un problema al crear o actualizar el paciente');
    }
  }

  delete(_uuid: string): Promise<Paciente> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<Paciente[]> {
    return this.pacienteRepository.find({ where: { isActive: true } });
  }

  async findOne(uuid: string): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({
      where: { isActive: true, id: uuid },
    });
    if (paciente) {
      return paciente;
    }
    throw new Error(`Paciente ${uuid} is not found`);
  }

  async update(uuid: string, pacienteDto: UpdatePacienteDto): Promise<Paciente> {
    try {
      if (!pacienteDto.sexoPaciente) {
        throw new Error('Sexo del paciente no definido');
      }

      const sexo = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(
        GENERO_CODIGO_PADRE,
        normalizarSexo(pacienteDto?.sexoPaciente),
      );
      const paciente = await this.findOne(uuid);

      if (!paciente) {
        throw new Error('Paciente no encontrado');
      }

      paciente.sexo = sexo;
      await this.pacienteRepository.update(uuid, paciente);
      return await this.findByCodigoOrigen(uuid);
    } catch (error) {
      console.error('Error al actualizar el paciente:', error);
      throw error;
    }
  }

  async findByCodigoOrigen(code: string): Promise<Paciente | null> {
    const paciente = await this.pacienteRepository.findOne({
      where: { codigoOrigen: code },
    });
    return paciente ?? null;
  }
}
