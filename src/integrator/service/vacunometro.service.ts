import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IController, Identificator, IGetManyParams } from 'src/utils/IController';
import { IBaseEntity } from 'src/utils/interfaces/baseEntity';
import { GetListParams, IPaginationResponse } from 'src/utils/interfaces/pagination';
import { In, Repository } from 'typeorm';
import { VacunometroCreateDto, VacunometroDto, VacunometroUpdateDto } from '../dto/vacunometro.dto';
import { Vacunometro } from '../entity/vacunometro.entity';

@Injectable()
export class VacunometroService
  implements IController<VacunometroCreateDto, VacunometroDto, VacunometroUpdateDto>
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
  public getOne(id: Identificator): Promise<VacunometroDto> {
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
  public async getPaginated(paginated: GetListParams): Promise<IPaginationResponse<Vacunometro>> {
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
  public async create(vacunometro: Vacunometro): Promise<VacunometroDto> {
    return this.vacunometroRepository.save(vacunometro);
  }

  /**
   *
   * @returns
   */
  public async update(id: Identificator, vacunometro: Vacunometro): Promise<VacunometroDto> {
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
  public async delete(id: Identificator, auditoria: IBaseEntity): Promise<void> {
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
  public async createMany(vacunometro: any[]): Promise<Vacunometro[]> {
    try {
      const vacunometros: Vacunometro[] = vacunometro.map((v) => {
        const fecha = new Date(v.FECHA_APLICACION);
        return {
          unicode: v.UNICODE,
          nombreVacuna: v.NOMBRE_VACUNA,
          dosisAplicada: '', // Este campo no está en la consulta, se deja vacío
          diaAplicacion: fecha.getDate(),
          mesAplicacion: fecha.getMonth() + 1, // Los meses en JavaScript son 0-indexados
          anioAplicacion: fecha.getFullYear(),
          fechaAplicacion: fecha,
          sexo: v.SEXO,
          total: v.TOTAL,
        } as Vacunometro;
      });
      return this.vacunometroRepository.save(vacunometros);
    } catch (e) {
      this.logger.error(`Error al procesar los datos de vacuna: ${e.message}`);
      throw new Error('Hubo un problema al crear o actualizar los datos de vacuna');
    } finally {
      this.logger.log(`DatoVacuna ha sido procesado: ${JSON.stringify(vacunometro)}`);
    }
  }
}
