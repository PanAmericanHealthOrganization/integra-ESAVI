import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProvinciaDto, UpdateProvinciaDto } from '../dto/provincia.dto';
import { Provincia } from '../entity/provincia.entity';

const FALLBACK_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

const toSentenceCase = (text: string): string => {
  if (!text) return text;
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

@Injectable()
export class ProvinciaService {
  private readonly logger = new Logger(ProvinciaService.name);

  constructor(
    @InjectRepository(Provincia, 'POSTGRES_INTEGRATOR_DS')
    private readonly provinciaRepository: Repository<Provincia>,
  ) {}

  async create(dto: CreateProvinciaDto, currentUser: string = FALLBACK_USER): Promise<Provincia> {
    const existing = await this.provinciaRepository.findOne({ where: { codigo: dto.codigo } });
    if (existing) {
      throw new BadRequestException(`Ya existe una provincia con el código: ${dto.codigo}`);
    }
    const provincia = this.provinciaRepository.create({
      codigo: dto.codigo,
      nombre: toSentenceCase(dto.nombre),
      createdBy: currentUser,
      updatedBy: currentUser,
      isActive: true,
      isEnabled: true,
    });
    return this.provinciaRepository.save(provincia);
  }

  findAll(): Promise<Provincia[]> {
    return this.provinciaRepository.find({
      where: { isEnabled: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(codigo: string): Promise<Provincia> {
    const provincia = await this.provinciaRepository.findOne({
      where: { codigo, isEnabled: true },
      relations: ['cantones'],
    });
    if (!provincia) {
      throw new NotFoundException(`Provincia con código ${codigo} no encontrada`);
    }
    return provincia;
  }

  async update(codigo: string, dto: UpdateProvinciaDto, currentUser: string = FALLBACK_USER): Promise<Provincia> {
    const provincia = await this.findOne(codigo);
    this.provinciaRepository.merge(provincia, {
      nombre: dto.nombre ? toSentenceCase(dto.nombre) : provincia.nombre,
      updatedBy: currentUser,
      updatedAt: new Date(),
    });
    return this.provinciaRepository.save(provincia);
  }

  async delete(codigo: string, currentUser: string = FALLBACK_USER): Promise<Provincia> {
    const provincia = await this.findOne(codigo);
    provincia.isEnabled = false;
    provincia.deletedAt = new Date();
    provincia.deletedBy = currentUser;
    return this.provinciaRepository.save(provincia);
  }
}
