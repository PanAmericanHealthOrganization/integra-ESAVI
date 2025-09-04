import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Catalogo } from '../entity/catalogo.entity';
import { CreateCatalogoDto } from '../dto/create-catalogo.dto';
import { UpdateCatalogoDto } from '../dto/update-catalogo.dto';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class CatalogoService {
  private readonly logger = new Logger(CatalogoService.name);

  constructor(
    @InjectRepository(Catalogo, 'POSTGRES_INTEGRATOR_DS')
    private readonly catalogoRepository: Repository<Catalogo>,
  ) {}

  async create(createDto: CreateCatalogoDto): Promise<Catalogo> {
    try {
      const catalogo = plainToClass(Catalogo, createDto);
      return this.catalogoRepository.save(catalogo);
    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      this.logger.log(`Patient has been created: ${JSON.stringify(createDto)}`);
    }
  }

  delete(uuid: string): Promise<Catalogo> {
    // TODO: Implementar método delete
    return Promise.resolve(undefined);
  }

  findAll(): Promise<Catalogo[]> {
    return this.catalogoRepository.find();
  }

  async findOne(uuid: string): Promise<Catalogo> {
    const catalogo = await this.catalogoRepository.findOne({
      where: { id: uuid },
    });
    if (catalogo) {
      return catalogo;
    }
    throw Error('');
  }

  async findByDescriptionToDhis2(name: string) {
    const catalogo = await this.catalogoRepository.findOne({
      where: {
        dhis2: ILike(name.toUpperCase()),
      },
    });
    if (catalogo) {
      console.log('CatalogoEncontrado ::', catalogo);

      return catalogo;
    }
    throw new EntityNotFoundException(`Catalogo ${name} not found`);
  }

  async findByDescriptionToVigiflow(name: string) {
    const catalogo = await this.catalogoRepository.findOne({
      where: {
        vigiflow: ILike(name.toUpperCase()),
      },
    });
    if (catalogo) {
      return catalogo;
    }
    throw new EntityNotFoundException(`Catalogo`, name);
  }

  async update(
    uuid: string,
    updateCatalogoDto: UpdateCatalogoDto,
  ): Promise<Catalogo> {
    const catalogo = await this.findOne(uuid);
    if (catalogo) {
      this.catalogoRepository.merge(catalogo, updateCatalogoDto);
      return this.catalogoRepository.save(catalogo);
    }
  }
}
