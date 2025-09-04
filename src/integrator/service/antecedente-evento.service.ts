import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateAntecedenteEventoDto } from '../dto/create-antecedente-evento.dto';
import { UpdateAntecedenteEventoDto } from '../dto/update-antecedente-evento.dto';
import { AntecedenteEvento } from '../entity/antecedente-evento.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class AntecedenteEventoService {
  private readonly logger = new Logger(AntecedenteEventoService.name);

  constructor(
    @InjectRepository(AntecedenteEvento, 'POSTGRES_INTEGRATOR_DS')
    private readonly antecedenteEventoRepository: Repository<AntecedenteEvento>,
  ) {}

  async create(
    notificacion: Notificacion,
    createDto: CreateAntecedenteEventoDto,
  ): Promise<AntecedenteEvento> {
    try {
      const antecedenteEvento = plainToClass(AntecedenteEvento, createDto);
      antecedenteEvento.notificacion = notificacion;
      antecedenteEvento.createdBy = 'AUTOMATICO';
      return this.antecedenteEventoRepository.save(antecedenteEvento);
    } catch (e) {
      throw e;
    } finally {
      this.logger.log(
        `AntecedenteEvento has been created: ${JSON.stringify(createDto)}`,
      );
    }
  }

  async update(
    uuid: string,
    updateAntecedenteEventoDto: UpdateAntecedenteEventoDto,
  ): Promise<AntecedenteEvento> {
    const antecedenteEmbarazo = await this.findOne(uuid);
    this.antecedenteEventoRepository.merge(
      antecedenteEmbarazo,
      updateAntecedenteEventoDto,
    );
    return this.antecedenteEventoRepository.save(antecedenteEmbarazo);
  }

  delete(uuid: string): Promise<AntecedenteEvento> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<AntecedenteEvento[]> {
    return this.antecedenteEventoRepository.find({
      where: {
        isActive: true,
      },
    });
  }

  async findOne(uuid: string): Promise<AntecedenteEvento> {
    const antecedenteEvento = await this.antecedenteEventoRepository.findOne({
      where: {
        isActive: true,
        id: uuid,
      },
    });
    if (antecedenteEvento) {
      return antecedenteEvento;
    }
    throw new EntityNotFoundException('AntecedenteEvento', uuid);
  }

  async findAntecedenteEventoByNotificacionUUID(uuidNotificacion: string) {
    return this.antecedenteEventoRepository.find({
      where: {
        notificacion: {
          id: uuidNotificacion,
        },
      },
    });
  }
}
