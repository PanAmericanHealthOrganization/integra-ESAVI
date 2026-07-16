import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { In, Repository } from 'typeorm';
import { CreateMedicamentoDto, UpdateMedicamentoDto } from '../dto';
import { Medicamento } from '../entity/medicamento.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

@Injectable()
export class MedicamentoService {
  private readonly logger = new Logger(MedicamentoService.name);

  private medicamentosCache: Map<string, Map<string, Medicamento>> | null = null;

  constructor(
    @InjectRepository(Medicamento, 'POSTGRES_INTEGRATOR_DS')
    private readonly medicamentoRepository: Repository<Medicamento>,
  ) {}

  async preloadByNotificacionIds(notificacionIds: string[]): Promise<void> {
    if (!notificacionIds.length) { this.medicamentosCache = new Map(); return; }
    const items = await this.medicamentoRepository.find({
      where: { notificacion: { id: In(notificacionIds) } },
      relations: ['notificacion'],
    });
    this.medicamentosCache = new Map();
    for (const m of items) {
      const nid = m.notificacion?.id;
      if (!nid || !m.codigoATC) continue;
      if (!this.medicamentosCache.has(nid)) this.medicamentosCache.set(nid, new Map());
      this.medicamentosCache.get(nid).set(m.codigoATC, m);
    }
    this.logger.log(`Medicamentos precargados: ${items.length}`);
  }

  clearMedicamentosCache(): void {
    this.medicamentosCache = null;
  }

  async createOneToMany(notificacion: Notificacion, createDto: CreateMedicamentoDto[]): Promise<Medicamento[]> {
    try {
      // Antes esto solo construía instancias en memoria (repository.create) sin
      // llamar a save(): nada quedaba persistido. Reutiliza createOneToOne, que ya
      // hace upsert por notificacion+codigoATC, así es seguro reprocesar en un
      // reimport.
      const medicinaList: Medicamento[] = [];
      for (const item of createDto) {
        medicinaList.push(await this.createOneToOne(notificacion, item));
      }
      return medicinaList;
    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      this.logger.log(`Medicamento ha sido procesado (createOneToMany)`);
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
  async createOneToOne(notificacion: Notificacion, createDto: CreateMedicamentoDto): Promise<Medicamento> {
    try {
      // Verificar si ya existe un medicamento con los mismos datos
      const notificacionExistente = new Notificacion();
      notificacionExistente.id = notificacion.id;
      const existingMedicamento = this.medicamentosCache !== null
        ? (this.medicamentosCache.get(notificacion.id)?.get(createDto.codigoATC) ?? null)
        : await this.medicamentoRepository.findOne({
            where: { notificacion: notificacionExistente, codigoATC: createDto.codigoATC },
          });

      if (existingMedicamento) {
        Object.assign(existingMedicamento, createDto);
        existingMedicamento.notificacion = notificacion;
        existingMedicamento.createdBy = process.env.USUARIO_INSERTA_REGISTRO;
        return this.medicamentoRepository.save(existingMedicamento);
      }

      const medicamento = plainToClass(Medicamento, createDto);
      medicamento.notificacion = notificacion;
      medicamento.createdBy = process.env.USUARIO_INSERTA_REGISTRO;
      const saved = await this.medicamentoRepository.save(medicamento);
      if (this.medicamentosCache !== null && saved.codigoATC) {
        if (!this.medicamentosCache.has(notificacion.id)) this.medicamentosCache.set(notificacion.id, new Map());
        this.medicamentosCache.get(notificacion.id).set(saved.codigoATC, saved);
      }
      return saved;
    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      this.logger.log(`Medicamento ha sido procesado`);
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
