import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateDesenlaceEsaviDto } from '../dto/create-desenlace-esavi.dto';
import { UpdateDesenlaceEsaviDto } from '../dto/update-desenlace-esavi.dto';
import { DesenlaceEsavi } from '../entity/desenlace-esavi.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class DesenlaceEsaviService {
  private readonly logger = new Logger(DesenlaceEsaviService.name);

  constructor(
    @InjectRepository(DesenlaceEsavi, 'POSTGRES_INTEGRATOR_DS')
    private readonly desenlaceEsaviRepository: Repository<DesenlaceEsavi>,
  ) {}

  // async create(
  //   notificacion: Notificacion,
  //   createDto: CreateDesenlaceEsaviDto,
  // ): Promise<DesenlaceEsavi> {
  //   if (notificacion) {
  //     try {
  //       const desenlaceEsavi = await this.findByNotificacionId(notificacion.id);
  //       if (desenlaceEsavi)
  //       {
  //         return desenlaceEsavi
  //       }
  //       else
  //       {
  //         const desenlaceEsavi = plainToClass(DesenlaceEsavi, createDto);
  //         desenlaceEsavi.notificacion = notificacion;
  //         desenlaceEsavi.createdBy = 'AUTOMATICO';
  //         return this.desenlaceEsaviRepository.save(desenlaceEsavi);
  //   }
  //   } catch (e) {
  //     this.logger.error(e);
  //     throw e;
  //   } finally {
  //     this.logger.log(
  //       `DesenlaceEsavi has been created: ${JSON.stringify(createDto)}`,
  //     );
  //   }
  // }
  // }

  async create(notificacion: Notificacion, createDto: CreateDesenlaceEsaviDto): Promise<DesenlaceEsavi> {
    if (notificacion) {
      try {
        // Verificamos si ya existe un registro de DesenlaceEsavi para la notificación
        const desenlaceEsavi = await this.findByNotificacionId(notificacion.id);

        if (desenlaceEsavi) {
          // Si ya existe, actualizamos los campos con los nuevos datos del DTO
          console.log('DesenlaceEsavi ya existe, actualizando...');

          // Actualizamos los campos relevantes de desenlaceEsavi con la información de createDto
          Object.keys(createDto).forEach((key) => {
            // Solo actualizamos el campo si su valor no es undefined ni null
            if (createDto[key] !== undefined && createDto[key] !== null) {
              desenlaceEsavi[key] = createDto[key];
            }
          });
          return this.desenlaceEsaviRepository.save(desenlaceEsavi); // Utilizamos save() para actualizar el registro
        } else {
          const nuevoDesenlaceEsavi = plainToClass(DesenlaceEsavi, createDto);

          // Asignamos los valores de createDto a la nueva instancia de DesenlaceEsavi
          Object.keys(createDto).forEach((key) => {
            if (createDto[key] !== undefined && createDto[key] !== null) {
              nuevoDesenlaceEsavi[key] = createDto[key];
            }
          });

          // Asociamos la notificación a la nueva instancia
          nuevoDesenlaceEsavi.notificacion = notificacion;
          nuevoDesenlaceEsavi.createdBy = 'AUTOMATICO'; // Guardamos quien inserta el registro

          // Guardamos el nuevo DesenlaceEsavi
          this.logger.log(`DesenlaceEsavi ha sido creada`);

          return this.desenlaceEsaviRepository.save(nuevoDesenlaceEsavi); // Utilizamos save() para crear el registro
        }
      } catch (e) {
        this.logger.error(`Error al procesar la creación o actualización de DesenlaceEsavi: ${e.message}`);
        throw new Error('Hubo un problema al crear o actualizar DesenlaceEsavi');
      } finally {
        this.logger.log(`DesenlaceEsavi ha sido procesado: ${createDto.codigo}`);
      }
    } else {
      throw new Error('El campo notificacion es obligatorio para DesenlaceEsavi');
    }
  }

  delete(uuid: string): Promise<DesenlaceEsavi> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<DesenlaceEsavi[]> {
    return this.desenlaceEsaviRepository.find();
  }

  async findOne(uuid: string): Promise<DesenlaceEsavi> {
    const desenlaceEsavi = await this.desenlaceEsaviRepository.findOne({
      where: { id: uuid },
    });
    if (desenlaceEsavi) {
      return desenlaceEsavi;
    }
    throw new EntityNotFoundException('DesenlaceEsavi', uuid);
  }

  async findByNotificacionId(uuidNotificacion: string): Promise<DesenlaceEsavi | null> {
    try {
      const desenlaceEsavi = await this.desenlaceEsaviRepository.findOne({
        where: {
          notificacion: { id: uuidNotificacion }, // Buscar por el id de la notificación
        },
      });
      return desenlaceEsavi || null; // Devolver null si no se encuentra
    } catch (error) {
      console.error('Error al buscar desenlaceEsavi por ID de Notificacion:', error);
      return null;
    }
  }

  async update(uuid: string, updateGravedadEsaviDto: UpdateDesenlaceEsaviDto): Promise<DesenlaceEsavi> {
    const desenlaceEsavi = await this.findOne(uuid);
    if (desenlaceEsavi) {
      this.desenlaceEsaviRepository.merge(desenlaceEsavi, updateGravedadEsaviDto);
      return this.desenlaceEsaviRepository.save(desenlaceEsavi);
    }
  }
}
