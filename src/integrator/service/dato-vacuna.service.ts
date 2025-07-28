import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Notificacion } from '../entity/notificacion.entity';
import { DatoVacuna } from '../entity/dato-vacuna.entity';
import { CreateDatoVacunaDto } from '../dto/create-dato-vacuna.dto';
import { UpdateDatoVacunaDto } from '../dto/update-dato-vacuna.dto';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class DatoVacunaService {
  private readonly logger = new Logger(DatoVacunaService.name);

  constructor(
    @InjectRepository(DatoVacuna)
    private readonly datoVacunaRepository: Repository<DatoVacuna>,
  ) {}

  // async create(
  //   notificacion: Notificacion,
  //   createDto: CreateDatoVacunaDto | CreateDatoVacunaDto[] ,
  // ): Promise<DatoVacuna> {
  //   console.log("PacienteDto::" , createDto);
  //   console.log("PacienteNoti::" , notificacion);

    
  //   try {
  //     const datoVacuna = plainToClass(DatoVacuna, createDto);
  //     datoVacuna.notificacion = notificacion;
  //     console.log("PacienteDato::" , datoVacuna.notificacion);

  //     return this.datoVacunaRepository.save(datoVacuna);
  //   } catch (e) {
  //     throw e;
  //   } finally {
  //     this.logger.log(
  //       `DatoVacuna has been created: ${JSON.stringify(createDto)}`,
  //     );
  //   }
  // }


  // async create(
  //   notificacion: Notificacion,
  //   createDto: CreateDatoVacunaDto | CreateDatoVacunaDto[], // Aceptar tanto un solo objeto como un arreglo
  // ): Promise<DatoVacuna | DatoVacuna[]> {
  //   console.log("PacienteDtoVacuna::", createDto);
  //   console.log("PacienteNotiVacuna::", notificacion);
  
  //   try {
  //     // Buscar todos los datos de vacuna relacionados con la notificación
  //     const datosVacunaExistentes = await this.findByNotificacionId(notificacion.id);
  
  //     let datosVacuna: DatoVacuna[] = [];
  
  //     // Si es un arreglo de objetos
  //     if (Array.isArray(createDto)) {
  //       // Iteramos sobre cada objeto en el arreglo
  //       datosVacuna = await Promise.all(createDto.map(async (dto) => {
  //         const datoVacuna = plainToClass(DatoVacuna, dto);
  //         datoVacuna.notificacion = notificacion; // Asociamos la notificación
  
  //         // Verificamos si ya existe un registro para este dto en los registros existentes
  //         const datoVacunaExistente = datosVacunaExistentes.find(
  //           (vacuna) => vacuna.id === datoVacuna.id // Comparamos por ID o algún otro campo clave
  //         );
  
  //         if (datoVacunaExistente) {
  //           // Si existe, actualizamos sus campos
  //           Object.keys(dto).forEach((key) => {
  //             if (dto[key] !== undefined && dto[key] !== null) {
  //               datoVacunaExistente[key] = dto[key];
  //             }
  //           });
  //           // No necesitamos crear un nuevo objeto, solo actualizamos el existente
  //           return datoVacunaExistente;
  //         } else {
  //           // Si no existe, lo creamos como un nuevo registro
  //           return datoVacuna;
  //         }
  //       }));
  //     } else {
  //       // Si es un solo objeto, procesamos de manera similar
  //       const dto = createDto;
  //       const datoVacuna = plainToClass(DatoVacuna, dto);
  //       datoVacuna.notificacion = notificacion;
  
  //       const datoVacunaExistente = datosVacunaExistentes.find(
  //         (vacuna) => vacuna.id === datoVacuna.id
  //       );
  
  //       if (datoVacunaExistente) {
  //         // Si ya existe, actualizamos sus campos
  //         Object.keys(dto).forEach((key) => {
  //           if (dto[key] !== undefined && dto[key] !== null) {
  //             datoVacunaExistente[key] = dto[key];
  //           }
  //         });
  //         datosVacuna = [datoVacunaExistente]; // Actualizamos el objeto existente
  //       } else {
  //         // Si no existe, lo creamos como nuevo
  //         datosVacuna = [datoVacuna];
  //       }
  //     }
  
  //     // Guardamos los datos vacunales, ya sean nuevos o actualizados
  //     const result = await this.datoVacunaRepository.save(datosVacuna); // Aquí se guarda o actualiza
  
  //     return result;
  //   } catch (e) {
  //     this.logger.error(`Error al procesar los datos de vacuna: ${e.message}`);
  //     throw new Error('Hubo un problema al crear o actualizar los datos de vacuna');
  //   } finally {
  //     this.logger.log(`DatoVacuna ha sido procesado: ${JSON.stringify(createDto)}`);
  //   }
  // }

  async createVigiflow(
    notificacion: Notificacion,
    createDto: CreateDatoVacunaDto, // Ahora solo aceptamos un único objeto
  ): Promise<DatoVacuna> { // Retornamos un solo objeto
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
        const datoVacuna = plainToClass(DatoVacuna, dto);
        datoVacuna.notificacion = notificacion;
  
        // Crear una instancia de notificación para la búsqueda
        const notificacionInstancia = new Notificacion();
        notificacionInstancia.id = notificacion.id;
  
        // Buscar si ya existe un DatoVacuna con la misma notificación y nombreVacuna
        const existingDatoVacuna = await this.datoVacunaRepository.findOne({
          where: {
            notificacion: notificacionInstancia,
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
  
  

 
  
  

  delete(uuid: string): Promise<DatoVacuna> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<DatoVacuna[]> {
    return this.datoVacunaRepository.find({
      where: {
        isActive: true,
      },
    });
  }

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

  async update(
    uuid: string,
    vacunaDto: UpdateDatoVacunaDto,
  ): Promise<DatoVacuna> {
    const datoVacuna = await this.findOne(uuid);
    this.datoVacunaRepository.merge(datoVacuna, vacunaDto);
    return this.datoVacunaRepository.save(datoVacuna);
  }


  
}
