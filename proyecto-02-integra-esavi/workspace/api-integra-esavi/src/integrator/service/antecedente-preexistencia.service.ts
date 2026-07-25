import { Injectable, Logger } from '@nestjs/common';
import { AntecedentePreexistencia } from '../entity/antecedente-preexistencia.entity';
import { CreateAntecedentePreexistenciaDto, UpdateAntecedentePreexistenciaDto } from '../dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Notificacion } from '../entity/notificacion.entity';

@Injectable()
export class AntecedentePreexistenciaService {
  private readonly logger = new Logger(AntecedentePreexistenciaService.name);

  constructor(
    @InjectRepository(AntecedentePreexistencia, 'POSTGRES_INTEGRATOR_DS')
    private readonly antecedentePreexistenciaRepository: Repository<AntecedentePreexistencia>,
  ) {}

  async create(
    notificacion: Notificacion,
    createDto: CreateAntecedentePreexistenciaDto,
  ): Promise<AntecedentePreexistencia> {
    try {
      // Upsert por notificación: antes este método borraba y volvía a crear el
      // registro en cada reimport (perdiendo el id/auditoría y cualquier campo no
      // incluido en el DTO nuevo). Se alinea con el patrón usado en el resto de
      // antecedentes (embarazo, evento, médico): buscar el existente y actualizar
      // solo los campos que vienen definidos en el DTO, sin pisar con null/undefined
      // lo que ya hay guardado.
      const [existente] = await this.findAntecedentePreexistenciaByNotificacionUUID(notificacion.id);

      if (existente) {
        Object.keys(createDto).forEach((key) => {
          if (createDto[key] !== undefined && createDto[key] !== null) {
            existente[key] = createDto[key];
          }
        });
        existente.notificacion = notificacion;
        return this.antecedentePreexistenciaRepository.save(existente);
      }

      const antecedentePreexistencia = plainToClass(
        AntecedentePreexistencia,
        createDto,
      );
      antecedentePreexistencia.notificacion = notificacion;
      antecedentePreexistencia.createdBy = 'AUTOMATICO'; // Asignamos el campo 'createdBy'

      return this.antecedentePreexistenciaRepository.save(
        antecedentePreexistencia,
      );
    } catch (e) {
      this.logger.error(
        `Error al procesar AntecedentePreexistencia: ${e.message}`,
      );
      throw new Error(
        'Hubo un problema al crear o actualizar AntecedentePreexistencia',
      );
    } finally {
      this.logger.log(
        `AntecedentePreexistencia ha sido procesado: ${JSON.stringify(
          createDto,
        )}`,
      );
    }
  }

  delete(_uuid: string): Promise<AntecedentePreexistencia> {
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
