import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {withAuditOnCreate} from 'src/common/utils/audit.util';
import {Repository} from 'typeorm';
import {CountryOfSale} from '../models/countryOfSale.entity';
import {IMaHolder} from '../models/dtos';
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
}
