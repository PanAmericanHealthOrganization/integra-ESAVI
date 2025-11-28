import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateGravedadEsaviDto } from '../dto/create-gravedad-esavi.dto';
import { UpdateGravedadEsaviDto } from '../dto/update-gravedad-esavi.dto';
import { GravedadEsavi } from '../entity/gravedad-esavi.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class GravedadEsaviService {
  private readonly logger = new Logger(GravedadEsaviService.name);

  constructor(
    @InjectRepository(GravedadEsavi, 'POSTGRES_INTEGRATOR_DS')
    private readonly gravedadEsaviRepository: Repository<GravedadEsavi>,
  ) {}

  //   async create(
  //     notificacion: Notificacion,
  //     createDto: CreateGravedadEsaviDto,
  //   ): Promise<GravedadEsavi> {

  //     if (notificacion) {
  //     try {
  //       const gravedadEsavi = await this.findByNotificacionId(notificacion.id);
  //       if (gravedadEsavi)
  //       {
  //         return gravedadEsavi
  //       }
  //       else
  //       {
  //           const gravedadEsavi = plainToClass(GravedadEsavi, createDto);
  //           gravedadEsavi.notificacion = notificacion;
  //           gravedadEsavi.createdBy = process.env.USUARIO_INSERTA_REGISTRO;
  //           return this.gravedadEsaviRepository.save(gravedadEsavi);
  //       }
  //     } catch (e) {
  //       this.logger.error(e);
  //       throw e;
  //     } finally {
  //       this.logger.log(
  //         `GravedadEsavi has been created: ${JSON.stringify(createDto)}`,
  //       );
  //     }
  //   }
  //  else {
  //   throw new Error(
  //     'notificacionUUID is a mandatory field to gravedadEsavi-vigiflow',
  //   );
  // }

  //   }

  async create(notificacion: Notificacion, createDto: CreateGravedadEsaviDto): Promise<GravedadEsavi> {
    if (!notificacion) {
      throw new Error('El campo notificacion es obligatorio para GravedadEsavi');
    }

    try {
      // Verificamos si ya existe un registro de GravedadEsavi para la notificación
      const gravedadEsavi = await this.findByNotificacionId(notificacion.id);

      if (gravedadEsavi) {
        // Si ya existe, actualizamos los campos con los nuevos datos del DTO
        console.log('GravedadEsavi ya existe, actualizando...');

        // Asignamos valores directamente si el valor en createDto está presente
        Object.keys(createDto).forEach((key) => {
          if (createDto[key] !== undefined && createDto[key] !== null) {
            gravedadEsavi[key] = createDto[key];
          }
        });

        // Actualizamos el registro de GravedadEsavi
        this.logger.log(`GravedadEsavi ha sido actualizada: ${JSON.stringify(createDto)}`);
        return this.gravedadEsaviRepository.save(gravedadEsavi); // Utilizamos save() para actualizar el registro
      } else {
        const nuevaGravedadEsavi = plainToClass(GravedadEsavi, createDto);
        nuevaGravedadEsavi.notificacion = notificacion; // Asociamos la notificación
        nuevaGravedadEsavi.createdBy = process.env.USUARIO_INSERTA_REGISTRO; // Guardamos quien inserta el registro

        // Guardamos la nueva GravedadEsavi
        this.logger.log(`GravedadEsavi ha sido creada`);
        return this.gravedadEsaviRepository.save(nuevaGravedadEsavi); // Utilizamos save() para crear el registro
      }
    } catch (error) {
      this.logger.error(`Error al procesar la creación o actualización de GravedadEsavi: ${error.message}`);
      throw new Error('Hubo un problema al crear o actualizar GravedadEsavi');
    }
  }

  delete(uuid: string): Promise<GravedadEsavi> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<GravedadEsavi[]> {
    return this.gravedadEsaviRepository.find();
  }

  async findOne(uuid: string): Promise<GravedadEsavi> {
    const gravedadEsavi = await this.gravedadEsaviRepository.findOne({
      where: { id: uuid },
    });
    if (gravedadEsavi) {
      return gravedadEsavi;
    }
    throw new EntityNotFoundException(`GravedadEsavi`, uuid);
  }

  async findByNotificacionId(uuidNotificacion: string): Promise<GravedadEsavi | null> {
    try {
      const gravedadEsavi = await this.gravedadEsaviRepository.findOne({
        where: {
          notificacion: { id: uuidNotificacion }, // Buscar por el id de la notificación
        },
      });
      return gravedadEsavi || null; // Devolver null si no se encuentra
    } catch (error) {
      console.error('Error al buscar GravedadEsavi por ID de Notificacion:', error);
      return null;
    }
  }

  async update(uuid: string, updateGravedadEsaviDto: UpdateGravedadEsaviDto): Promise<GravedadEsavi> {
    const gravedadEsavi = await this.findOne(uuid);
    if (gravedadEsavi) {
      this.gravedadEsaviRepository.merge(gravedadEsavi, updateGravedadEsaviDto);
      return this.gravedadEsaviRepository.save(gravedadEsavi);
    }
  }
}
