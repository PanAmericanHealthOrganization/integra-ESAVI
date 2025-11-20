import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateDatoVacunaDto } from '../dto/create-dato-vacuna.dto';
import { UpdateDatoVacunaDto } from '../dto/update-dato-vacuna.dto';
import { DatoVacuna } from '../entity/dato-vacuna.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class DatoVacunaService {
  private readonly logger = new Logger(DatoVacunaService.name);

  constructor(
    @InjectRepository(DatoVacuna, 'POSTGRES_INTEGRATOR_DS')
    private readonly datoVacunaRepository: Repository<DatoVacuna>,
  ) {}

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  async createVigiflow(
    notificacion: Notificacion,
    createDto: CreateDatoVacunaDto, // Ahora solo aceptamos un único objeto
  ): Promise<DatoVacuna> {
    // Retornamos un solo objeto
    try {
      // 1. Buscar si ya existe un DatoVacuna con los mismos valores (nombreVacuna, codigoAtc, numeroLote, notificacion)
      const existingDatoVacuna = await this.datoVacunaRepository.findOne({
        where: {
          nombreVacuna: createDto.nombreVacuna,
          codigoAtc: createDto.codigoAtc,
          numeroLote: createDto.numeroLote,
          notificacion: notificacion, // Asociamos la notificación al buscar
        },
      });

      if (existingDatoVacuna) {
        // Si existe, actualizamos los campos necesarios
        Object.assign(existingDatoVacuna, createDto); // Actualizamos los valores del registro existente
        return this.datoVacunaRepository.save(existingDatoVacuna); // Guardamos el registro actualizado
      } else {
        // Si no existe, creamos un nuevo DatoVacuna
        const nuevoDatoVacuna = plainToClass(DatoVacuna, createDto);
        nuevoDatoVacuna.notificacion = notificacion; // Asociamos la notificación
        return this.datoVacunaRepository.save(nuevoDatoVacuna); // Guardamos el nuevo registro
      }
    } catch (e) {
      this.logger.error(`Error al procesar los datos de vacuna para Vigiflow: ${e.message}`);
      throw new Error('Hubo un problema al crear o actualizar los datos de vacuna para Vigiflow');
    } finally {
      this.logger.log(`DatoVacuna para Vigiflow ha sido procesado: ${JSON.stringify(createDto)}`);
    }
  }

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  async create(
    notificacion: Notificacion,
    createDto: CreateDatoVacunaDto | CreateDatoVacunaDto[], // Puede ser un objeto o un arreglo de objetos
  ): Promise<DatoVacuna | DatoVacuna[]> {
    // Aseguramos que createDto sea siempre un arreglo, incluso si es un solo objeto
    const createDtos = Array.isArray(createDto) ? createDto : [createDto];

    try {
      const datoVacunaArray: DatoVacuna[] = [];

      // Procesar cada objeto en el arreglo (o el único objeto si es un solo elemento)
      for (const dto of createDtos) {
        const datoVacuna = plainToClass(DatoVacuna, {
          createdBy: process.env.USUARIO_INSERTA_REGISTRO,
          ...dto,
        });
        datoVacuna.notificacion = notificacion;

        // Buscar si ya existe un DatoVacuna con la misma notificación y nombreVacuna
        const existingDatoVacuna = await this.datoVacunaRepository.findOne({
          where: {
            notificacion: { id: notificacion.id },
            nombreVacuna: dto.nombreVacuna, // Buscar por nombreVacuna además de la notificación
          },
        });

        if (existingDatoVacuna) {
          // Si existe, actualizamos el objeto
          Object.assign(existingDatoVacuna, dto);
          await this.datoVacunaRepository.save(existingDatoVacuna); // Guardamos la actualización
          datoVacunaArray.push(existingDatoVacuna); // Añadimos al arreglo
        } else {
          // Si no existe, creamos un nuevo DatoVacuna
          await this.datoVacunaRepository.save(datoVacuna);
          datoVacunaArray.push(datoVacuna); // Añadimos al arreglo
        }
      }

      // Retornamos un solo objeto o un arreglo según el caso
      return createDtos.length === 1 ? datoVacunaArray[0] : datoVacunaArray;
    } catch (e) {
      // En caso de error, mostramos un mensaje claro
      this.logger.error(`Error al procesar datos vacuna: ${e.message}`);
      throw new Error('Hubo un problema al crear o actualizar los datos de vacuna');
    } finally {
      // Registro de la operación
      this.logger.log(`DatoVacuna(s) procesado(s): ${JSON.stringify(createDtos)}`);
    }
  }

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  async findByNotificacionId(uuidNotificacion: string): Promise<DatoVacuna[]> {
    try {
      const datosVacuna = await this.datoVacunaRepository.find({
        where: {
          notificacion: { id: uuidNotificacion }, // Buscar por el id de la notificación
        },
      });
      return datosVacuna || []; // Devolver un arreglo vacío si no se encuentran registros
    } catch (error) {
      console.error('Error al buscar DatoVacuna por ID de Notificacion:', error);
      return [];
    }
  }

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  async delete(uuid: string): Promise<DatoVacuna> {
    return Promise.resolve(undefined);
  }

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  async findAll(): Promise<DatoVacuna[]> {
    return this.datoVacunaRepository.find({
      where: {
        isActive: true,
      },
    });
  }

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  async findOne(uuid: string): Promise<DatoVacuna> {
    const antecedenteEmbarazo = await this.datoVacunaRepository.findOne({
      where: {
        isActive: true,
        id: uuid,
      },
    });
    if (antecedenteEmbarazo) {
      return antecedenteEmbarazo;
    }
    throw new EntityNotFoundException('DatoVacuna', uuid);
  }

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  async update(uuid: string, vacunaDto: UpdateDatoVacunaDto): Promise<DatoVacuna> {
    const datoVacuna = await this.findOne(uuid);
    this.datoVacunaRepository.merge(datoVacuna, vacunaDto);
    return this.datoVacunaRepository.save(datoVacuna);
  }
}
