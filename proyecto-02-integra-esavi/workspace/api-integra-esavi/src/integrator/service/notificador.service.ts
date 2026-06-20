import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateNotificadorDto, UpdateNotificadorDto } from '../dto/notificador.dto';
import { Catalogo } from '../entity/catalogo.entity';
import { Notificador } from '../entity/notificador.entity';

const FALLBACK_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

@Injectable()
export class NotificadorService {
  private readonly logger = new Logger(NotificadorService.name);

  constructor(
    @InjectRepository(Notificador, 'POSTGRES_INTEGRATOR_DS')
    private readonly notificadorRepository: Repository<Notificador>,
    @InjectRepository(Catalogo, 'POSTGRES_INTEGRATOR_DS')
    private readonly catalogoRepository: Repository<Catalogo>,
  ) {}

  async createOrUpdateFromVigiflow(identificacion: string, profesionDescripcion: string | null): Promise<Notificador> {
    if (!identificacion?.trim()) return null;
    const id = identificacion.trim();

    let notificador = await this.notificadorRepository.findOne({
      where: { identificacion: id },
      relations: ['profesion'],
    });

    if (!notificador) {
      notificador = this.notificadorRepository.create({
        identificacion: id,
        createdBy: FALLBACK_USER,
        updatedBy: FALLBACK_USER,
        isActive: true,
        isEnabled: true,
      });
    }

    if (profesionDescripcion?.trim()) {
      try {
        const catalogo = await this.catalogoRepository.findOne({
          where: { vigiflow: ILike(`%${profesionDescripcion.trim()}%`) },
        });
        if (catalogo) notificador.profesion = catalogo;
      } catch {
        this.logger.warn(`Profesión no encontrada en catálogo: ${profesionDescripcion}`);
      }
    }

    notificador.updatedBy = FALLBACK_USER;
    return this.notificadorRepository.save(notificador);
  }

  async create(dto: CreateNotificadorDto, currentUser: string = FALLBACK_USER): Promise<Notificador> {
    const existing = await this.notificadorRepository.findOne({
      where: { identificacion: dto.identificacion },
    });
    if (existing) {
      throw new Error(`Ya existe un notificador con identificación: ${dto.identificacion}`);
    }

    const notificador = this.notificadorRepository.create({
      identificacion: dto.identificacion,
      nombres: dto.nombres,
      createdBy: currentUser,
      updatedBy: currentUser,
      isActive: true,
      isEnabled: true,
    });

    if (dto.profesionId) {
      const profesion = await this.catalogoRepository.findOne({ where: { id: dto.profesionId } });
      if (!profesion) throw new NotFoundException(`Catálogo de profesión con id ${dto.profesionId} no encontrado`);
      notificador.profesion = profesion;
    }

    return this.notificadorRepository.save(notificador);
  }

  findAll(): Promise<Notificador[]> {
    return this.notificadorRepository.find({
      where: { isEnabled: true },
      relations: ['profesion'],
      order: { nombres: 'ASC' },
    });
  }

  async findOne(identificacion: string): Promise<Notificador> {
    const notificador = await this.notificadorRepository.findOne({
      where: { identificacion, isEnabled: true },
      relations: ['profesion'],
    });
    if (!notificador) {
      throw new NotFoundException(`Notificador con identificación ${identificacion} no encontrado`);
    }
    return notificador;
  }

  async update(identificacion: string, dto: UpdateNotificadorDto, currentUser: string = FALLBACK_USER): Promise<Notificador> {
    const notificador = await this.findOne(identificacion);

    this.notificadorRepository.merge(notificador, {
      nombres: dto.nombres ?? notificador.nombres,
      updatedBy: currentUser,
      updatedAt: new Date(),
    });

    if (dto.profesionId !== undefined) {
      if (dto.profesionId) {
        const profesion = await this.catalogoRepository.findOne({ where: { id: dto.profesionId } });
        if (!profesion) throw new NotFoundException(`Catálogo de profesión con id ${dto.profesionId} no encontrado`);
        notificador.profesion = profesion;
      } else {
        notificador.profesion = null;
      }
    }

    return this.notificadorRepository.save(notificador);
  }

  async delete(identificacion: string, currentUser: string = FALLBACK_USER): Promise<Notificador> {
    const notificador = await this.findOne(identificacion);
    notificador.isEnabled = false;
    notificador.deletedAt = new Date();
    notificador.deletedBy = currentUser;
    return this.notificadorRepository.save(notificador);
  }
}
