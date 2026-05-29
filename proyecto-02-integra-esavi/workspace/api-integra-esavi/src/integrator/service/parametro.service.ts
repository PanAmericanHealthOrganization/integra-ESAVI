import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateParametroDto } from '../dto/create-parametro.dto';
import { UpdateParametroDto } from '../dto/update-parametro.dto';
import { Parametro } from '../entity/parametro.entity';

import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';

@Injectable()
export class ParametroService {
  private readonly logger = new Logger(ParametroService.name);

  constructor(
    @InjectRepository(Parametro, 'POSTGRES_INTEGRATOR_DS')
    private readonly parametroRepository: Repository<Parametro>,
  ) {}

  async create(createDto: CreateParametroDto): Promise<Parametro> {
    try {
      let parametro = await this.findByKey(createDto.clave);
      if (parametro) {
        throw new Error('');
      }
      parametro = plainToClass(Parametro, createDto);
      return this.parametroRepository.save(parametro);
    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      this.logger.log(`Patient has been created: ${JSON.stringify(createDto)}`);
    }
  }

  delete(uuid: string): Promise<Parametro> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<Parametro[]> {
    return this.parametroRepository.find();
  }

  findOne(uuid: string): Promise<Parametro> {
    const parametro = this.parametroRepository.findOne({ where: { id: uuid } });
    if (parametro) {
      return parametro;
    }
    throw Error('');
  }

  async update(uuid: string, updateParametroDto: UpdateParametroDto): Promise<Parametro> {
    const parametro = await this.findOne(uuid);
    if (parametro) {
      this.parametroRepository.merge(parametro, updateParametroDto);
      return this.parametroRepository.save(parametro);
    }
  }

  async findByKey(key: string) {
    return this.parametroRepository.findOne({
      where: { clave: key },
    });
  }

  // findByIntegrationGroup(group: IntegrationGroup) {
  //   return this.parametroRepository.find({
  //     where: {
  //       grupo: group,
  //     },
  //   });
  // }
}
