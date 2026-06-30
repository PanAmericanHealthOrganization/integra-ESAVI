import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { ILike, Repository } from 'typeorm';
import { CreateCatalogoDto, UpdateCatalogoDto } from '../dto';
import { Catalogo } from '../entity/catalogo.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class CatalogoService {
  private readonly logger = new Logger(CatalogoService.name);

  private vigiflowCache: Map<string, Catalogo> | null = null;

  constructor(
    @InjectRepository(Catalogo, 'POSTGRES_INTEGRATOR_DS')
    private readonly catalogoRepository: Repository<Catalogo>,
  ) {}

  async preloadVigiflowMap(): Promise<void> {
    const all = await this.catalogoRepository.find();
    this.vigiflowCache = new Map(
      all.filter(c => c.vigiflow).map(c => [c.vigiflow.toUpperCase().trim(), c]),
    );
    this.logger.log(`Catálogo Vigiflow precargado: ${this.vigiflowCache.size} entradas`);
  }

  clearVigiflowCache(): void {
    this.vigiflowCache = null;
  }

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
      return catalogo;
    }
    throw new EntityNotFoundException(`Catalogo ${name} not found`);
  }

  async findByDescriptionToVigiflow(name: string) {
    if (this.vigiflowCache) {
      const found = this.vigiflowCache.get(name?.toUpperCase().trim());
      if (found) return found;
      throw new EntityNotFoundException(`Catalogo`, name);
    }
    const catalogo = await this.catalogoRepository.findOne({
      where: { vigiflow: ILike(name.toUpperCase()) },
    });
    if (catalogo) return catalogo;
    throw new EntityNotFoundException(`Catalogo`, name);
  }

  async update(uuid: string, updateCatalogoDto: UpdateCatalogoDto): Promise<Catalogo> {
    const catalogo = await this.findOne(uuid);
    if (catalogo) {
      this.catalogoRepository.merge(catalogo, updateCatalogoDto);
      return this.catalogoRepository.save(catalogo);
    }
  }
}
