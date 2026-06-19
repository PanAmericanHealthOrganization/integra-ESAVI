import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreatePacienteDhis2Dto, UpdatePacienteDto } from '../dto';
import { Paciente } from '../entity/paciente.entity';
import { CatalogoService } from './catalogo.service';

@Injectable()
export class PacienteDhis2Service {
  private readonly logger = new Logger(PacienteDhis2Service.name);

  constructor(
    @InjectRepository(Paciente, 'POSTGRES_INTEGRATOR_DS')
    private readonly pacienteRepository: Repository<Paciente>,
    private readonly catalogoService: CatalogoService,
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
          const sexo = await this.catalogoService.findByDescriptionToDhis2(createDto.sexoPaciente);
          paciente.sexo = sexo;
        }

        if (createDto.autoIdentificacionPaciente) {
          const autoIdentificacionPaciente = createDto.autoIdentificacionPaciente
            .toUpperCase()
            .replace('Í', 'I');
          const autoIdentificacion = await this.catalogoService.findByDescriptionToDhis2(
            autoIdentificacionPaciente,
          );
          paciente.autoIdentificacion = autoIdentificacion;
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

  delete(uuid: string): Promise<Paciente> {
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

      const sexo = await this.catalogoService.findByDescriptionToDhis2(pacienteDto?.sexoPaciente);
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
