import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateGeneroDto } from '../dto/create-genero.dto';
import { UpdateGeneroDto } from '../dto/update-genero.dto';
import { Genero } from '../entity/genero.entity';

@Injectable()
export class GeneroService {
  private readonly logger = new Logger(GeneroService.name);

  constructor(
    @InjectRepository(Genero, 'POSTGRES_INTEGRATOR_DS')
    private readonly generoRepository: Repository<Genero>,
  ) {}

  create(createDto: CreateGeneroDto): Promise<Genero> {
    try {
      const genero = plainToClass(Genero, {
        ...createDto,
        createdBy: 'System',
        createdAt: new Date(),
        updatedBy: 'System',
        updatedAt: new Date(),
        isActive: true,
        isEnabled: true,
      });
      return this.generoRepository.save(genero);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  findAll(): Promise<Genero[]> {
    return this.generoRepository.find({ where: { isActive: true } });
  }

  async findOne(uuid: string): Promise<Genero> {
    const genero = await this.generoRepository.findOne({ where: { id: uuid } });
    if (!genero) {
      throw new NotFoundException(`Género con id ${uuid} no encontrado`);
    }
    return genero;
  }

  async update(uuid: string, updateDto: UpdateGeneroDto): Promise<Genero> {
    const genero = await this.findOne(uuid);
    const campos = Object.fromEntries(
      Object.entries(updateDto).filter(([, v]) => v !== undefined),
    );
    this.generoRepository.merge(genero, campos);
    return this.generoRepository.save(genero);
  }

  async remove(uuid: string, deletedBy: string): Promise<Genero> {
    const genero = await this.findOne(uuid);
    genero.isActive = false;
    genero.isEnabled = false;
    genero.deletedAt = new Date();
    genero.deletedBy = deletedBy;
    return this.generoRepository.save(genero);
  }
}
