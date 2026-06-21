import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEstablecimientoDto, UpdateEstablecimientoDto } from '../dto/establecimiento.dto';
import { Establecimiento } from '../entity/establecimiento.entity';
import { Parroquia } from '../entity/parroquia.entity';

const FALLBACK_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

@Injectable()
export class EstablecimientosService {
  private readonly logger = new Logger(EstablecimientosService.name);

  constructor(
    @InjectRepository(Establecimiento, 'POSTGRES_INTEGRATOR_DS')
    private readonly establecimientoRepository: Repository<Establecimiento>,
    @InjectRepository(Parroquia, 'POSTGRES_INTEGRATOR_DS')
    private readonly parroquiaRepository: Repository<Parroquia>,
  ) {}

  async create(dto: CreateEstablecimientoDto, currentUser = FALLBACK_USER): Promise<Establecimiento> {
    const existing = await this.establecimientoRepository.findOne({
      where: { uniCodigo: dto.uniCodigo, isEnabled: true },
    });
    if (existing) {
      throw new BadRequestException(`Ya existe un establecimiento activo con el código: ${dto.uniCodigo}`);
    }

    const establecimiento = this.establecimientoRepository.create({
      uniCodigo: dto.uniCodigo,
      uniNombre: dto.uniNombre,
      zonaCodigo: dto.zonaCodigo,
      zonaDescripcion: dto.zonaDescripcion,
      distritoCodigo: dto.distritoCodigo,
      distritoDescripcion: dto.distritoDescripcion,
      circuitoCodigo: dto.circuitoCodigo,
      tipoEntidad: dto.tipoEntidad,
      longitudGps: dto.longitudGps,
      latitudGps: dto.latitudGps,
      mail: dto.mail,
      createdBy: currentUser,
      updatedBy: currentUser,
      isActive: true,
      isEnabled: true,
    });

    if (dto.parroquiaCodigo) {
      const parroquia = await this.parroquiaRepository.findOne({ where: { codigo: dto.parroquiaCodigo } });
      if (!parroquia) {
        throw new NotFoundException(`Parroquia con código ${dto.parroquiaCodigo} no encontrada`);
      }
      establecimiento.parroquiaResidencia = parroquia;
    }

    try {
      return await this.establecimientoRepository.save(establecimiento);
    } catch (err) {
      this.logger.error('Error al guardar establecimiento', err);
      throw err;
    }
  }

  findAll(): Promise<Establecimiento[]> {
    return this.establecimientoRepository.find({
      where: { isEnabled: true },
      relations: ['parroquiaResidencia', 'parroquiaResidencia.canton', 'parroquiaResidencia.canton.provincia'],
      order: { uniNombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Establecimiento> {
    const est = await this.establecimientoRepository.findOne({
      where: { id, isEnabled: true },
      relations: ['parroquiaResidencia', 'parroquiaResidencia.canton', 'parroquiaResidencia.canton.provincia'],
    });
    if (!est) throw new NotFoundException(`Establecimiento con id ${id} no encontrado`);
    return est;
  }

  async findByUniCodigo(uniCodigo: string): Promise<Establecimiento> {
    const est = await this.establecimientoRepository.findOne({
      where: { uniCodigo, isEnabled: true },
      relations: ['parroquiaResidencia', 'parroquiaResidencia.canton', 'parroquiaResidencia.canton.provincia'],
    });
    if (!est) throw new NotFoundException(`Establecimiento con código ${uniCodigo} no encontrado`);
    return est;
  }

  async update(id: string, dto: UpdateEstablecimientoDto, currentUser = FALLBACK_USER): Promise<Establecimiento> {
    const est = await this.findOne(id);

    if (dto.parroquiaCodigo !== undefined) {
      if (dto.parroquiaCodigo) {
        const parroquia = await this.parroquiaRepository.findOne({ where: { codigo: dto.parroquiaCodigo } });
        if (!parroquia) throw new NotFoundException(`Parroquia con código ${dto.parroquiaCodigo} no encontrada`);
        est.parroquiaResidencia = parroquia;
      } else {
        est.parroquiaResidencia = null;
      }
    }

    this.establecimientoRepository.merge(est, {
      uniNombre: dto.uniNombre ?? est.uniNombre,
      zonaCodigo: dto.zonaCodigo ?? est.zonaCodigo,
      zonaDescripcion: dto.zonaDescripcion ?? est.zonaDescripcion,
      distritoCodigo: dto.distritoCodigo ?? est.distritoCodigo,
      distritoDescripcion: dto.distritoDescripcion ?? est.distritoDescripcion,
      circuitoCodigo: dto.circuitoCodigo ?? est.circuitoCodigo,
      tipoEntidad: dto.tipoEntidad ?? est.tipoEntidad,
      longitudGps: dto.longitudGps ?? est.longitudGps,
      latitudGps: dto.latitudGps ?? est.latitudGps,
      mail: dto.mail ?? est.mail,
      updatedBy: currentUser,
      updatedAt: new Date(),
    });

    return this.establecimientoRepository.save(est);
  }

  async delete(id: string, currentUser = FALLBACK_USER): Promise<Establecimiento> {
    const est = await this.findOne(id);
    est.isEnabled = false;
    est.deletedAt = new Date();
    est.deletedBy = currentUser;
    return this.establecimientoRepository.save(est);
  }
}
