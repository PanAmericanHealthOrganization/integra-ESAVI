import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateAntecedenteMedicoDto } from '../dto/create-antecedente-medico.dto';
import { UpdateAntecedenteMedicoDto } from '../dto/update-antecedente-medico.dto';
import { AntecedenteMedico } from '../entity/antecedente-medico.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class AntecedenteMedicoService {
  private readonly logger = new Logger(AntecedenteMedicoService.name);

  constructor(
    @InjectRepository(AntecedenteMedico, 'POSTGRES_INTEGRATOR_DS')
    private readonly antecedenteMedicoRepository: Repository<AntecedenteMedico>,
  ) {}

  async create(
    notificacion: Notificacion,
    createDto: CreateAntecedenteMedicoDto,
  ): Promise<AntecedenteMedico> {
    try {
      const antecedenteMedico = plainToClass(AntecedenteMedico, createDto);
      antecedenteMedico.notificacion = notificacion;
      antecedenteMedico.createdBy = 'AUTOMATICO';
      return this.antecedenteMedicoRepository.save(antecedenteMedico);
    } catch (e) {
      throw e;
    } finally {
      this.logger.log(`AntecedenteMedico has been created: ${JSON.stringify(createDto)}`);
    }
  }

  delete(uuid: string): Promise<AntecedenteMedico> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<AntecedenteMedico[]> {
    return this.antecedenteMedicoRepository.find({
      where: {
        isActive: true,
      },
    });
  }

  async findOne(uuid: string): Promise<AntecedenteMedico> {
    const antecedenteMedico = await this.antecedenteMedicoRepository.findOne({
      where: {
        isActive: true,
        id: uuid,
      },
    });
    if (antecedenteMedico) {
      return antecedenteMedico;
    }
    throw new EntityNotFoundException('AntecedenteMedico', uuid);
  }

  async update(
    uuid: string,
    updateAntecedenteMedicoDto: UpdateAntecedenteMedicoDto, // : Promise<AntecedenteMedico>
  ) {
    // const antecedenteMedico = await this.findOne(uuid);
    // this.antecedenteMedicoRepository.merge(
    //   antecedenteMedico,
    //   updateAntecedenteMedicoDto,
    // );
    // return this.antecedenteMedicoRepository.save(antecedenteMedico);
  }

  async findAntecedenteMedicoByNotificacionUUID(uuidNotificacion: string) {
    return this.antecedenteMedicoRepository.find({
      where: {
        notificacion: {
          id: uuidNotificacion,
        },
      },
    });
  }
}
