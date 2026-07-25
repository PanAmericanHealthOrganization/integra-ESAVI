import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { CausalidadEsavi } from '../entity/causalidad-esavi.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { CreateCausalidadEsaviDto } from '../dto';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class CausalidadEsaviService {
  private readonly logger = new Logger(CausalidadEsaviService.name);

  constructor(
    @InjectRepository(CausalidadEsavi, 'POSTGRES_INTEGRATOR_DS')
    private readonly causalidadEsaviRepository: Repository<CausalidadEsavi>,
  ) {}

  async create(
    notificacion: Notificacion,
    createDto: CreateCausalidadEsaviDto,
  ): Promise<CausalidadEsavi> {
    try {
      // Upsert por notificación: antes esta fila quedaba huérfana (sin FK a
      // Notificacion) y cada reimport insertaba una copia nueva.
      const existente = await this.causalidadEsaviRepository.findOne({
        where: { notificacion: { id: notificacion.id } },
      });

      if (existente) {
        Object.keys(createDto).forEach((key) => {
          if (createDto[key] !== undefined && createDto[key] !== null) {
            existente[key] = createDto[key];
          }
        });
        return this.causalidadEsaviRepository.save(existente);
      }

      const causalidadEsavi = plainToClass(CausalidadEsavi, createDto);
      causalidadEsavi.notificacion = notificacion;
      causalidadEsavi.createdBy = 'AUTOMATICO';
      return this.causalidadEsaviRepository.save(causalidadEsavi);
    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      this.logger.log(
        `CausalidadEsavi ha sido procesada: ${JSON.stringify(createDto)}`,
      );
    }
  }

  delete(_uuid: string): Promise<CausalidadEsavi> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<CausalidadEsavi[]> {
    return this.causalidadEsaviRepository.find();
  }

  async findOne(uuid: string): Promise<CausalidadEsavi> {
    const desenlaceEsavi = await this.causalidadEsaviRepository.findOne({
      where: { id: uuid },
    });
    if (desenlaceEsavi) {
      return desenlaceEsavi;
    }
    throw new EntityNotFoundException('CausalidadEsavi', uuid);
  }

  // async update(
  //   uuid: string,
  //   causalidadEsaviDto: UpdateCausalidadEsaviDto,
  // ): Promise<CausalidadEsavi> {
  //   const causalidadEsavi = await this.findOne(uuid);
  //   // if (causalidadEsavi) {
  //   //   this.causalidadEsaviRepository.merge(causalidadEsavi, causalidadEsaviDto);
  //   //   return this.causalidadEsaviRepository.save(causalidadEsavi);
  //   // }
  // }
}
