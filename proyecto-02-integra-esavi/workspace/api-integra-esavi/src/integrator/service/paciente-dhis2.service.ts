import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreatePacienteDhis2Dto } from '../dto/create-paciente-dhis2.dto';
import { UpdatePacienteDto } from '../dto/update-paciente.dto';
import { PacienteDhis2 } from '../entity/paciente-dhis2.entity';
import { CatalogoService } from './catalogo.service';

@Injectable()
export class PacienteDhis2Service {
  private readonly logger = new Logger(PacienteDhis2Service.name);

  constructor(
    @InjectRepository(PacienteDhis2, 'POSTGRES_INTEGRATOR_DS')
    private readonly pacienteDhis2Repository: Repository<PacienteDhis2>,
    private readonly catalogoService: CatalogoService,
  ) {}

  // async create(createDto: CreatePacienteDhis2Dto): Promise<PacienteDhis2> {
  //   console.log("CrearPciente::", createDto);

  //   try {
  //     // Primero, verificamos si el paciente ya existe en la base de datos.
  //     const pacienteExistente = await this.findByDhis2Code(createDto.codigoDhis2.trim());
  //     console.log("DatosPacienteExistente::", pacienteExistente);

  //     if (pacienteExistente) {
  //       // Si el paciente ya existe, lo actualizamos y salimos de la función.
  //       console.log("Paciente ya existe, actualizando...");
  //       await this.update(pacienteExistente.id, createDto);
  //       console.log("Paciente actualizado correctamente.");
  //       return pacienteExistente;  // Devuelves el paciente actualizado.
  //     } else {
  //       console.log("Paciente no existe, creando nuevo...");

  //       const paciente = plainToClass(PacienteDhis2, createDto);

  //       // Asignamos el sexo si está presente en el DTO.
  //       if (createDto.sexoPaciente) {
  //         const sexo = await this.catalogoService.findByDescriptionToDhis2(createDto.sexoPaciente);
  //         paciente.sexo = sexo;
  //       }

  //       // Asignamos la autoidentificación si está presente en el DTO.
  //       if (createDto.autoIdentificacionPaciente) {
  //         const autoIdentificacionPaciente = createDto.autoIdentificacionPaciente
  //           .toUpperCase()
  //           .replace('Í', 'I'); // Aseguramos que 'Í' sea reemplazado por 'I' (en caso de que esté mal escrito)
  //         const autoIdentificacion = await this.catalogoService.findByDescriptionToDhis2(autoIdentificacionPaciente);
  //         paciente.autoIdentificacion = autoIdentificacion;
  //       }

  //       // Asignamos el usuario que está creando el registro.
  //       paciente.createdBy = process.env.USUARIO_INSERTA_REGISTRO;

  //       // Finalmente, guardamos el nuevo paciente.
  //       const pacienteCreado = await this.pacienteDhis2Repository.save(paciente);
  //       console.log("Nuevo paciente creado:", pacienteCreado);

  //       // Retornamos el paciente recién creado.
  //       return pacienteCreado;

  //     }

  //   } catch (error) {
  //     // Capturamos cualquier error y lo registramos.
  //     console.error("Error en la creación o actualización del paciente:", error);
  //     throw new Error('Hubo un problema al crear o actualizar el paciente');
  //   }
  // }

  async create(createDto: CreatePacienteDhis2Dto): Promise<PacienteDhis2> {
    try {
      // Primero, verificamos si el paciente ya existe en la base de datos.
      const pacienteExistente = await this.findByDhis2Code(createDto.codigoDhis2.trim());

      if (pacienteExistente) {
        // Si el paciente ya existe, lo actualizamos y salimos de la función.
        await this.update(pacienteExistente.id, createDto);
        return pacienteExistente; // Devuelves el paciente actualizado.
      } else {
        const paciente = plainToClass(PacienteDhis2, createDto);

        // Asignamos el sexo si está presente en el DTO.
        if (createDto.sexoPaciente) {
          const sexo = await this.catalogoService.findByDescriptionToDhis2(createDto.sexoPaciente);
          paciente.sexo = sexo;
        }

        // Asignamos la autoidentificación si está presente en el DTO.
        if (createDto.autoIdentificacionPaciente) {
          const autoIdentificacionPaciente = createDto.autoIdentificacionPaciente
            .toUpperCase()
            .replace('Í', 'I'); // Aseguramos que 'Í' sea reemplazado por 'I' (en caso de que esté mal escrito)
          const autoIdentificacion = await this.catalogoService.findByDescriptionToDhis2(
            autoIdentificacionPaciente,
          );
          paciente.autoIdentificacion = autoIdentificacion;
        }

        // Asignamos el usuario que está creando el registro.
        paciente.createdBy = process.env.USUARIO_INSERTA_REGISTRO;

        // Finalmente, guardamos el nuevo paciente.
        const nuevoPaciente = await this.pacienteDhis2Repository.create(paciente);
        const pacienteCreado = await this.pacienteDhis2Repository.save(nuevoPaciente);

        // Retornamos el paciente recién creado.
        return pacienteCreado;
      }
    } catch (error) {
      // Capturamos cualquier error y lo registramos.
      console.error('Error en la creación o actualización del paciente:', error);
      throw new Error('Hubo un problema al crear o actualizar el paciente');
    }
  }

  delete(uuid: string): Promise<PacienteDhis2> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<PacienteDhis2[]> {
    return this.pacienteDhis2Repository.find({
      where: {
        isActive: true,
      },
    });
  }

  async findOne(uuid: string): Promise<PacienteDhis2> {
    const paciente = await this.pacienteDhis2Repository.findOne({
      where: {
        isActive: true,
        id: uuid,
      },
    });
    if (paciente) {
      return paciente;
    }
    throw new Error(`Paciente ${uuid} is not found`);
  }

  async update(uuid: string, pacienteDto: UpdatePacienteDto): Promise<PacienteDhis2> {
    try {
      if (!pacienteDto.sexoPaciente) {
        throw new Error('Sexo del paciente no definido');
      }

      // Obtener los valores para los campos 'sexo' y 'autoIdentificacion' a partir de los DTO
      const sexo = await this.catalogoService.findByDescriptionToDhis2(pacienteDto?.sexoPaciente);
      // const autoIdentificacion = await this.catalogoService.findByDescriptionToDhis2(pacienteDto?.autoIdentificacionPaciente);

      // Buscar el paciente en la base de datos usando su código único (uuid)
      const pacienteDhis2 = await this.findOne(uuid);

      if (!pacienteDhis2) {
        throw new Error('Paciente no encontrado');
      }

      // Actualizar las propiedades del paciente con los nuevos valores
      pacienteDhis2.sexo = sexo;
      // pacienteDhis2.autoIdentificacion = autoIdentificacion;

      // Actualizar el paciente en la base de datos
      await this.pacienteDhis2Repository.update(uuid, pacienteDhis2);

      // Opcional: Si deseas devolver el objeto actualizado, puedes buscarlo nuevamente
      return await this.findByDhis2Code(uuid);
    } catch (error) {
      console.error('Error al actualizar el paciente:', error);
      throw error; // Lanza el error para que el controlador lo maneje
    }
  }

  async findByDhis2Code(code: string) {
    const paciente = await this.pacienteDhis2Repository.findOne({
      where: {
        codigoDhis2: code,
      },
    });

    if (paciente) {
      return paciente;
    }
    return null;
  }
}
