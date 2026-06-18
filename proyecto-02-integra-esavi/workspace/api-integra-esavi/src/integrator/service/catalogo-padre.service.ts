import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCatalogoPadreDto, UpdateCatalogoPadreDto } from '../dto';
import { CatalogoPadre } from '../entity/catalogo-padre.entity';

const FALLBACK_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

@Injectable()
export class CatalogoPadreService {
  private readonly logger = new Logger(CatalogoPadreService.name);

  constructor(
    @InjectRepository(CatalogoPadre, 'POSTGRES_INTEGRATOR_DS')
    private readonly catalogoPadreRepository: Repository<CatalogoPadre>,
  ) {}

  async create(createDto: CreateCatalogoPadreDto, currentUser: string = FALLBACK_USER): Promise<CatalogoPadre> {
    try {
      const existing = await this.findByCodigo(createDto.codigo);
      if (existing) {
        throw new Error(`Ya existe un catálogo con el código: ${createDto.codigo}`);
      }

      const catalogoPadre = this.catalogoPadreRepository.create({
        codigo: createDto.codigo,
        nombre: createDto.nombre,
        descripcion: createDto.descripcion,
        createdBy: currentUser,
        updatedBy: currentUser,
        isActive: true,
        isEnabled: true,
      });

      if (createDto.padreId) {
        const padre = await this.findOne(createDto.padreId);
        catalogoPadre.padre = padre;
      }

      return this.catalogoPadreRepository.save(catalogoPadre);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  findAll(): Promise<CatalogoPadre[]> {
    return this.catalogoPadreRepository.find({
      where: { isEnabled: true },
      relations: ['padre'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<CatalogoPadre> {
    const catalogoPadre = await this.catalogoPadreRepository.findOne({
      where: { id, isEnabled: true },
      relations: ['padre'],
    });
    if (!catalogoPadre) {
      throw new NotFoundException(`Catálogo con id ${id} no encontrado`);
    }
    return catalogoPadre;
  }

  async update(id: string, updateDto: UpdateCatalogoPadreDto, currentUser: string = FALLBACK_USER): Promise<CatalogoPadre> {
    const catalogoPadre = await this.findOne(id);

    this.catalogoPadreRepository.merge(catalogoPadre, {
      nombre: updateDto.nombre,
      descripcion: updateDto.descripcion,
      updatedBy: currentUser,
      updatedAt: new Date(),
    });

    if (updateDto.padreId !== undefined) {
      catalogoPadre.padre = updateDto.padreId
        ? await this.findOne(updateDto.padreId)
        : null;
    }

    return this.catalogoPadreRepository.save(catalogoPadre);
  }

  async delete(id: string, currentUser: string = FALLBACK_USER): Promise<CatalogoPadre> {
    const catalogoPadre = await this.findOne(id);
    catalogoPadre.isEnabled = false;
    catalogoPadre.deletedAt = new Date();
    catalogoPadre.deletedBy = currentUser;
    return this.catalogoPadreRepository.save(catalogoPadre);
  }

  findByCodigo(codigo: string): Promise<CatalogoPadre> {
    return this.catalogoPadreRepository.findOne({ where: { codigo } });
  }
}
