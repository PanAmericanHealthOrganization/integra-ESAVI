import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateDatoVacunacionDto } from '../dto/create-dato-vacunacion.dto';
import { UpdateDatoVacunacionDto } from '../dto/update-dato-vacunacion.dto';
import { DatoVacunacion } from '../entity/dato-vacunacion.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class DatoVacunacionService {
  private readonly logger = new Logger(DatoVacunacionService.name);

  constructor(
    @InjectRepository(DatoVacunacion, 'POSTGRES_INTEGRATOR_DS')
    private readonly datoVacunacionRepository: Repository<DatoVacunacion>,
    private readonly configService: ConfigService,
  ) {}

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  public async create(notificacion: Notificacion, createDto: CreateDatoVacunacionDto | CreateDatoVacunacionDto[]): Promise<DatoVacunacion | DatoVacunacion[]> {
    try {
      // Verificar si ya existe un DatoVacunacion con la misma notificación
      const existingDatoVacunacion = await this.datoVacunacionRepository.findOne({
        where: { notificacion: { id: notificacion.id } }, // Buscamos por el ID de la notificación
      });

      // Si existe, lo actualizamos
      if (existingDatoVacunacion) {
        this.logger.log('DatoVacunacion existe, se actualizará con los nuevos datos.');

        // Actualizamos el registro con los nuevos datos
        Object.assign(existingDatoVacunacion, createDto); // Actualizamos las propiedades del registro

        // También actualizamos la notificación
        existingDatoVacunacion.notificacion = notificacion;

        // Guardamos el registro actualizado
        return this.datoVacunacionRepository.save(existingDatoVacunacion);
      }

      // Si no existe, creamos uno nuevo
      const datoVacuna = plainToClass(DatoVacunacion, createDto);
      datoVacuna.notificacion = notificacion;
      datoVacuna.createdBy = this.configService.get('USUARIO_INSERTA_REGISTRO'); // Asignamos el creador automáticamente

      // Guardamos el nuevo DatoVacunacion
      return this.datoVacunacionRepository.save(datoVacuna);
    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      this.logger.log(`DatoVacunacion ha sido procesadoDesenlaceEsavi ha sido creada`);
    }
  }

  delete(uuid: string): Promise<DatoVacunacion> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<DatoVacunacion[]> {
    return this.datoVacunacionRepository.find({
      where: {
        isActive: true,
      },
    });
  }

  async findOne(uuid: string): Promise<DatoVacunacion> {
    const datoVacunacion = await this.datoVacunacionRepository.findOne({
      where: {
        isActive: true,
        id: uuid,
      },
    });
    if (datoVacunacion) {
      return datoVacunacion;
    }
    throw new EntityNotFoundException('DatoVacunacion', uuid);
  }

  async update(uuid: string, vacunaDto: UpdateDatoVacunacionDto) {
    const datoVacuna = await this.findOne(uuid);
  }
}
