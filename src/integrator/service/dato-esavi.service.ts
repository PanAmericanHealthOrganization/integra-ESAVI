import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateDatoEsaviDto } from '../dto/create-dato-esavi.dto';
import { UpdateDatoEsaviDto } from '../dto/update-dato-esavi.dto';
import { DatoEsavi } from '../entity/dato-esavi.entity';
import { DatoVacuna } from '../entity/dato-vacuna.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class DatoEsaviService {
  private readonly logger = new Logger(DatoEsaviService.name);

  constructor(
    @InjectRepository(DatoEsavi, 'POSTGRES_INTEGRATOR_DS')
    private readonly datoEsaviRepository: Repository<DatoEsavi>,
  ) {}

  /**
   *
   * @param notificacion
   * @param createDto
   * @returns
   */
  public async createVigiflow(notificacion: Notificacion, createDto: CreateDatoEsaviDto): Promise<DatoEsavi> {
    try {
      // Verificar si ya existe un DatoEsavi con los mismos datos
      const notificacionExistente = new Notificacion();
      notificacionExistente.id = notificacion.id;
      const existingDatoEsavi = await this.datoEsaviRepository.findOne({
        where: {
          notificacion: notificacionExistente,
          fechaEsavi: createDto.fechaEsavi,
          nombre: createDto.nombre,
        },
      });

      // Si existe, lo actualizamos
      if (existingDatoEsavi) {
        this.logger.log('DatoEsavi existe, se actualizará con los nuevos datos.');

        // Actualizamos el registro con los nuevos datos
        Object.assign(existingDatoEsavi, createDto); // Actualizamos las propiedades del registro

        // También actualizamos la notificación, por si se cambia
        existingDatoEsavi.notificacion = notificacion;

        // Guardamos el registro actualizado
        return this.datoEsaviRepository.save(existingDatoEsavi);
      }

      // Si no existe, creamos uno nuevo
      const datoEsavi = plainToClass(DatoEsavi, createDto);
      datoEsavi.notificacion = notificacion;

      // Guardamos el nuevo DatoEsavi
      return this.datoEsaviRepository.save(datoEsavi);
    } catch (e) {
      this.logger.error(`Error al procesar datos esavi: ${e.message}`);
      throw new Error('Hubo un problema al crear o actualizar datos esavi');
    } finally {
      this.logger.log(`DatoEsavi ha sido procesado`);
    }
  }

  // async create(
  //   notificacion: Notificacion,
  //   createDto: CreateDatoEsaviDto | CreateDatoEsaviDto[],
  // ): Promise<DatoEsavi | DatoEsavi[]> {
  //   const isArray = Array.isArray(createDto); // Verificar si es un arreglo
  //   console.log("EsunArreglo:::" , );

  //   // Si no es un arreglo, lo convertimos en un arreglo de un solo elemento
  //   const createDtos = isArray ? createDto : [createDto];

  //   try {
  //     const datoEsaviArray: DatoEsavi[] = [];

  //     for (const dto of createDtos) {
  //       const datoEsavi = plainToClass(DatoEsavi, dto);
  //       datoEsavi.notificacion = notificacion;
  //       console.log("DtooooosssBro::" , datoEsavi);
  //       console.log("DtooooosssBro::" , datoEsavi.notificacion);

  //       // Lógica de búsqueda según el tipo de notificación
  //       let existingDatoEsavi;

  //         // Buscar por codigoCaso, fechaEsavi y descripcion para dhis2
  //         existingDatoEsavi = await this.datoEsaviRepository.findOne({
  //           where: {
  //             notificacion : notificacion,
  //             fechaEsavi: dto.fechaEsavi,
  //             nombre: dto.nombre,
  //           },
  //         });

  //         console.log("ExistePacienteVer:::" , existingDatoEsavi);

  //       if (existingDatoEsavi) {
  //         // Si ya existe, actualizamos todos los campos con los datos de dto
  //         Object.assign(existingDatoEsavi, dto); // Actualiza todos los campos del objeto

  //         // Guardamos el DatoEsavi actualizado
  //         await this.datoEsaviRepository.save(existingDatoEsavi);
  //         datoEsaviArray.push(existingDatoEsavi);
  //       } else {
  //         // Si no existe, lo creamos
  //         await this.datoEsaviRepository.save(datoEsavi);
  //         datoEsaviArray.push(datoEsavi);
  //       }
  //     }

  //     // Si solo se envió un solo objeto, devolvemos el objeto DatoEsavi directamente
  //     return isArray ? datoEsaviArray : datoEsaviArray[0];
  //   } catch (e) {
  //     this.logger.error(`Error al procesar datos esavi: ${e.message}`);
  //     throw new Error('Hubo un problema al crear o eliminar datos esavi');
  //   } finally {
  //     this.logger.log(
  //       `DatoEsavi has been created/updated: ${JSON.stringify(createDto)}`,
  //     );
  //   }
  // }

  async create(
    notificacion: Notificacion,
    createDto: CreateDatoEsaviDto | CreateDatoEsaviDto[], // Puede ser un objeto o un arreglo de objetos
  ): Promise<DatoEsavi | DatoEsavi[]> {
    const createDtos = Array.isArray(createDto) ? createDto : [createDto];

    try {
      const datoEsaviArray: DatoEsavi[] = [];

      // Procesar cada objeto en el arreglo (o el único objeto si es un solo elemento)
      for (const dto of createDtos) {
        const datoEsavi = plainToClass(DatoEsavi, {
          createdBy: 'System',
          createdAt: new Date(),
          updatedBy: 'System',
          updatedAt: new Date(),
          ...dto,
        });
        datoEsavi.notificacion = notificacion;

        // Buscar si ya existe un DatoEsavi con la misma notificación, fechaEsavi y nombre
        const existingDatoEsavi = await this.datoEsaviRepository.findOne({
          where: {
            notificacion: { id: notificacion.id },
            fechaEsavi: dto.fechaEsavi,
            nombre: dto.nombre,
            descripcion: dto.descripcion,
          },
        });

        if (existingDatoEsavi) {
          Object.assign(existingDatoEsavi, dto);
          await this.datoEsaviRepository.save(existingDatoEsavi); // Guardamos la actualización
          datoEsaviArray.push(existingDatoEsavi); // Añadimos al arreglo
        } else {
          await this.datoEsaviRepository.save(datoEsavi);
          datoEsaviArray.push(datoEsavi); // Añadimos al arreglo
        }
      }

      // Retornamos un solo objeto o un arreglo según el caso
      return createDtos.length === 1 ? datoEsaviArray[0] : datoEsaviArray;
    } catch (e) {
      // En caso de error, mostramos un mensaje claro
      this.logger.error(`Error al procesar datos esavi: ${e.message}`);
      throw new Error('Hubo un problema al crear o actualizar los datos ESAVI');
    } finally {
      // Registro de la operación
      this.logger.log(`DatoEsavi(s) procesado(s): ${JSON.stringify(createDtos)}`);
    }
  }

  delete(uuid: string): Promise<DatoVacuna> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<DatoEsavi[]> {
    return this.datoEsaviRepository.find({
      where: {
        isActive: true,
      },
    });
  }

  async findOne(uuid: string): Promise<DatoEsavi> {
    const datoEsavi = await this.datoEsaviRepository.findOne({
      where: {
        isActive: true,
        id: uuid,
      },
    });
    if (datoEsavi) {
      return datoEsavi;
    }
    throw new EntityNotFoundException('DatoEsavi', uuid);
  }

  async update(uuid: string, updateDatoEsaviDto: UpdateDatoEsaviDto): Promise<DatoEsavi> {
    const datoVacuna = await this.findOne(uuid);
    this.datoEsaviRepository.merge(datoVacuna, updateDatoEsaviDto);
    return this.datoEsaviRepository.save(datoVacuna);
  }
}
