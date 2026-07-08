import { Injectable, Logger } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdatePacienteDto, CreatePacienteVigiflowDto } from '../dto';
import { Paciente } from '../entity/paciente.entity';
import { plainToClass } from 'class-transformer';
import { CatalogoService } from './catalogo.service';
import { CatalogoPadreService } from './catalogo-padre.service';

const ETNIA_CODIGO_PADRE = 'ETNIA';

@Injectable()
export class PacienteVigiflowService {
  private readonly logger = new Logger(PacienteVigiflowService.name);

  constructor(
    @InjectRepository(Paciente, 'POSTGRES_INTEGRATOR_DS')
    private readonly pacienteRepository: Repository<Paciente>,
    private readonly catalogoService: CatalogoService,
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
          paciente.sexo = await this.catalogoService.findByDescriptionToVigiflow(
            createDto.sexoPaciente,
          );
        }
        if (createDto.autoIdentificacionPaciente) {
          const homologado = await this.catalogoService.findByDescriptionToVigiflow(
            createDto.autoIdentificacionPaciente,
          );
          paciente.autoIdentificacion = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(
            ETNIA_CODIGO_PADRE,
            homologado.homologada,
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
    const sexo = await this.catalogoService.findByDescriptionToVigiflow(
      updatePersonaDto.sexoPaciente,
    );
    const homologado = await this.catalogoService.findByDescriptionToVigiflow(
      updatePersonaDto.autoIdentificacionPaciente,
    );
    paciente.sexo = sexo;
    paciente.autoIdentificacion = await this.catalogoPadreService.buscarSubcategoriaPorSimilitud(
      ETNIA_CODIGO_PADRE,
      homologado.homologada,
    );
    this.pacienteRepository.merge(paciente, updatePersonaDto);
    return this.pacienteRepository.save(paciente);
  }
}
