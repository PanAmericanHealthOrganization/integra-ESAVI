import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams, IPaginationResponse } from 'src/utils/interfaces/pagination';
import { CreateHomologatorDto } from '../dto/create-homologator.dto';
import { UpdateHomologatorDto } from '../dto/update-homologator.dto';
import { Homologator } from '../entity/homologator.entity';

@Injectable()
export class HomologatorService {
  private readonly logger = new Logger(HomologatorService.name);

  private readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  constructor(
    @InjectRepository(Homologator, 'POSTGRES_INTEGRATOR_DS')
    private readonly repository: Repository<Homologator>,
  ) {}

  private validateId(id: Identificator): string {
    const str = String(id).trim();
    if (!this.UUID_REGEX.test(str)) {
      throw new BadRequestException(`ID UUID inválido: ${str}`);
    }
    return str;
  }

  async exist(id: Identificator): Promise<boolean> {
    return this.repository.exist({ where: { id: this.validateId(id) } });
  }

  async getOne(id: Identificator): Promise<Homologator> {
    const cleanId = this.validateId(id);
    const record = await this.repository.findOne({ where: { id: cleanId } });
    if (!record) throw new NotFoundException(`Homologator ${cleanId} no encontrado`);
    return record;
  }

  async getMany(params: IGetManyParams): Promise<Homologator[]> {
    const ids = (params.ids as string[]).map((id) => this.validateId(id));
    return this.repository.find({ where: { id: In(ids) } });
  }

  async getPaginated(params: GetListParams): Promise<IPaginationResponse<Homologator>> {
    const { pagination, sort, filter } = params;
    const { page, perPage } = pagination;

    const where: any = {};
    if (filter?.entity) where.entity = ILike(`%${filter.entity}%`);
    if (filter?.field) where.field = ILike(`%${filter.field}%`);
    if (filter?.description) where.description = ILike(`%${filter.description}%`);

    const allowedSortFields = ['entity', 'field', 'targetType', 'createdAt', 'updatedAt'];
    const sortField = allowedSortFields.includes(sort?.field) ? sort.field : 'createdAt';
    const sortOrder = sort?.order === 'ASC' ? 'ASC' : 'DESC';

    const [data, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      order: { [sortField]: sortOrder },
    });

    return { data, total };
  }

  async create(dto: CreateHomologatorDto): Promise<Homologator> {
    const exists = await this.repository.findOne({ where: { entity: dto.entity, field: dto.field } });
    if (exists) {
      throw new ConflictException(`Ya existe un Homologator para entity="${dto.entity}" field="${dto.field}"`);
    }
    const record = this.repository.create({
      ...dto,
      updatedBy: dto.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.repository.save(record);
  }

  async update(id: Identificator, dto: UpdateHomologatorDto): Promise<Homologator> {
    const cleanId = this.validateId(id);
    await this.getOne(cleanId);
    await this.repository.update(cleanId, { ...dto, updatedAt: new Date() });
    return this.getOne(cleanId);
  }

  async delete(id: Identificator, auditData: any): Promise<Homologator> {
    const cleanId = this.validateId(id);
    await this.getOne(cleanId);
    await this.repository.update(cleanId, {
      isActive: false,
      isEnabled: false,
      deletedAt: new Date(),
      deletedBy: auditData?.deletedBy || 'SYSTEM',
    });
    return this.getOne(cleanId);
  }
}
