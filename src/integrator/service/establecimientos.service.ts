import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { log } from 'console';
import { Identificator, IGetManyParams, IService } from 'src/utils/IController';
import { IBaseEntity } from 'src/utils/interfaces/baseEntity';
import { GetListParams, IPaginationResponse } from 'src/utils/interfaces/pagination';
import { In, Repository } from 'typeorm';
import {
  EstablecimientoCreateDto,
  EstablecimientoDto,
  EstablecimientoUpdateDto,
} from '../dto/establecimiento.dto';
import { Establecimiento } from '../entity/establecimiento.entity';

@Injectable()
export class EstablecimientosService
  implements IService<EstablecimientoCreateDto, EstablecimientoDto, EstablecimientoUpdateDto>
{
  constructor(
    @InjectRepository(Establecimiento, 'POSTGRES_INTEGRATOR_DS')
    private readonly establecimientoRepository: Repository<Establecimiento>,
  ) {}

  private readonly logger = new Logger(EstablecimientosService.name);

  exist(id: number | string): Promise<boolean> {
    return this.establecimientoRepository.exist({ where: { id: id as string } });
  }

  public getOne(id: Identificator): Promise<EstablecimientoDto> {
    return this.establecimientoRepository.findOne({ where: { id: id as string } });
  }

  public getMany(params: IGetManyParams): Promise<Establecimiento[]> {
    return this.establecimientoRepository.find({
      where: { id: In(params.ids as string[]) },
    });
  }

  public async getPaginated(
    paginated: GetListParams,
  ): Promise<IPaginationResponse<Establecimiento>> {
    const { pagination, sort } = paginated;
    const { page, perPage } = pagination;
    const sortOrder = sort.order === 'ASC' ? 'ASC' : 'DESC';
    const sortField = sort.field || 'createdAt';
    const csort = {};
    csort[sortField] = sortOrder;
    const [data, total] = await this.establecimientoRepository.findAndCount({
      skip: (page - 1) * perPage,
      take: perPage,
      order: { ...csort },
    });
    return { data, total };
  }

  public async findAll(): Promise<Establecimiento[]> {
    return this.establecimientoRepository.find();
  }

  public async create(establecimiento: Establecimiento): Promise<EstablecimientoDto> {
    return this.establecimientoRepository.save(establecimiento);
  }

  public async update(
    id: Identificator,
    establecimiento: Establecimiento,
  ): Promise<EstablecimientoDto> {
    const exist = await this.getOne(id);
    if (!exist) {
      throw new Error(`El registro con id ${id} no existe.`);
    }
    await this.establecimientoRepository.update(id, establecimiento);
    return this.getOne(id);
  }

  public async delete(id: Identificator, auditoria: IBaseEntity): Promise<EstablecimientoDto> {
    await this.establecimientoRepository.update(id, {});
    log('Deleted establecimiento with id:', id);
    return this.establecimientoRepository.findOne({ where: { id: id as string } });
  }

  public async createMany(establecimientos: any[]): Promise<Establecimiento[]> {
    throw new Error('Method not implemented.');
  }
}
