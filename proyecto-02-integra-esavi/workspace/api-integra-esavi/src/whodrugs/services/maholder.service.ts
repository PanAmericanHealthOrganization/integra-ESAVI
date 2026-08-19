import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {withAuditOnCreate} from 'src/common/utils/audit.util';
import {Repository} from 'typeorm';
import {CountryOfSale} from '../models/countryOfSale.entity';
import {ICodificacionVacunaWhodrugConDrugId,IMaHolder} from '../models/dtos';
import {Maholder} from '../models/maholder.entity';

@Injectable()
export class MaholderService {
  constructor(
    @InjectRepository(Maholder, 'WHO_DRUG')
    private readonly maholder: Repository<Maholder>,
  ) {}

  public async syncMaholder(maholders: IMaHolder[], countrySale: CountryOfSale) {
    if (maholders.length > 0) {
      for (const maholder of maholders) {
        const maholderEntity = new Maholder();
        maholderEntity.name = maholder.name;
        maholderEntity.countrySale = countrySale;
        await this.maholder.save(withAuditOnCreate(maholderEntity));
      }
    }
  }

  public async getMaholderOfDrug(drugId: string, coutri: string)
  :Promise<Maholder[]>
  {
    // Se incluye countrySale.medicinalProductID (COS_MEDICINAL_PRODUCT_ID) para que los
    // consumidores puedan obtener también el MPID del país de venta, no solo el del titular.
    const r = await this.maholder.find({
      select: { id: true, name: true, medicinalProductID: true, countrySale: { id: true, medicinalProductID: true } },
      where: { countrySale: { drug: { id: drugId }, iso3Code: coutri } },
      relations: { countrySale: true },
    });
    return r;
  }

  /**
   * Codificación WHODrug completa a partir de un MAHOLDER.MEDICINAL_PRODUCT_ID.
   *
   * Es la entrada al diccionario que usa la homologación de DHIS2: allí el punto de partida
   * no es el principio activo —DHIS2 no lo entrega— sino el identificador del titular, que
   * sale de la tabla estática NOMBRE_VACUNA_DHIS2 → MPID.
   *
   * El recorrido es MAHOLDER → COUNTRY_SALES → DRUG, el mismo grafo que usa la codificación
   * de VigiFlow pero entrando por el otro extremo. No se filtra por país: el MPID del titular
   * ya identifica una fila concreta del diccionario, y añadir el filtro sólo podría descartar
   * una coincidencia válida cuyo COS_COUNTRY no fuese el esperado.
   *
   * Se devuelve como mucho una fila, con orden explícito para que un MPID repetido —que hoy
   * no ocurre— resuelva siempre igual y no según el plan que elija PostgreSQL.
   */
  public async buscarCodificacionPorMedicinalProductId(
    medicinalProductId: number,
  ): Promise<ICodificacionVacunaWhodrugConDrugId | null> {
    if (medicinalProductId === null || medicinalProductId === undefined) return null;

    const fila = await this.maholder
      .createQueryBuilder('m')
      .innerJoin('m.countrySale', 'cs')
      .innerJoin('cs.drug', 'd')
      .select('d.id', 'drugId')
      .addSelect('d.drugCode', 'drugCode')
      .addSelect('d.drugName', 'drugName')
      .addSelect('cs.medicinalProductID', 'medicinalProductId')
      .addSelect('m.name', 'maHolder')
      .addSelect('m.medicinalProductID', 'maHolderMedicinalProductId')
      .where('m.medicinalProductID = :medicinalProductId', { medicinalProductId })
      .orderBy('d.drugCode', 'ASC')
      .limit(1)
      .getRawOne<{
        drugId: string;
        drugCode: string;
        drugName: string;
        medicinalProductId: number | null;
        maHolder: string;
        maHolderMedicinalProductId: number | null;
      }>();

    if (!fila) return null;

    // Los dos MPID son numéricos en WHODrug y texto en TR_DATO_VACUNA. Se comprueba contra
    // `null` y no por veracidad para que un identificador 0 no se convierta en nulo.
    return {
      drugId: fila.drugId,
      drugCode: fila.drugCode ?? null,
      drugName: fila.drugName ?? null,
      medicinalProductId: fila.medicinalProductId != null ? String(fila.medicinalProductId) : null,
      maHolder: fila.maHolder ?? null,
      maHolderMedicinalProductId:
        fila.maHolderMedicinalProductId != null ? String(fila.maHolderMedicinalProductId) : null,
    };
  }
}
