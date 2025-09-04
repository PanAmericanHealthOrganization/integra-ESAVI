import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { GrupoEtario } from '../entity/grupo-etario.entity';
import { CreateGrupoEtarioDto } from '../dto/create-grupo-etario.dto';
import { UpdateGrupoEtarioDto } from '../dto/update-grupo-etario.dto';

@Injectable()
export class GrupoEtarioService {
  private readonly logger = new Logger(GrupoEtarioService.name);

  constructor(
    @InjectRepository(GrupoEtario, 'POSTGRES_INTEGRATOR_DS')
    private readonly grupoEtarioServiceRepository: Repository<GrupoEtario>,
  ) {}

  create(createDto: CreateGrupoEtarioDto): Promise<GrupoEtario> {
    try {
      const grupoEtario = plainToClass(GrupoEtario, createDto);
      return this.grupoEtarioServiceRepository.save(grupoEtario);
    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      this.logger.log(`Patient has been created: ${JSON.stringify(createDto)}`);
    }
  }

  delete(uuid: string): Promise<GrupoEtario> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<GrupoEtario[]> {
    return this.grupoEtarioServiceRepository.find();
  }

  async findOne(uuid: string): Promise<GrupoEtario> {
    const grupoEtario = await this.grupoEtarioServiceRepository.findOne({
      where: { id: uuid },
    });
    if (grupoEtario) {
      return grupoEtario;
    }
    throw Error('');
  }

  async update(
    uuid: string,
    updateGrupoEtarioDto: UpdateGrupoEtarioDto,
  ): Promise<GrupoEtario> {
    const grupoEtario = await this.findOne(uuid);
    if (grupoEtario) {
      this.grupoEtarioServiceRepository.merge(
        grupoEtario,
        updateGrupoEtarioDto,
      );
      return this.grupoEtarioServiceRepository.save(grupoEtario);
    }
  }

  async findGrupoEtarioByAge(age: number) {
    const grupoEtario = await this.grupoEtarioServiceRepository.findOne({
      where: {
        inicioEdad: LessThanOrEqual(age),
        finEdad: MoreThanOrEqual(age),
        isActive: true,
        isEnabled: true,
      },
    });

    if (grupoEtario) {
      console.log('GrupooEta:::', grupoEtario);

      return grupoEtario;
    }

    throw new Error('No se encontró un grupo etario para esta edad.');
  }
}
