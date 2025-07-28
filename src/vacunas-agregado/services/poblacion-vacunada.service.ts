import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoblacionVacunada } from '../models/poblacion-vacunada.entity';
import {
  PoblacionVacunadaCreateDto,
  PoblacionVacunadaDto,
  PoblacionVacunadaUpdateDto,
} from '../models/dto/poblacion-vacunada.dto';

@Injectable()
export class PoblacionVacunadaService {
  constructor(
    @InjectRepository(PoblacionVacunada)
    private readonly poblacionVacunadaRepository: Repository<PoblacionVacunada>,
  ) {}

  async findAll(
    filters: Partial<PoblacionVacunadaDto>,
  ): Promise<PoblacionVacunadaDto[]> {
    return this.poblacionVacunadaRepository.find({
      where: { ...filters },
    });
  }

  async create(
    create: PoblacionVacunadaCreateDto,
  ): Promise<PoblacionVacunadaDto> {
    try {
      return await this.poblacionVacunadaRepository.save(create);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async update(
    id: number,
    update: PoblacionVacunadaUpdateDto,
  ): Promise<PoblacionVacunadaDto> {
    try {
      await this.poblacionVacunadaRepository.update(id, update);
      return await this.poblacionVacunadaRepository.findOne({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
