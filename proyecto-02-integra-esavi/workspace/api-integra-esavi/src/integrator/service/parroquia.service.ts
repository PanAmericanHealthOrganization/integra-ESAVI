import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateParroquiaDto, UpdateParroquiaDto } from '../dto/parroquia.dto';
import { Canton } from '../entity/canton.entity';
import { Parroquia } from '../entity/parroquia.entity';

const FALLBACK_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

const toSentenceCase = (text: string): string => {
  if (!text) return text;
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

@Injectable()
export class ParroquiaService {
  private readonly logger = new Logger(ParroquiaService.name);

  constructor(
    @InjectRepository(Parroquia, 'POSTGRES_INTEGRATOR_DS')
    private readonly parroquiaRepository: Repository<Parroquia>,
    @InjectRepository(Canton, 'POSTGRES_INTEGRATOR_DS')
    private readonly cantonRepository: Repository<Canton>,
  ) {}

  async create(dto: CreateParroquiaDto, currentUser: string = FALLBACK_USER): Promise<Parroquia> {
    const existing = await this.parroquiaRepository.findOne({ where: { codigo: dto.codigo } });
    if (existing) {
      throw new BadRequestException(`Ya existe una parroquia con el código: ${dto.codigo}`);
    }
    const canton = await this.cantonRepository.findOne({ where: { codigo: dto.cantonCodigo } });
    if (!canton) {
      throw new NotFoundException(`Cantón con código ${dto.cantonCodigo} no encontrado`);
    }
    const parroquia = this.parroquiaRepository.create({
      codigo: dto.codigo,
      nombre: toSentenceCase(dto.nombre),
      canton,
      createdBy: currentUser,
      updatedBy: currentUser,
      isActive: true,
      isEnabled: true,
    });
    return this.parroquiaRepository.save(parroquia);
  }

  findAll(): Promise<Parroquia[]> {
    return this.parroquiaRepository.find({
      where: { isEnabled: true },
      relations: ['canton', 'canton.provincia'],
      order: { nombre: 'ASC' },
    });
  }

  findByCanton(cantonCodigo: string): Promise<Parroquia[]> {
    return this.parroquiaRepository.find({
      where: { canton: { codigo: cantonCodigo }, isEnabled: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(codigo: string): Promise<Parroquia> {
    const parroquia = await this.parroquiaRepository.findOne({
      where: { codigo, isEnabled: true },
      relations: ['canton', 'canton.provincia'],
    });
    if (!parroquia) {
      throw new NotFoundException(`Parroquia con código ${codigo} no encontrada`);
    }
    return parroquia;
  }

  async update(codigo: string, dto: UpdateParroquiaDto, currentUser: string = FALLBACK_USER): Promise<Parroquia> {
    const parroquia = await this.findOne(codigo);
    if (dto.cantonCodigo) {
      const canton = await this.cantonRepository.findOne({ where: { codigo: dto.cantonCodigo } });
      if (!canton) {
        throw new NotFoundException(`Cantón con código ${dto.cantonCodigo} no encontrado`);
      }
      parroquia.canton = canton;
    }
    this.parroquiaRepository.merge(parroquia, {
      nombre: dto.nombre ? toSentenceCase(dto.nombre) : parroquia.nombre,
      updatedBy: currentUser,
      updatedAt: new Date(),
    });
    return this.parroquiaRepository.save(parroquia);
  }

  async delete(codigo: string, currentUser: string = FALLBACK_USER): Promise<Parroquia> {
    const parroquia = await this.findOne(codigo);
    parroquia.isEnabled = false;
    parroquia.deletedAt = new Date();
    parroquia.deletedBy = currentUser;
    return this.parroquiaRepository.save(parroquia);
  }
}
