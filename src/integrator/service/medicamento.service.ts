import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateMedicamentoDto } from '../dto/create-medicamento.dto';
import { UpdateMedicamentoDto } from '../dto/update-medicamento.dto';
import { Medicamento } from '../entity/medicamento.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class MedicamentoService {
  private readonly logger = new Logger(MedicamentoService.name);

  constructor(
    @InjectRepository(Medicamento, 'POSTGRES_INTEGRATOR_DS')
    private readonly medicamentoRepository: Repository<Medicamento>,
  ) {}

  async createOneToMany(
    notificacion: Notificacion,
    createDto: CreateMedicamentoDto[],
  ): Promise<Medicamento[]> {
    try {
      const medicinaList = [];
      createDto.forEach((item) => {
        const medicamento = plainToClass(Medicamento, item);
        medicamento.notificacion = notificacion;
        medicinaList.push(this.medicamentoRepository.create(medicamento));
      });
      return medicinaList;
    } catch (e) {
      console.log('*******************************************************');
      console.log(e);
      console.log('*******************************************************');
      this.logger.error(e);
      throw e;
    } finally {
      this.logger.log(
        `Medicamento has been created(createOneToMany): ${JSON.stringify(createDto)}`,
      );
    }
  }

  // async createOneToOne(
  //   notificacion: Notificacion,
  //   createDto: CreateMedicamentoDto,
  // ): Promise<Medicamento> {
  //   try {
  //     const medicamento = plainToClass(Medicamento, createDto);
  //     medicamento.notificacion = notificacion;
  //     medicamento.createdBy = process.env.USUARIO_INSERTA_REGISTRO;
  //     return this.medicamentoRepository.save(medicamento);

  //   } catch (e) {
  //     this.logger.error(e);
  //     throw e;
  //   } finally {
  //     this.logger.log(
  //       `Medicamento has been created(createOneToOne): ${JSON.stringify(createDto)}`,
  //     );
  //   }
  // }
  // TODO: este método debe ser mejorado para evitar duplicados, ademas de hacer multiples llamadas innecesarias a la base de datos, not tiene sentido consultar por cada medicamenteo si ya existe, se debe optimizar
  async createOneToOne(
    notificacion: Notificacion,
    createDto: CreateMedicamentoDto,
  ): Promise<Medicamento> {
    try {
      // Verificar si ya existe un medicamento con los mismos datos
      const notificacionExistente = new Notificacion();
      notificacionExistente.id = notificacion.id;
      const existingMedicamento = await this.medicamentoRepository.findOne({
        where: {
          notificacion: notificacionExistente,
          nombre: createDto.nombre,
          codigoATC: createDto.codigoATC,
        },
      });

      // Si existe, lo actualizamos
      if (existingMedicamento) {
        this.logger.log('Medicamento existe, se actualizará con los nuevos datos.');

        // Actualizamos el registro con los nuevos datos
        Object.assign(existingMedicamento, createDto); // Actualizamos las propiedades del registro

        // También actualizamos la notificación, por si se cambia
        existingMedicamento.notificacion = notificacion;

        // Actualizamos el campo de quién lo está creando
        existingMedicamento.createdBy = process.env.USUARIO_INSERTA_REGISTRO;

        // Guardamos el registro actualizado
        return this.medicamentoRepository.save(existingMedicamento);
      }

      // Si no existe, creamos uno nuevo
      const medicamento = plainToClass(Medicamento, createDto);
      medicamento.notificacion = notificacion;
      medicamento.createdBy = process.env.USUARIO_INSERTA_REGISTRO;

      // Guardamos el nuevo Medicamento
      return this.medicamentoRepository.save(medicamento);
    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      this.logger.log(`Medicamento ha sido procesado (createOneToOne)`);
    }
  }

  delete(uuid: string): Promise<Medicamento> {
    return Promise.resolve(undefined);
  }

  findAll(): Promise<Medicamento[]> {
    return this.medicamentoRepository.find({
      where: {
        isActive: true,
      },
    });
  }

  async findOne(uuid: string): Promise<Medicamento> {
    const medicamento = await this.medicamentoRepository.findOne({
      where: {
        id: uuid,
      },
    });
    if (medicamento) {
      return medicamento;
    }
    throw new EntityNotFoundException(`Medicamento`, uuid);
  }

  async findOneBelongingToNotificacion(uuidNotificacion: string, uuidMedicamento: string) {
    const medicamento = await this.medicamentoRepository.findOne({
      where: {
        id: uuidMedicamento,
        notificacion: {
          id: uuidNotificacion,
        },
      },
    });
    if (medicamento) {
      return medicamento;
    }
    throw new EntityNotFoundException(`Medicamento`, uuidMedicamento);
  }

  async update(uuid: string, medicamentoDto: UpdateMedicamentoDto): Promise<Medicamento> {
    const medicamento = await this.findOne(uuid);
    this.medicamentoRepository.merge(medicamento, medicamentoDto);
    return this.medicamentoRepository.save(medicamento);
  }

  async findMedicinaByNotificacionUUID(uuid: string) {
    return this.medicamentoRepository.find({
      where: {
        notificacion: {
          id: uuid,
        },
      },
    });
  }
}
