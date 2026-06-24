import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCantonDto, UpdateCantonDto } from '../dto/canton.dto';
import { Canton } from '../entity/canton.entity';
import { Provincia } from '../entity/provincia.entity';

const FALLBACK_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

const toSentenceCase = (text: string): string => {
  if (!text) return text;
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

@Injectable()
export class CantonService {
  private readonly logger = new Logger(CantonService.name);

  constructor(
    @InjectRepository(Canton, 'POSTGRES_INTEGRATOR_DS')
    private readonly cantonRepository: Repository<Canton>,
    @InjectRepository(Provincia, 'POSTGRES_INTEGRATOR_DS')
    private readonly provinciaRepository: Repository<Provincia>,
  ) {}

  async create(dto: CreateCantonDto, currentUser: string = FALLBACK_USER): Promise<Canton> {
    const existing = await this.cantonRepository.findOne({ where: { codigo: dto.codigo } });
    if (existing) {
      throw new BadRequestException(`Ya existe un cantón con el código: ${dto.codigo}`);
    }
    const provincia = await this.provinciaRepository.findOne({ where: { codigo: dto.provinciaCodigo } });
    if (!provincia) {
      throw new NotFoundException(`Provincia con código ${dto.provinciaCodigo} no encontrada`);
    }
    const canton = this.cantonRepository.create({
      codigo: dto.codigo,
      nombre: toSentenceCase(dto.nombre),
      provincia,
      createdBy: currentUser,
      updatedBy: currentUser,
      isActive: true,
      isEnabled: true,
    });
    return this.cantonRepository.save(canton);
  }

  findAll(): Promise<Canton[]> {
    return this.cantonRepository.find({
      where: { isEnabled: true },
      relations: ['provincia'],
      order: { nombre: 'ASC' },
    });
  }

  findByProvincia(provinciaCodigo: string): Promise<Canton[]> {
    return this.cantonRepository.find({
      where: { provincia: { codigo: provinciaCodigo }, isEnabled: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(codigo: string): Promise<Canton> {
    const canton = await this.cantonRepository.findOne({
      where: { codigo, isEnabled: true },
      relations: ['provincia'],
    });
    if (!canton) {
      throw new NotFoundException(`Cantón con código ${codigo} no encontrado`);
    }
    return canton;
  }

  async update(codigo: string, dto: UpdateCantonDto, currentUser: string = FALLBACK_USER): Promise<Canton> {
    const canton = await this.findOne(codigo);
    if (dto.provinciaCodigo) {
      const provincia = await this.provinciaRepository.findOne({ where: { codigo: dto.provinciaCodigo } });
      if (!provincia) {
        throw new NotFoundException(`Provincia con código ${dto.provinciaCodigo} no encontrada`);
      }
      canton.provincia = provincia;
    }
    this.cantonRepository.merge(canton, {
      nombre: dto.nombre ? toSentenceCase(dto.nombre) : canton.nombre,
      updatedBy: currentUser,
      updatedAt: new Date(),
    });
    return this.cantonRepository.save(canton);
  }

  async delete(codigo: string, currentUser: string = FALLBACK_USER): Promise<Canton> {
    const canton = await this.findOne(codigo);
    canton.isEnabled = false;
    canton.deletedAt = new Date();
    canton.deletedBy = currentUser;
    return this.cantonRepository.save(canton);
  }
}
