import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateAntecedenteMedicoDto, UpdateAntecedenteMedicoDto } from '../dto';
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
      // Upsert por notificación: seguro de reprocesar tanto en la creación inicial
      // como al reimportar un registro DHIS2 ya existente.
      const existente = await this.antecedenteMedicoRepository.findOne({
        where: { notificacion: { id: notificacion.id } },
      });

      if (existente) {
        Object.keys(createDto).forEach((key) => {
          if (createDto[key] !== undefined && createDto[key] !== null) {
            existente[key] = createDto[key];
          }
        });
        return this.antecedenteMedicoRepository.save(existente);
      }

      const antecedenteMedico = plainToClass(AntecedenteMedico, createDto);
      antecedenteMedico.notificacion = notificacion;
      antecedenteMedico.createdBy = 'AUTOMATICO';
      return this.antecedenteMedicoRepository.save(antecedenteMedico);
    } catch (e) {
      throw e;
    } finally {
      this.logger.log(`AntecedenteMedico ha sido procesado: ${JSON.stringify(createDto)}`);
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
