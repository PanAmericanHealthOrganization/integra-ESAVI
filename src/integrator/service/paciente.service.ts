import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePacienteDto } from '../dto/create-paciente.dto';
import { UpdatePacienteDto } from '../dto/update-paciente.dto';
import { Paciente } from '../entity/paciente.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class PacienteService {
  private readonly logger = new Logger(PacienteService.name);

  constructor(
    @InjectRepository(Paciente, 'POSTGRES_INTEGRATOR_DS')
    private readonly pacientRepository: Repository<Paciente>,
  ) {}

  async create(createPersonaDto: CreatePacienteDto): Promise<Paciente> {
    throw new Error('No soportado');
  }

  delete(uuid: string): Promise<Paciente> {
    throw new Error('No soportado');
  }

  findAll(): Promise<Paciente[]> {
    return this.pacientRepository.find({
      where: {
        isActive: true,
      },
    });
  }

  async findOne(uuid: string): Promise<Paciente> {
    const patient = await this.pacientRepository.findOne({
      where: {
        isActive: true,
        id: uuid,
      },
    });
    if (patient) {
      return patient;
    }
    throw new EntityNotFoundException('Paciente', uuid);
  }

  async update(
    uuid: string,
    updatePersonaDto: UpdatePacienteDto,
  ): Promise<Paciente> {
    throw new Error('No soportado');
  }
}
