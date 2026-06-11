import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BasesCRUD, Identificator, IGetManyParams } from 'src/utils/IController';
//import { InvestigacionDto } from '../dto/investigacion.dto';
//import { Investigacion, InvestigacionUpdateDto } from '../entity/investigacion.entity';
import { Auditoria } from 'src/integrator/entity/auditoria.entity';
import { GetListParams, IPaginationResponse } from 'src/utils/interfaces/pagination';
import { ILike, In, Raw, Repository } from 'typeorm';
import {
  InvestigacionCreateDto,
  InvestigacionDto,
  InvestigacionUpdateDto,
} from '../entity/investigacion.entity';
import { Investigacion } from '../entity/investigacion.entity';
import { withAuditOnCreate, withAuditOnUpdate } from 'src/common/utils/audit.util';
import { Notificacion } from '../entity';


//Se recomienda usar las interfaces icontroller y la iservice,
//que se encuentran en src/utils/IController.ts
@Injectable()
export class InvestigacionService
  implements IServiceCreateOmit<InvestigacionCreateDto, InvestigacionDto, InvestigacionUpdateDto>
{
  //Se recomienda utilizar el ejemplo 'src/integrator/service/vacunometro.service.ts'
  /**
   * Logger de la clase InvestigacionService
   */
  private readonly logger = new Logger(InvestigacionService.name);
  /**
   * Constructor de la clase InvestigacionService
   * @param investigacionRepository Repositorio de la entidad Investigacion
   */
  constructor(
    @InjectRepository(Investigacion, 'POSTGRES_INTEGRATOR_DS')
    private readonly investigacionRepository: Repository<Investigacion>,
  ) {}

  /**
   *
   * @param id
   * @returns
   */
  exist(id: number | string): Promise<boolean> {
    return this.investigacionRepository.exist({ where: { id: id as string } });
  }

  /**
   *
   * @param id
   * @returns
   */
  async getOne(id: Identificator): Promise<InvestigacionDto> {
    return this.investigacionRepository.findOne({ where: { id: id as string } });
  }

  /**
   *
   * @param params
   * @returns
   */
  async getMany(params: IGetManyParams): Promise<InvestigacionDto[]> {
    return this.investigacionRepository.find({
      where: { id: In(params.ids as string[]) },
    });
  }

  /**
   *
   * @param paginated
   * @returns
   */
  public async getPaginated(paginated: GetListParams): Promise<IPaginationResponse<Investigacion>> {
    const { pagination, sort, filter } = paginated;

    let buildFilter = {};

    // Filtros para campos booleanos
    if (
      filter?.vacunatorioCalidad !== undefined &&
      typeof filter.vacunatorioCalidad === 'boolean'
    ) {
      buildFilter = { ...buildFilter, vacunatorioCalidad: filter.vacunatorioCalidad };
    }
    if (
      filter?.personalCapacitado !== undefined &&
      typeof filter.personalCapacitado === 'boolean'
    ) {
      buildFilter = { ...buildFilter, personalCapacitado: filter.personalCapacitado };
    }
    if (filter?.problemaBiologico !== undefined && typeof filter.problemaBiologico === 'boolean') {
      buildFilter = { ...buildFilter, problemaBiologico: filter.problemaBiologico };
    }
    if (
      filter?.muestraLaboratorio !== undefined &&
      typeof filter.muestraLaboratorio === 'boolean'
    ) {
      buildFilter = { ...buildFilter, muestraLaboratorio: filter.muestraLaboratorio };
    }

    // Filtro para fecha de investigación
    if (filter?.fechaInvestigacion && typeof filter.fechaInvestigacion === 'string') {
      const fechaInput = filter.fechaInvestigacion.trim();

      try {
        if (/^\d{4}$/.test(fechaInput)) {
          const year = parseInt(fechaInput);
          buildFilter = {
            ...buildFilter,
            fechaInvestigacion: Raw((alias) => `EXTRACT(YEAR FROM ${alias}) = :year`, {
              year: year,
            }),
          };
        } else if (/^\d{4}-\d{2}$/.test(fechaInput)) {
          const [year, month] = fechaInput.split('-').map(Number);
          buildFilter = {
            ...buildFilter,
            fechaInvestigacion: Raw(
              (alias) =>
                `EXTRACT(YEAR FROM ${alias}) = :year AND EXTRACT(MONTH FROM ${alias}) = :month`,
              {
                year: year,
                month: month,
              },
            ),
          };
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(fechaInput)) {
          const fecha = new Date(fechaInput);
          if (!isNaN(fecha.getTime())) {
            buildFilter = {
              ...buildFilter,
              fechaInvestigacion: Raw((alias) => `DATE(${alias}) = :date`, {
                date: fechaInput,
              }),
            };
          }
        }
      } catch (error) {
        console.warn('Error al procesar filtro de fecha:', fechaInput, error);
      }
    }

    const { page, perPage } = pagination;
    const sortOrder = sort?.order === 'ASC' ? 'ASC' : 'DESC';
    const sortField = sort?.field || 'createdAt';

    const validSortFields = [
      'id',
      'fechaInvestigacion',
      'vacunatorioCalidad',
      'personalCapacitado',
      'problemaBiologico',
      'busquedaCasosSintomatologiaConVacuna',
      'busquedaCasosSintomatologiaSinVacuna',
      'muestraLaboratorio',
      'createdAt',
      'updatedAt',
      'enabled',
      'state',
    ];

    const finalSortField = validSortFields.includes(sortField) ? sortField : 'createdAt';
    const csort = {};
    csort[finalSortField] = sortOrder;

    const [data, total] = await this.investigacionRepository.findAndCount({
      where: Object.keys(buildFilter).length > 0 ? buildFilter : {},
      skip: (page - 1) * perPage,
      take: perPage,
      order: { ...csort },
    });

    return { data, total };
  }

  /**
   *
   * @param investigacionCreateDto //esta es la data
   * @param notificacion //esta es la entidad a la que se le va a asociar la data de investigacion, el modelo o DTO es Notificacion
   * @returns
   */
  /*async create(investigacion: Investigacion): Promise<InvestigacionDto> {          
    return this.investigacionRepository.save(investigacion);
  }*/ //ESTE DTO SERÍA MÁS APLICABLE A UN DTO DE RESPUESTA O SALIDA.
  async create(investigacionCreateDto: InvestigacionCreateDto, notificacion: Notificacion): Promise<InvestigacionDto> {
    /*const investigacion = this.investigacionRepository.create({
      ...investigacionCreateDto,
      notificacion: notificacion,
    });*/
    /**
     * En teoría, no es necesario volver a validar registros duplicados antes de
     * persistir, puesto que la relación es de UNO-A-UNO, y además al momento
     * de la extracción general de datos, ya se filtra utilizando el 'codigoDhis2Evento'.
     * Sin embargo, en ambiente de desarrollo, se va a implemetar la validación previa
     * antes de utilizar el método "save" del repositorio.
     * Para esto, se utilizará el propio repositorio de 'Investigacion'. Si se encuentra un 
     * registro asociado a la notificación, se lanzará una excepción
     * indicando que ya existe un registro de investigación para esa notificación. Si es nuevo se registra,
     * si ya existe se intenta actualizar (esto ya lo hace de forma automática el método 'save').
    */

   //------------inicio opcional----------------
   try {
      const existingInvestigacion = await this.investigacionRepository.findOne({
        where: { notificacion: { id: notificacion.id } }, // Esta notificación es de tipo ENTIDAD no es DTO, por lo que se puede usar directamente para la consulta
      });

      if (existingInvestigacion) {
        // Si ya existe una investigación asociada a la notificación, se lanza una excepción
        throw new BadRequestException(
          `Ya existe un registro de investigación asociado a la notificación con ID ${notificacion.id}.`,
        );
      }
    } catch (error) {
      this.logger.error(`Error al verificar existencia de investigación: ${error.message}`);
      throw new BadRequestException('Hubo un problema al verificar la existencia de la investigación');
    }
    //---fin opcional----------------

    const investigacion = this.investigacionRepository.create({
      ...investigacionCreateDto,
      notificacion: notificacion,
    });
    return this.investigacionRepository.save( withAuditOnCreate(investigacion) );//this.investigacionRepository.save(withAuditOnCreate(investigacionCreateDto));
  }

  /**
   *
   * @param id
   * @param investigacion // la data que está asociada a la entidad Investigacion, el modelo o DTO es InvestigacionDto
   * @returns
   */
  async update(id: Identificator, investigacion: InvestigacionDto): Promise<InvestigacionDto> {
    const exist = await this.getOne(id);
    if (!exist) {
      throw new Error(`El registro de Investigacion con ${id} no existe.`);
    }
    withAuditOnUpdate(investigacion);
    await this.investigacionRepository.update(id as string, investigacion);
    return this.getOne(id);
  }

  /**
   *
   * @param id
   * @returns
   */
  public async delete(id: Identificator, auditoria: Auditoria): Promise<InvestigacionDto> {
    await this.investigacionRepository.update(id, {
      isActive: false,
      isEnabled: false,
      ...auditoria,
    });
    return this.investigacionRepository.findOne({ where: { id: id as string } });
  }
}

/*export interface BasesCRUDcreateOverload<C, R, U> extends BasesCRUD<C, R, U> {
  create(data: C): Promise<R>;
  create(data: C, entity: Notificacion): Promise<R>;
  //Al utilizar esta interfaz, se deben implementar los dos métodos create. 
}*/
export interface BasesCRUDcreateOmit<C, R, U> extends Omit<BasesCRUD<C, R, U>, 'create'> {
  create(data: C, entity: Notificacion): Promise<R>;
}
export interface IServiceCreateOmit<C, R, U> extends Omit<BasesCRUDcreateOmit<C, R, U>, 'getMany'> {
  exist(id: number | string): Promise<boolean>;
}
export interface IControllerCreateOmit<C, R, U> extends Omit<BasesCRUDcreateOmit<C, R, U>, 'getMany'> {
  getMany(params: IGetManyParams): Promise<R[]>;
  delete(id: Identificator, auditData: any): Promise<R>;
}

