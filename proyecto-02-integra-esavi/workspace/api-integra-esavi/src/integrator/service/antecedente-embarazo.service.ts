import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateAntecedenteEmbarazoDto } from '../dto/create-antecedente-embarazo.dto';
import { UpdateAntecedenteEmbarazoDto } from '../dto/update-antecedente-embarazo.dto';
import { AntecedenteEmbarazo } from '../entity/antecedente-embarazo.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';
import { NotificacionService } from './notificacion.service';

/**
 *
 */
@Injectable()
export class AntecedenteEmbarazoService {
  private readonly logger = new Logger(AntecedenteEmbarazoService.name);

  constructor(
    @InjectRepository(AntecedenteEmbarazo, 'POSTGRES_INTEGRATOR_DS')
    private readonly antecedenteEmbarazoRepository: Repository<AntecedenteEmbarazo>,
    @Inject(forwardRef(() => NotificacionService))
    private readonly notificacionService: NotificacionService,
  ) {}

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  async create(
    notificacion: Notificacion,
    createDto: CreateAntecedenteEmbarazoDto,
  ): Promise<AntecedenteEmbarazo> {
    try {
      const antecedenteEmbarazoExistente = await this.findByNotificacion(notificacion.id);

      if (antecedenteEmbarazoExistente) {
        Object.keys(createDto).forEach((key) => {
          if (createDto[key] !== undefined && createDto[key] !== null) {
            antecedenteEmbarazoExistente[key] = createDto[key];
          }
        });
        antecedenteEmbarazoExistente.notificacion = notificacion;
        return this.antecedenteEmbarazoRepository.save(antecedenteEmbarazoExistente);
      } else {
        const antecedenteEmbarazo = plainToClass(AntecedenteEmbarazo, {
          createdBy: process.env.USUARIO_INSERTA_REGISTRO,
          ...createDto,
        });
        antecedenteEmbarazo.notificacion = notificacion;
        return this.antecedenteEmbarazoRepository.save(antecedenteEmbarazo);
      }
    } catch (e) {
      this.logger.error(`Error al procesar el antecedente de embarazo: ${e.message}`);
      throw new Error('Hubo un problema al crear o actualizar el antecedente de embarazo');
    } finally {
      this.logger.log(`AntecedenteEmbarazo ha sido procesado: ${JSON.stringify(createDto)}`);
    }
  }

  /**
   *
   * @param createDto
   * @returns
   */
  public async createWithNotificacionUUID(
    createDto: CreateAntecedenteEmbarazoDto,
  ): Promise<AntecedenteEmbarazo> {
    const notificacion = await this.notificacionService.findOne(createDto.uuidNotificacion);
    if (notificacion) {
      const antecedenteEmbarazo = plainToClass(AntecedenteEmbarazo, createDto);
      antecedenteEmbarazo.notificacion = notificacion;
      antecedenteEmbarazo.createdBy = process.env.USUARIO_INSERTA_REGISTRO;
      return this.antecedenteEmbarazoRepository.create(antecedenteEmbarazo);
    }
    throw new EntityNotFoundException('Notificacion', createDto.uuidNotificacion);
  }

  /**
   *
   * @param uuid
   * @returns
   */
  public async delete(uuid: string): Promise<AntecedenteEmbarazo> {
    return Promise.resolve(undefined);
  }

  /**
   * @returns
   */
  public async findAll(): Promise<AntecedenteEmbarazo[]> {
    return this.antecedenteEmbarazoRepository.find({
      where: {
        isActive: true,
      },
    });
  }

  /**
   *
   * @param uuid
   * @returns
   */
  async findOne(uuid: string): Promise<AntecedenteEmbarazo> {
    const antecedenteEmbarazo = await this.antecedenteEmbarazoRepository.findOne({
      where: {
        isActive: true,
        id: uuid,
      },
    });
    if (antecedenteEmbarazo) {
      return antecedenteEmbarazo;
    }
    throw new EntityNotFoundException('AntecedenteEmbarazo', uuid);
  }

  /**
   *
   * @param uuid
   * @param updateAntecedenteEmbarazoDto
   * @returns
   */
  async update(
    uuid: string,
    updateAntecedenteEmbarazoDto: UpdateAntecedenteEmbarazoDto,
  ): Promise<AntecedenteEmbarazo> {
    const antecedenteEmbarazo = await this.findOne(uuid);
    this.antecedenteEmbarazoRepository.merge(antecedenteEmbarazo, updateAntecedenteEmbarazoDto);
    return this.antecedenteEmbarazoRepository.save(antecedenteEmbarazo);
  }

  /**
   *
   * @param uuidNotificacion
   * @returns
   */
  async findAntecedenteEmbarazoByNotificacionUUID(uuidNotificacion: string) {
    return this.antecedenteEmbarazoRepository.find({
      where: {
        notificacion: {
          id: uuidNotificacion,
        },
      },
    });
  }

  /**
   *
   * @param notificacionId
   * @returns
   */
  private async findByNotificacion(notificacionId: string): Promise<AntecedenteEmbarazo | null> {
    try {
      // Realizamos la búsqueda por el ID de notificación
      const antecedenteEmbarazo = await this.antecedenteEmbarazoRepository.findOne({
        where: { notificacion: { id: notificacionId } }, // Filtrar por notificación ID
      });
      return antecedenteEmbarazo || null; // Si no se encuentra, retornamos null
    } catch (error) {
      this.logger.error('Error al buscar AntecedenteEmbarazo por ID de notificación:', error);
      return null; // Si hay un error, devolvemos null
    }
  }
}
