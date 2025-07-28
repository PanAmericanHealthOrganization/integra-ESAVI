import { AntecedenteEmbarazo } from '../entity/antecedente-embarazo.entity';
import { CreateAntecedenteEmbarazoDto } from '../dto/create-antecedente-embarazo.dto';
import { UpdateAntecedenteEmbarazoDto } from '../dto/update-antecedente-embarazo.dto';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Notificacion } from '../entity/notificacion.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';
import { NotificacionService } from './notificacion.service';

@Injectable()
export class AntecedenteEmbarazoService {
  private readonly logger = new Logger(AntecedenteEmbarazoService.name);

  constructor(
    @InjectRepository(AntecedenteEmbarazo)
    private readonly antecedenteEmbarazoRepository: Repository<AntecedenteEmbarazo>,
    @Inject(forwardRef(() => NotificacionService))
    private readonly notificacionService: NotificacionService,
  ) {}

  // async create(
  //   notificacion: Notificacion,
  //   createDto: CreateAntecedenteEmbarazoDto,
  // ): Promise<AntecedenteEmbarazo> {
  //   try {
  //     const antecedenteEmbarazo = plainToClass(AntecedenteEmbarazo, createDto);
  //     antecedenteEmbarazo.notificacion = notificacion;
  //     antecedenteEmbarazo.createdBy = 'AUTOMATICO';
  //     return this.antecedenteEmbarazoRepository.save(antecedenteEmbarazo);
  //   } catch (e) {
  //     throw e;
  //   } finally {
  //     this.logger.log(
  //       `AntecedenteEmbarazo has been created: ${JSON.stringify(createDto)}`,
  //     );
  //   }
  // }

  async create(
    notificacion: Notificacion,
    createDto: CreateAntecedenteEmbarazoDto,
  ): Promise<AntecedenteEmbarazo> {
    try {
      // Usamos el método para verificar si ya existe un AntecedenteEmbarazo asociado a esa notificación
      const antecedenteEmbarazoExistente = await this.findByNotificacion(notificacion.id);
  
      if (antecedenteEmbarazoExistente) {
        // Si ya existe, actualizamos los campos con los nuevos valores del DTO
        Object.keys(createDto).forEach((key) => {
          if (createDto[key] !== undefined && createDto[key] !== null) {
            antecedenteEmbarazoExistente[key] = createDto[key]; // Actualizamos solo si el valor no es null o undefined
          }
        });
        antecedenteEmbarazoExistente.notificacion = notificacion; // Aseguramos que la notificación esté asociada
        // Devolvemos el registro actualizado
        return this.antecedenteEmbarazoRepository.save(antecedenteEmbarazoExistente);
      } else {
        // Si no existe, creamos un nuevo objeto de AntecedenteEmbarazo
        const antecedenteEmbarazo = plainToClass(AntecedenteEmbarazo, createDto);
        antecedenteEmbarazo.notificacion = notificacion; // Asociamos la notificación
        // Guardamos y devolvemos el nuevo registro
        return this.antecedenteEmbarazoRepository.save(antecedenteEmbarazo);
      }
    } catch (e) {
      this.logger.error(`Error al procesar el antecedente de embarazo: ${e.message}`);
      throw new Error('Hubo un problema al crear o actualizar el antecedente de embarazo');
    } finally {
      this.logger.log(`AntecedenteEmbarazo ha sido procesado: ${JSON.stringify(createDto)}`);
    }
  }
  

  
  async createWithNotificacionUUID(
    createDto: CreateAntecedenteEmbarazoDto,
  ): Promise<AntecedenteEmbarazo> {
    const notificacion = await this.notificacionService.findOne(
      createDto.uuidNotificacion,
    );
    if (notificacion) {
      const antecedenteEmbarazo = plainToClass(AntecedenteEmbarazo, createDto);
      antecedenteEmbarazo.notificacion = notificacion;
      antecedenteEmbarazo.createdBy = 'AUTOMATICO';
      return this.antecedenteEmbarazoRepository.create(antecedenteEmbarazo);
    }
    throw new EntityNotFoundException(
      'Notificacion',
      createDto.uuidNotificacion,
    );
  }

  delete(uuid: string): Promise<AntecedenteEmbarazo> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<AntecedenteEmbarazo[]> {
    return this.antecedenteEmbarazoRepository.find({
      where: {
        isActive: true,
      },
    });
  }

  async findOne(uuid: string): Promise<AntecedenteEmbarazo> {
    const antecedenteEmbarazo =
      await this.antecedenteEmbarazoRepository.findOne({
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

  async update(
    uuid: string,
    updateAntecedenteEmbarazoDto: UpdateAntecedenteEmbarazoDto,
  ): Promise<AntecedenteEmbarazo> {
    const antecedenteEmbarazo = await this.findOne(uuid);
    this.antecedenteEmbarazoRepository.merge(
      antecedenteEmbarazo,
      updateAntecedenteEmbarazoDto,
    );
    return this.antecedenteEmbarazoRepository.save(antecedenteEmbarazo);
  }

  async findAntecedenteEmbarazoByNotificacionUUID(uuidNotificacion: string) {
    return this.antecedenteEmbarazoRepository.find({
      where: {
        notificacion: {
          id: uuidNotificacion,
        },
      },
    });
  }

  // Método para buscar AntecedenteEmbarazo por notificación
private async findByNotificacion(notificacionId: string): Promise<AntecedenteEmbarazo | null> {
  try {
    // Realizamos la búsqueda por el ID de notificación
    const antecedenteEmbarazo = await this.antecedenteEmbarazoRepository.findOne({
      where: { notificacion: { id: notificacionId } }, // Filtrar por notificación ID
    });
    return antecedenteEmbarazo || null; // Si no se encuentra, retornamos null
  } catch (error) {
    console.error('Error al buscar AntecedenteEmbarazo por ID de notificación:', error);
    return null; // Si hay un error, devolvemos null
  }
}

}
