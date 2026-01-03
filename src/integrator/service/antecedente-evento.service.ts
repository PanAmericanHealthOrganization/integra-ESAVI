import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateAntecedenteEventoDto } from '../dto/create-antecedente-evento.dto';
import { UpdateAntecedenteEventoDto } from '../dto/update-antecedente-evento.dto';
import { AntecedenteEvento } from '../entity/antecedente-evento.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';
import { CatalogoService } from './catalogo.service';

@Injectable()
export class AntecedenteEventoService {
  private readonly logger = new Logger(AntecedenteEventoService.name);

  constructor(
    @InjectRepository(AntecedenteEvento, 'POSTGRES_INTEGRATOR_DS')
    private readonly antecedenteEventoRepository: Repository<AntecedenteEvento>,
    private readonly catalogoService: CatalogoService,
  ) {}

  async create(
    notificacion: Notificacion,
    createDto: CreateAntecedenteEventoDto,
  ): Promise<AntecedenteEvento> {
    try {
      const antecedenteEvento = plainToClass(AntecedenteEvento, createDto);
      antecedenteEvento.notificacion = notificacion;
      antecedenteEvento.createdBy = 'AUTOMATICO';
      antecedenteEvento.alergiaMedicamento = await this.catalogoService.findByDescriptionToDhis2(
        createDto.alergiaMedicamento,
      );
      antecedenteEvento.alergiaAlimentos = await this.catalogoService.findByDescriptionToDhis2(
        createDto.alergiaAlimentos,
      );
      antecedenteEvento.alergiaInsectos = await this.catalogoService.findByDescriptionToDhis2(
        createDto.alergiaInsectos,
      );
      antecedenteEvento.alergiaPolvo = await this.catalogoService.findByDescriptionToDhis2(
        createDto.alergiaPolvo,
      );
      return this.antecedenteEventoRepository.save(antecedenteEvento);
    } catch (e) {
      throw e;
    } finally {
      this.logger.log(
        `Antecedente Evento Adverso ha sido creado: ${JSON.stringify(createDto)}`,
      );
    }
  }

  async update(
    uuid: string,
    updateAntecedenteEventoDto: UpdateAntecedenteEventoDto,
  ): Promise<AntecedenteEvento> {
    const antecedenteEvento = await this.findOne(uuid);
    const updatedAlergiaMedicamento = await this.catalogoService.findByDescriptionToDhis2(
      updateAntecedenteEventoDto.alergiaMedicamento,
    );
    const updatedAlergiaAlimentos = await this.catalogoService.findByDescriptionToDhis2(
      updateAntecedenteEventoDto.alergiaAlimentos,
    );
    const updatedAlergiaInsectos = await this.catalogoService.findByDescriptionToDhis2(
      updateAntecedenteEventoDto.alergiaInsectos,
    );
    const updatedAlergiaPolvo = await this.catalogoService.findByDescriptionToDhis2(
      updateAntecedenteEventoDto.alergiaPolvo,
    );
    this.antecedenteEventoRepository.merge(
      antecedenteEvento, updatedAlergiaMedicamento, updatedAlergiaAlimentos, updatedAlergiaInsectos, updatedAlergiaPolvo,
      //updateAntecedenteEventoDto,
    );
    return this.antecedenteEventoRepository.save(antecedenteEvento);
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
