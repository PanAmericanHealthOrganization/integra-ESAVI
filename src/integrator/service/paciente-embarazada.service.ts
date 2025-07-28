import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PacienteEmbarazada } from "../entity/paciente-embarazada.entity";
import { Repository } from "typeorm";
import { CreatePacienteEmbarazadaDto } from "../dto/create-paciente-embarazada.dto";
import { Notificacion } from "../entity/notificacion.entity";
import { plainToClass } from "class-transformer";


@Injectable()
export class PacienteEmbarazadaServive {
    private readonly logger = new Logger(PacienteEmbarazadaServive.name);

    constructor(
        @InjectRepository(PacienteEmbarazada)
        private readonly pacienteEmbarazadaRepository: Repository<PacienteEmbarazada>,
      ) {}

      // async create(
      //   notificacion: Notificacion,
      //   createDto: CreatePacienteEmbarazadaDto,
      // ): Promise<PacienteEmbarazada> {
      //   try {
      //     const pacienteEmbarazada = plainToClass(PacienteEmbarazada, createDto);
      //     pacienteEmbarazada.notificacion = notificacion;
      //     pacienteEmbarazada.createdBy = 'AUTOMATICO';
      //     return this.pacienteEmbarazadaRepository.save(pacienteEmbarazada);
      //   } catch (e) {
      //     throw e;
      //   } finally {
      //     this.logger.log(
      //       `PacienteEmbarazada has been created: ${JSON.stringify(createDto)}`,
      //     );
      //   }
      // }

      async create(
        notificacion: Notificacion,
        createDto: CreatePacienteEmbarazadaDto,
      ): Promise<PacienteEmbarazada> {
        try {
          // Llamamos a la nueva función para buscar si ya existe un registro para la notificación
          const pacienteEmbarazadaExistente = await this.findByNotificacionId(notificacion.id);
      
          if (pacienteEmbarazadaExistente) {
            // Si existe, actualizamos el registro
            console.log("PacienteEmbarazada existe, actualizando...");
      
            // Actualizamos los campos solo si vienen en el DTO
            Object.keys(createDto).forEach((key) => {
              if (createDto[key] !== undefined && createDto[key] !== null) {
                pacienteEmbarazadaExistente[key] = createDto[key];
              }
            });
      
            // Aseguramos que la notificación esté asociada y que no cambiemos el 'createdBy'
            pacienteEmbarazadaExistente.notificacion = notificacion;
            pacienteEmbarazadaExistente.createdBy = pacienteEmbarazadaExistente.createdBy || 'AUTOMATICO';
      
            // Guardamos el registro actualizado
            return this.pacienteEmbarazadaRepository.save(pacienteEmbarazadaExistente);
          } else {
            // Si no existe, creamos un nuevo registro
            console.log("PacienteEmbarazada no existe, creando nuevo...");
      
            const pacienteEmbarazada = plainToClass(PacienteEmbarazada, createDto);
            pacienteEmbarazada.notificacion = notificacion;
            pacienteEmbarazada.createdBy = 'AUTOMATICO';
      
            // Guardamos el nuevo registro
            return this.pacienteEmbarazadaRepository.save(pacienteEmbarazada);
          }
        } catch (e) {
          this.logger.error(`Error al procesar PacienteEmbarazada: ${e.message}`);
          throw new Error('Hubo un problema al crear o actualizar el registro de PacienteEmbarazada');
        } finally {
          this.logger.log(`PacienteEmbarazada ha sido procesado: ${JSON.stringify(createDto)}`);
        }
      }
      

      async findByNotificacionId(notificacionId: string): Promise<PacienteEmbarazada | null> {
        try {
          // Realizamos la búsqueda en la base de datos por el ID de notificación
          const datoVacuna = await this.pacienteEmbarazadaRepository.findOne({
            where: { notificacion: { id: notificacionId } }, // Filtrar por notificación ID
          });
          return datoVacuna || null; // Devolver el dato o null si no se encuentra
        } catch (error) {
          console.error('Error al buscar DatoVacuna por ID de notificación:', error);
          return null; // Si ocurre un error, devolvemos null
        }
      }
    
    
}