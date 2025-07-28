import { Injectable, Logger } from '@nestjs/common';
import { AntecedentePreexistencia } from '../entity/antecedente-preexistencia.entity';
import { CreateAntecedentePreexistenciaDto } from '../dto/create-antecedente-preexistencia.dto';
import { UpdateAntecedentePreexistenciaDto } from '../dto/update-antecedente-preexistencia.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Notificacion } from '../entity/notificacion.entity';

@Injectable()
export class AntecedentePreexistenciaService {
  private readonly logger = new Logger(AntecedentePreexistenciaService.name);

  constructor(
    @InjectRepository(AntecedentePreexistencia)
    private readonly antecedentePreexistenciaRepository: Repository<AntecedentePreexistencia>,
  ) {}

  // async create(
  //   notificacion: Notificacion,
  //   createDto: CreateAntecedentePreexistenciaDto,
  // ): Promise<AntecedentePreexistencia> {
  //   try {
  //     const antecedentePreexistencia = plainToClass(
  //       AntecedentePreexistencia,
  //       createDto,
  //     );
  //     antecedentePreexistencia.notificacion = notificacion;
  //     antecedentePreexistencia.createdBy = 'AUTOMATICO';
  //     return this.antecedentePreexistenciaRepository.save(
  //       antecedentePreexistencia,
  //     );
  //   } catch (e) {
  //     throw e;
  //   } finally {
  //     this.logger.log(
  //       `AntecedentePreexistencia has been created: ${JSON.stringify(
  //         createDto,
  //       )}`,
  //     );
  //   }
  // }

  async create(
    notificacion: Notificacion,
    createDto: CreateAntecedentePreexistenciaDto,
  ): Promise<AntecedentePreexistencia> {
    try {
      // 1. Eliminar todos los registros de AntecedentePreexistencia asociados a la misma notificación
      await this.antecedentePreexistenciaRepository.delete({
        notificacion: { id: notificacion.id }, // Eliminar registros con la misma notificación
      });
  
      // 2. Crear un nuevo objeto de AntecedentePreexistencia a partir del DTO
      const antecedentePreexistencia = plainToClass(
        AntecedentePreexistencia,
        createDto,
      );
      antecedentePreexistencia.notificacion = notificacion;
      antecedentePreexistencia.createdBy = 'AUTOMATICO'; // Asignamos el campo 'createdBy'
  
      // 3. Guardar el nuevo registro
      return this.antecedentePreexistenciaRepository.save(antecedentePreexistencia);
    } catch (e) {
      this.logger.error(`Error al procesar AntecedentePreexistencia: ${e.message}`);
      throw new Error('Hubo un problema al crear o eliminar AntecedentePreexistencia');
    } finally {
      this.logger.log(
        `AntecedentePreexistencia ha sido procesado: ${JSON.stringify(createDto)}`,
      );
    }
  }
  

  delete(uuid: string): Promise<AntecedentePreexistencia> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<AntecedentePreexistencia[]> {
    return this.antecedentePreexistenciaRepository.find();
  }

  findOne(uuid: string): Promise<AntecedentePreexistencia> {
    return this.antecedentePreexistenciaRepository.findOne({
      where: { id: uuid },
    });
  }

  async update(
    uuid: string,
    updateDto: UpdateAntecedentePreexistenciaDto,
  ): Promise<AntecedentePreexistencia> {
    const antecedentePreexistencia = await this.findOne(uuid);
    if (antecedentePreexistencia) {
      this.antecedentePreexistenciaRepository.merge(
        antecedentePreexistencia,
        updateDto,
      );
      return this.antecedentePreexistenciaRepository.save(
        antecedentePreexistencia,
      );
    }
  }

  async findAntecedentePreexistenciaByNotificacionUUID(
    uuidNotificacion: string,
  ) {
    return this.antecedentePreexistenciaRepository.find({
      where: {
        notificacion: {
          id: uuidNotificacion,
        },
      },
    });
  }
}
