import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vacunometro } from '../entity/vacunometro.entity';

@Injectable()
export class VacunometroService {
  constructor(
    @InjectRepository(Vacunometro)
    private readonly vacunometroRepository: Repository<Vacunometro>,
  ) {}

  private readonly logger = new Logger(VacunometroService.name);

  async findAll(): Promise<Vacunometro[]> {
    return this.vacunometroRepository.find();
  }

  async findOne(id: string): Promise<Vacunometro> {
    return this.vacunometroRepository.findOne({ where: { id } });
  }

  async create(vacunometro: Vacunometro): Promise<Vacunometro> {
    return this.vacunometroRepository.save(vacunometro);
  }

  async update(id: string, vacunometro: Vacunometro): Promise<Vacunometro> {
    return this.vacunometroRepository.save(vacunometro);
  }

  async delete(id: string): Promise<void> {
    await this.vacunometroRepository.delete(id);
  }

  async createMany(vacunometro: Vacunometro[]): Promise<Vacunometro[]> {
    try {
      return this.vacunometroRepository.save(vacunometro);
    } catch (e) {
      this.logger.error(`Error al procesar los datos de vacuna: ${e.message}`);
      throw new Error(
        'Hubo un problema al crear o actualizar los datos de vacuna',
      );
    } finally {
      this.logger.log(
        `DatoVacuna ha sido procesado: ${JSON.stringify(vacunometro)}`,
      );
    }
  }
}
