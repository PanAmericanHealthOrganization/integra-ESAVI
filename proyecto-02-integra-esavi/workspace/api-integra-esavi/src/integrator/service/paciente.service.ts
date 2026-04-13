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

  /*findAll(): Promise<Paciente[]> {
    return this.pacientRepository.find({
      where: {
        isActive: true,
      },
    });
  }*/

  async findAll(): Promise<Paciente[]> {
    const pacientes = await this.pacientRepository.createQueryBuilder('paciente')
      /*.leftJoinAndSelect('paciente.sexo', 'sexo') // con esto se obtiene el objeto completo, en donde está el valor y no solo el id.
      //.leftJoinAndSelect('paciente.autoIdentificacion', 'autoIdentificacion')
      .addSelect('paciente.codigoVigiflow')  // Incluye el campo 'codigoVigiflow' si es de la subclase 'PacienteVigiFlow'
      .addSelect('paciente.codigoDhis2')    // Incluye el campo 'codigoDhis2' si es de la subclase 'PacienteDhis2'
      .addSelect('paciente."ORIGEN"', 'origen')*/
      .where('paciente.isActive = :isActive', { isActive: true })
      .getRawMany();

  // Se puede acceder al campo como paciente.origen gracias al getter
  pacientes.forEach(p => {
    this.logger.debug(`Paciente completo: ${JSON.stringify(p)}`);
  });
  
    return pacientes;
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
