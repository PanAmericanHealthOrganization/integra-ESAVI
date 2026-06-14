import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams, IPaginationResponse } from 'src/utils/interfaces/pagination';
import { CreateHomologationDto } from '../dto/create-homologation.dto';
import { UpdateHomologationDto } from '../dto/update-homologation.dto';
import { Homologation } from '../entity/homologation.entity';

@Injectable()
export class HomologationService {
  private readonly logger = new Logger(HomologationService.name);

  private readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  constructor(
    @InjectRepository(Homologation, 'POSTGRES_INTEGRATOR_DS')
    private readonly repository: Repository<Homologation>,
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

  async getOne(id: Identificator): Promise<Homologation> {
    const cleanId = this.validateId(id);
    const record = await this.repository.findOne({ where: { id: cleanId }, relations: ['homologator'] });
    if (!record) throw new NotFoundException(`Homologation ${cleanId} no encontrada`);
    return record;
  }

  async getMany(params: IGetManyParams): Promise<Homologation[]> {
    const ids = (params.ids as string[]).map((id) => this.validateId(id));
    return this.repository.find({ where: { id: In(ids) } });
  }

  async getPaginated(params: GetListParams): Promise<IPaginationResponse<Homologation>> {
    const { pagination, sort, filter } = params;
    const { page, perPage } = pagination;

    const where: any = {};
    if (filter?.homologatorId) where.homologatorId = filter.homologatorId;
    if (filter?.sourceSystem) where.sourceSystem = ILike(`%${filter.sourceSystem}%`);
    if (filter?.comparisonType) where.comparisonType = filter.comparisonType;

    const allowedSortFields = ['sourceSystem', 'sourceField', 'sourceValue', 'priority', 'comparisonType', 'createdAt'];
    const sortField = allowedSortFields.includes(sort?.field) ? sort.field : 'priority';
    const sortOrder = sort?.order === 'ASC' ? 'ASC' : 'DESC';

    const [data, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      order: { [sortField]: sortOrder },
    });

    return { data, total };
  }

  async create(dto: CreateHomologationDto): Promise<Homologation> {
    const record = this.repository.create({
      ...dto,
      updatedBy: dto.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.repository.save(record);
  }

  async update(id: Identificator, dto: UpdateHomologationDto): Promise<Homologation> {
    const cleanId = this.validateId(id);
    await this.getOne(cleanId);
    await this.repository.update(cleanId, { ...dto, updatedAt: new Date() });
    return this.getOne(cleanId);
  }

  async delete(id: Identificator, auditData: any): Promise<Homologation> {
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
