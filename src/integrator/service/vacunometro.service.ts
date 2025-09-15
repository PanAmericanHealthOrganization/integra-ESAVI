import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Vacunometro } from '../entity/vacunometro.entity';
import {
  GetListParams,
  IPaginationResponse,
} from 'src/utils/interfaces/pagination';
import {
  IController,
  Identificator,
  IGetManyParams,
} from 'src/utils/IController';
import { IBaseEntity } from 'src/utils/interfaces/baseEntity';

@Injectable()
export class VacunometroService
  implements IController<Vacunometro, Vacunometro, Vacunometro>
{
  /**
   *
   * @param vacunometroRepository
   */
  constructor(
    @InjectRepository(Vacunometro, 'POSTGRES_INTEGRATOR_DS')
    private readonly vacunometroRepository: Repository<Vacunometro>,
  ) {}

  private readonly logger = new Logger(VacunometroService.name);

  /**
   *
   * @param id
   * @returns
   */
  public getOne(id: Identificator): Promise<Vacunometro> {
    return this.vacunometroRepository.findOne({ where: { id: id as string } });
  }

  /**
   *
   * @param params
   * @returns
   */
  public getMany(params: IGetManyParams): Promise<Vacunometro[]> {
    return this.vacunometroRepository.find({
      where: { id: In(params.ids as string[]) },
    });
  }

  /**
   *
   * @param paginated
   * @returns
   */
  public async getPaginated(
    paginated: GetListParams,
  ): Promise<IPaginationResponse<Vacunometro>> {
    const { pagination } = paginated;
    const { page, perPage } = pagination;

    const [data, total] = await this.vacunometroRepository.findAndCount({
      skip: (page - 1) * perPage,
      take: perPage,
    });
    return { data, total };
  }

  /**
   *
   * @returns
   */
  public async findAll(): Promise<Vacunometro[]> {
    return this.vacunometroRepository.find();
  }

  /**
   *
   * @returns
   */
  public async create(vacunometro: Vacunometro): Promise<Vacunometro> {
    return this.vacunometroRepository.save(vacunometro);
  }

  /**
   *
   * @returns
   */
  public async update(
    id: Identificator,
    vacunometro: Vacunometro,
  ): Promise<Vacunometro> {
    const exist = await this.getOne(id);
    if (!exist) {
      throw new Error(`El registro con id ${id} no existe.`);
    }
    await this.vacunometroRepository.update(id, vacunometro);
    return this.getOne(id);
  }

  /**
   *
   * @returns
   */
  public async delete(
    id: Identificator,
    auditoria: IBaseEntity,
  ): Promise<void> {
    await this.vacunometroRepository.update(id, {
      state: false,
      enabled: false,
      ...auditoria,
    });
  }

  /**
   *
   * @param vacunometro
   * @returns
   */
  public async createMany(vacunometro: Vacunometro[]): Promise<Vacunometro[]> {
    try {
      return this.vacunometroRepository.save(vacunometro);
    } catch (e) {
      this.logger.error(`Error al procesar los datos de vacuna: ${e.message}`);
      throw new Error(
        'Hubo un problema al crear o actualizar los datos de vacuna',
      );
    } finally {
      this.logger.log(
        `DatoVacuna ha sido procesado: ${JSON.stringify(vacunometro)}`,
      );
    }
  }
}
