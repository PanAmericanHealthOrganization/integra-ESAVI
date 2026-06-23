import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams, IPaginationResponse } from 'src/utils/interfaces/pagination';
import { ILike, In, Repository } from 'typeorm';
import { CrearReglaHomologacionDto, ActualizarReglaHomologacionDto } from '../dto';
import { ReglaHomologacion } from '../entity/regla-homologacion.entity';

@Injectable()
export class ReglaHomologacionService {
  private readonly logger = new Logger(ReglaHomologacionService.name);

  private readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  constructor(
    @InjectRepository(ReglaHomologacion, 'POSTGRES_INTEGRATOR_DS')
    private readonly repository: Repository<ReglaHomologacion>,
  ) {}

  private validarId(id: Identificator): string {
    const str = String(id).trim();
    if (!this.UUID_REGEX.test(str)) {
      throw new BadRequestException(`ID UUID inválido: ${str}`);
    }
    return str;
  }

  async existe(id: Identificator): Promise<boolean> {
    return this.repository.exist({ where: { id: this.validarId(id) } });
  }

  async obtenerUna(id: Identificator): Promise<ReglaHomologacion> {
    const cleanId = this.validarId(id);
    const registro = await this.repository.findOne({ where: { id: cleanId }, relations: ['homologador'] });
    if (!registro) throw new NotFoundException(`ReglaHomologacion ${cleanId} no encontrada`);
    return registro;
  }

  async obtenerVarias(params: IGetManyParams): Promise<ReglaHomologacion[]> {
    const ids = (params.ids as string[]).map((id) => this.validarId(id));
    return this.repository.find({ where: { id: In(ids) } });
  }

  async obtenerPaginado(params: GetListParams): Promise<IPaginationResponse<ReglaHomologacion>> {
    const { pagination, sort, filter } = params;
    const { page, perPage } = pagination;

    const where: any = {};
    if (filter?.homologadorId) where.homologadorId = filter.homologadorId;
    if (filter?.sourceSystem) where.sourceSystem = ILike(`%${filter.sourceSystem}%`);
    if (filter?.comparisonType) where.comparisonType = filter.comparisonType;

    const camposOrdenables = ['sourceSystem', 'sourceField', 'sourceValue', 'priority', 'comparisonType', 'createdAt'];
    const campoOrden = camposOrdenables.includes(sort?.field) ? sort.field : 'priority';
    const direccionOrden = sort?.order === 'ASC' ? 'ASC' : 'DESC';

    const [data, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      order: { [campoOrden]: direccionOrden },
    });

    return { data, total };
  }

  async crear(dto: CrearReglaHomologacionDto): Promise<ReglaHomologacion> {
    const registro = this.repository.create({
      ...dto,
      homologadorId: dto.homologadorId,
      updatedBy: dto.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.repository.save(registro);
  }

  async actualizar(id: Identificator, dto: ActualizarReglaHomologacionDto): Promise<ReglaHomologacion> {
    const cleanId = this.validarId(id);
    await this.obtenerUna(cleanId);
    await this.repository.update(cleanId, { ...dto, updatedAt: new Date() });
    return this.obtenerUna(cleanId);
  }

  async eliminar(id: Identificator, auditData: any): Promise<ReglaHomologacion> {
    const cleanId = this.validarId(id);
    await this.obtenerUna(cleanId);
    await this.repository.update(cleanId, {
      isActive: false,
      isEnabled: false,
      deletedAt: new Date(),
      deletedBy: auditData?.deletedBy || 'SYSTEM',
    });
    return this.obtenerUna(cleanId);
  }
}
