import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams, IPaginationResponse } from 'src/utils/interfaces/pagination';
import { CrearHomologadorDto, ActualizarHomologadorDto } from '../dto';
import { Homologador } from '../entity/homologador.entity';

@Injectable()
export class HomologadorService {
  private readonly logger = new Logger(HomologadorService.name);

  private readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  constructor(
    @InjectRepository(Homologador, 'POSTGRES_INTEGRATOR_DS')
    private readonly repository: Repository<Homologador>,
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

  async obtenerUno(id: Identificator): Promise<Homologador> {
    const cleanId = this.validarId(id);
    const registro = await this.repository.findOne({ where: { id: cleanId } });
    if (!registro) throw new NotFoundException(`Homologador ${cleanId} no encontrado`);
    return registro;
  }

  async obtenerVarios(params: IGetManyParams): Promise<Homologador[]> {
    const ids = (params.ids as string[]).map((id) => this.validarId(id));
    return this.repository.find({ where: { id: In(ids) } });
  }

  async obtenerPaginado(params: GetListParams): Promise<IPaginationResponse<Homologador>> {
    const { pagination, sort, filter } = params;
    const { page, perPage } = pagination;

    const where: any = {};
    if (filter?.entity) where.entity = ILike(`%${filter.entity}%`);
    if (filter?.field) where.field = ILike(`%${filter.field}%`);
    if (filter?.description) where.description = ILike(`%${filter.description}%`);

    const camposOrdenables = ['entity', 'field', 'targetType', 'createdAt', 'updatedAt'];
    const campoOrden = camposOrdenables.includes(sort?.field) ? sort.field : 'createdAt';
    const direccionOrden = sort?.order === 'ASC' ? 'ASC' : 'DESC';

    const [data, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      order: { [campoOrden]: direccionOrden },
    });

    return { data, total };
  }

  async crear(dto: CrearHomologadorDto): Promise<Homologador> {
    const existe = await this.repository.findOne({ where: { entity: dto.entity, field: dto.field } });
    if (existe) {
      throw new ConflictException(`Ya existe un Homologador para entity="${dto.entity}" field="${dto.field}"`);
    }
    const registro = this.repository.create({
      ...dto,
      updatedBy: dto.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.repository.save(registro);
  }

  async actualizar(id: Identificator, dto: ActualizarHomologadorDto): Promise<Homologador> {
    const cleanId = this.validarId(id);
    await this.obtenerUno(cleanId);
    await this.repository.update(cleanId, { ...dto, updatedAt: new Date() });
    return this.obtenerUno(cleanId);
  }

  async eliminar(id: Identificator, auditData: any): Promise<Homologador> {
    const cleanId = this.validarId(id);
    await this.obtenerUno(cleanId);
    await this.repository.update(cleanId, {
      isActive: false,
      isEnabled: false,
      deletedAt: new Date(),
      deletedBy: auditData?.deletedBy || 'SYSTEM',
    });
    return this.obtenerUno(cleanId);
  }
}
