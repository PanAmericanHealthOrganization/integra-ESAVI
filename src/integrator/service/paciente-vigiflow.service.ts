import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdatePacienteDto } from '../dto/update-paciente.dto';
import { PacienteVigiflow } from '../entity/paciente-vigiflow.entity';
import { plainToClass } from 'class-transformer';
import { CatalogoService } from './catalogo.service';
import { CreatePacienteVigiflowDto } from '../dto/create-paciente-vigiflow.dto';

@Injectable()
export class PacienteVigiflowService {
  private readonly logger = new Logger(PacienteVigiflowService.name);

  constructor(
    @InjectRepository(PacienteVigiflow, 'POSTGRES_INTEGRATOR_DS')
    private readonly pacienteVigiflowRepository: Repository<PacienteVigiflow>,
    private readonly catalogoService: CatalogoService,
  ) {}

  async create(
    createDto: CreatePacienteVigiflowDto,
  ): Promise<PacienteVigiflow> {
    if (createDto.codigoVigiflow) {
      const paciente = await this.findByVigiflowCode(createDto.codigoVigiflow);
      if (paciente) {
        return paciente;
      } else {
        const paciente = plainToClass(PacienteVigiflow, createDto);
        if (createDto.sexoPaciente) {
          paciente.sexo =
            await this.catalogoService.findByDescriptionToVigiflow(
              createDto.sexoPaciente,
            );
        }
        if (createDto.autoIdentificacionPaciente) {
          paciente.autoIdentificacion =
            await this.catalogoService.findByDescriptionToVigiflow(
              createDto.autoIdentificacionPaciente,
            );
        }
        paciente.createdBy = process.env.USUARIO_INSERTA_REGISTRO;
        return this.pacienteVigiflowRepository.save(paciente);
      }
    }
    throw new Error('Vigiflow code is a mandatory field');
  }

  delete(uuid: string): Promise<PacienteVigiflow> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<PacienteVigiflow[]> {
    return this.pacienteVigiflowRepository.find({
      where: {
        isActive: true,
      },
    });
  }

  async findOne(uuid: string): Promise<PacienteVigiflow> {
    const patient = await this.pacienteVigiflowRepository.findOne({
      where: {
        isActive: true,
        id: uuid,
      },
    });
    if (patient) {
      return patient;
    }
    throw new Error(`Paciente ${uuid} is not found`);
  }

  async findByVigiflowCode(code: string) {
    const paciente = await this.pacienteVigiflowRepository.findOne({
      where: {
        codigoVigiflow: code,
      },
    });
    if (paciente) {
      return paciente;
    }
    return null;
  }

  async update(
    uuid: string,
    updatePersonaDto: UpdatePacienteDto,
  ): Promise<PacienteVigiflow> {
    const pacienteVigiflow = await this.findOne(uuid);
    const sexo = await this.catalogoService.findByDescriptionToVigiflow(
      updatePersonaDto.sexoPaciente,
    );
    const autoidentificacion =
      await this.catalogoService.findByDescriptionToVigiflow(
        updatePersonaDto.autoIdentificacionPaciente,
      );
    pacienteVigiflow.sexo = sexo;
    pacienteVigiflow.autoIdentificacion = autoidentificacion;
    this.pacienteVigiflowRepository.merge(pacienteVigiflow, updatePersonaDto);
    return this.pacienteVigiflowRepository.save(pacienteVigiflow);
  }
}
