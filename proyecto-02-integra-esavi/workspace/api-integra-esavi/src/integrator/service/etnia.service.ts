import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateEtniaDto } from '../dto/create-etnia.dto';
import { UpdateEtniaDto } from '../dto/update-etnia.dto';
import { Etnia } from '../entity/etnia.entity';

@Injectable()
export class EtniaService {
  private readonly logger = new Logger(EtniaService.name);

  constructor(
    @InjectRepository(Etnia, 'POSTGRES_INTEGRATOR_DS')
    private readonly etniaRepository: Repository<Etnia>,
  ) {}

  create(createDto: CreateEtniaDto): Promise<Etnia> {
    try {
      const etnia = plainToClass(Etnia, {
        ...createDto,
        createdBy: 'System',
        createdAt: new Date(),
        updatedBy: 'System',
        updatedAt: new Date(),
        isActive: true,
        isEnabled: true,
      });
      return this.etniaRepository.save(etnia);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  findAll(): Promise<Etnia[]> {
    return this.etniaRepository.find({ where: { isActive: true } });
  }

  async findOne(uuid: string): Promise<Etnia> {
    const etnia = await this.etniaRepository.findOne({ where: { id: uuid } });
    if (!etnia) {
      throw new NotFoundException(`Etnia con id ${uuid} no encontrada`);
    }
    return etnia;
  }

  async update(uuid: string, updateDto: UpdateEtniaDto): Promise<Etnia> {
    const etnia = await this.findOne(uuid);
    const campos = Object.fromEntries(
      Object.entries(updateDto).filter(([, v]) => v !== undefined),
    );
    this.etniaRepository.merge(etnia, campos);
    return this.etniaRepository.save(etnia);
  }

  async remove(uuid: string, deletedBy: string): Promise<Etnia> {
    const etnia = await this.findOne(uuid);
    etnia.isActive = false;
    etnia.isEnabled = false;
    etnia.deletedAt = new Date();
    etnia.deletedBy = deletedBy;
    return this.etniaRepository.save(etnia);
  }
}
