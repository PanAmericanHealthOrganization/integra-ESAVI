import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateAntecedenteEventoDto, UpdateAntecedenteEventoDto } from '../dto';
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
      // Upsert por notificación: es seguro reprocesar este método tanto en la
      // creación inicial como al reimportar un registro DHIS2 ya existente.
      const existente = await this.antecedenteEventoRepository.findOne({
        where: { notificacion: { id: notificacion.id } },
      });

      if (existente) {
        Object.keys(createDto).forEach((key) => {
          if (createDto[key] !== undefined && createDto[key] !== null) {
            existente[key] = createDto[key];
          }
        });
        return this.antecedenteEventoRepository.save(existente);
      }

      const antecedenteEvento = plainToClass(AntecedenteEvento, createDto);
      antecedenteEvento.notificacion = notificacion;
      antecedenteEvento.createdBy = 'AUTOMATICO';
      return this.antecedenteEventoRepository.save(antecedenteEvento);
    } catch (e) {
      throw e;
    } finally {
      this.logger.log(
        `Antecedente Evento Adverso ha sido procesado: ${JSON.stringify(createDto)}`,
      );
    }
  }

  async update(
    uuid: string,
    updateAntecedenteEventoDto: UpdateAntecedenteEventoDto,
  ): Promise<AntecedenteEvento> {
    const antecedenteEvento = await this.findOne(uuid);
    this.antecedenteEventoRepository.merge(antecedenteEvento, updateAntecedenteEventoDto);
    return this.antecedenteEventoRepository.save(antecedenteEvento);
  }

  delete(_uuid: string): Promise<AntecedenteEvento> {
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
      where: { notificacion: { id: uuidNotificacion } },
    });
  }
}
