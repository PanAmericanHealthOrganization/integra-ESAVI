import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {IPaginationRequest,IPaginationResponse} from 'src/utils/interfaces/pagination';
import {Repository} from 'typeorm';
import {Drug} from '../models/drug.entity';

@Injectable()
export class DrugService {
  constructor(
    @InjectRepository(Drug, 'WHO_DRUG')
    private readonly drugRepository: Repository<Drug>,
  ) {}

  public async getDrugsPaginated(
    request: IPaginationRequest<Drug>,
    drugName: string,
    drugCode: number,
    _country: string,
    _atcCode: string,
  ): Promise<IPaginationResponse<any>> {
    const drugPartial = await this.drugRepository.find({
      select: {
        id: true,
        drugName: true,
        drugCode: true,
        countriesOfSale: {
          iso3Code: true,
        },
        anatomicalTherapeuticChemical: { code: true },
      },
      relations: {
        countriesOfSale: false,
        anatomicalTherapeuticChemical: false,
      },
      where: [
        {
          isEnabled: true,
          isActive: true,
        },
      ],
    });

    const coincidencias = drugPartial
      .map((drug) => {
        drug.drugName = `${drug.drugName}`.toUpperCase();
        return drug;
      })
      .filter(
        (drug) =>
          (!drugName && !drugCode) ||
          (drugName && `${drug.drugName}`.toUpperCase().includes(`${drugName}`.toUpperCase())) ||
          (drugCode && `${drug.drugCode}`.toUpperCase().includes(`${drugCode}`.toUpperCase())),
      );

    // Los argumentos de slice son (inicio, fin), no (inicio, cantidad): antes se pasaba `size`
    // como fin, así que a partir de la página 1 el inicio ya superaba al fin y la respuesta
    // salía vacía (page=1,size=10 -> slice(10, 10)).
    const inicio = request.page * request.size;
    const pagina = coincidencias.slice(inicio, inicio + request.size);

    return {
      data: pagina,
      // El total es el universo filtrado, no el tamaño de la página; de lo contrario el cliente
      // no puede calcular cuántas páginas existen.
      total: coincidencias.length,
    };
  }

  /**
   * Devuelve el código ATC oficial de un medicamento. Un medicamento puede tener varios ATC;
   * se prefiere el marcado como oficial (OFFICIALFLAG) y, si no hay ninguno, el primero.
   *
   * Lo usa el integrador DHIS2 para poblar CODIGO_ATC, que antes solo llegaba desde VigiFlow
   * porque su Excel ya trae la columna "Código(s) ATC". DHIS2 no la entrega, así que el código
   * se deriva del medicamento homologado contra WHODrug.
   */
  public async getAtcCodeOfDrug(drugId: string): Promise<string | null> {
    if (!drugId) return null;

    const drug = await this.drugRepository.findOne({
      where: { id: drugId },
      relations: { anatomicalTherapeuticChemical: true },
    });

    const atcs = drug?.anatomicalTherapeuticChemical ?? [];
    if (atcs.length === 0) return null;

    const oficial = atcs.find((atc) => `${atc.officialFlag}`.toUpperCase() === 'Y');
    return (oficial ?? atcs[0]).code ?? null;
  }

  public async getDrugsOnly(drugName: string, _country: string, _atcCode?: string): Promise<any[]> {
    const drugPartial = await this.drugRepository.find({
      select: {
        id: true,
        drugName: true,
        drugCode: true,
        countriesOfSale: {
          iso3Code: true,
        },
        anatomicalTherapeuticChemical: { code: true },
      },
      relations: {
        countriesOfSale: false,
        anatomicalTherapeuticChemical: false,
      },
      where: [
        {
          isActive: true,
          isEnabled: true,
        },
      ],
    });

    const final = drugPartial
      .map((drug) => {
        drug.drugName = `${drug.drugName}`.toUpperCase(); // Convertimos el nombre del medicamento a mayúsculas
        return drug;
      })
      .filter(
        (drug) =>
          !drugName ||
          (drugName && `${drug.drugName}`.toUpperCase() === `${drugName}`.toUpperCase()), // Comparación exacta
      );

    return final;
  }

  private async getDrugs(skip: number, take: number): Promise<Drug[]> {
    const drugPartial = await this.drugRepository.find({
      select: {
        id: true,
        drugName: true,
        drugCode: true,
      },
      where: [{ isActive: true }],
      skip,
      take,
    });

    return drugPartial.slice(skip, take);
  }
  public async getDrug(id: string): Promise<Drug> {
    return await this.drugRepository.findOneBy({ id });
  }
}
