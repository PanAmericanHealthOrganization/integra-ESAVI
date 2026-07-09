import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCatalogoPadreDto, UpdateCatalogoPadreDto } from '../dto';
import { CatalogoPadre } from '../entity/catalogo-padre.entity';

const FALLBACK_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

@Injectable()
export class CatalogoPadreService {
  private readonly logger = new Logger(CatalogoPadreService.name);

  private subcategoriasCache: Map<string, CatalogoPadre[]> | null = null;

  constructor(
    @InjectRepository(CatalogoPadre, 'POSTGRES_INTEGRATOR_DS')
    private readonly catalogoPadreRepository: Repository<CatalogoPadre>,
  ) {}

  async preloadSubcategoriasMap(): Promise<void> {
    const all = await this.catalogoPadreRepository.find({
      where: { isEnabled: true },
      relations: ['padre'],
    });
    this.subcategoriasCache = new Map();
    for (const item of all) {
      const key = item.padre?.codigo;
      if (!key) continue;
      if (!this.subcategoriasCache.has(key)) this.subcategoriasCache.set(key, []);
      this.subcategoriasCache.get(key).push(item);
    }
    this.logger.log(`CatalogoPadre precargado: ${this.subcategoriasCache.size} grupos`);
  }

  clearSubcategoriasCache(): void {
    this.subcategoriasCache = null;
  }

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

  async buscarSubcategoriaPorSimilitud(codigoPadre: string, nombre: string): Promise<CatalogoPadre | null> {
    if (!nombre?.trim()) return null;
    const subcategorias = this.subcategoriasCache
      ? (this.subcategoriasCache.get(codigoPadre) ?? [])
      : await this.catalogoPadreRepository.find({
          where: { padre: { codigo: codigoPadre }, isEnabled: true },
          relations: ['padre'],
        });
    const nombreNorm = this.normalizar(nombre.trim());
    let mejorMatch: CatalogoPadre | null = null;
    let mejorSimilitud = 0;
    for (const sub of subcategorias) {
      const sim = this.calcularSimilitud(nombreNorm, this.normalizar(sub.nombre));
      if (sim > mejorSimilitud) {
        mejorSimilitud = sim;
        mejorMatch = sub;
      }
    }
    if (mejorMatch && mejorSimilitud >= 0.9) {
      this.logger.log(`"${nombre}" → "${mejorMatch.nombre}" en ${codigoPadre} (${(mejorSimilitud * 100).toFixed(1)}%)`);
      return mejorMatch;
    }
    this.logger.warn(`"${nombre}" sin coincidencia ≥90% en ${codigoPadre} (mejor: ${(mejorSimilitud * 100).toFixed(1)}%)`);
    return null;
  }

  private normalizar(texto: string): string {
    return texto.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
  }

  private calcularSimilitud(a: string, b: string): number {
    if (a === b) return 1;
    const la = a.length;
    const lb = b.length;
    if (la === 0 || lb === 0) return 0;
    const matrix: number[][] = Array.from({ length: lb + 1 }, (_, i) =>
      Array.from({ length: la + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= lb; i++) {
      for (let j = 1; j <= la; j++) {
        matrix[i][j] =
          b[i - 1] === a[j - 1]
            ? matrix[i - 1][j - 1]
            : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return (Math.max(la, lb) - matrix[lb][la]) / Math.max(la, lb);
  }
}
