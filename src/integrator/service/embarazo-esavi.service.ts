import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Notificacion } from '../entity/notificacion.entity';
import { EmbarazoEsavi } from '../entity/embarazo-esavi.entity';
import { CreateEmbarazoEsaviDto } from '../dto/create-embarazo-esavi.dto';
import { UpdateEmbarazoEsaviDto } from '../dto/update-embarazo-esavi.dto';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class EmbarazoEsaviService {
  private readonly logger = new Logger(EmbarazoEsaviService.name);

  constructor(
    @InjectRepository(EmbarazoEsavi, 'POSTGRES_INTEGRATOR_DS')
    private readonly embarazoEsaviRepository: Repository<EmbarazoEsavi>,
  ) {}

  async create(
    notificacion: Notificacion,
    createDto: CreateEmbarazoEsaviDto,
  ): Promise<EmbarazoEsavi> {
    try {
      const embarazoEsavi = plainToClass(EmbarazoEsavi, createDto);
      embarazoEsavi.notificacion = notificacion;
      embarazoEsavi.createdAt = new Date();
      return this.embarazoEsaviRepository.save(embarazoEsavi);
    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      this.logger.log(
        `EmbarazoEsavi has been created: ${JSON.stringify(createDto)}`,
      );
    }
  }

  delete(uuid: string): Promise<EmbarazoEsavi> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<EmbarazoEsavi[]> {
    return this.embarazoEsaviRepository.find();
  }

  async findOne(uuid: string): Promise<EmbarazoEsavi> {
    const desenlaceEsavi = await this.embarazoEsaviRepository.findOne({
      where: { id: uuid },
    });
    if (desenlaceEsavi) {
      return desenlaceEsavi;
    }
    throw new EntityNotFoundException('EmbarazoEsavi', uuid);
  }

  async update(
    uuid: string,
    embarazoEsaviDto: UpdateEmbarazoEsaviDto,
  ): Promise<EmbarazoEsavi> {
    const embarazoEsavi = await this.findOne(uuid);
    if (embarazoEsavi) {
      this.embarazoEsaviRepository.merge(embarazoEsavi, embarazoEsaviDto);
      return this.embarazoEsaviRepository.save(embarazoEsavi);
    }
  }
}
