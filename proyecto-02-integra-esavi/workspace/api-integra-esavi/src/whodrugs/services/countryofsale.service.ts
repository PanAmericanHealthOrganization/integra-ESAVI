import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {withAuditOnCreate} from 'src/common/utils/audit.util';
import {Repository} from 'typeorm';
import {CountryOfSale} from '../models/countryOfSale.entity';
import {Drug} from '../models/drug.entity';
import {ICountryOfSale} from '../models/dtos';
import {MaholderService} from './maholder.service';

@Injectable()
export class CountryOfSaleService {
  constructor(
    private readonly maholderService: MaholderService,
    @InjectRepository(CountryOfSale, 'WHO_DRUG')
    private readonly countrySale: Repository<CountryOfSale>,
  ) {}

  public async syncCountrySale(countriesOfSale: ICountryOfSale[], drugSaved: Drug) {
    if (countriesOfSale.length > 0) {
      for (const countryOfSale of countriesOfSale) {
        let countrySaleEntity = new CountryOfSale();
        countrySaleEntity.iso3Code = countryOfSale.iso3Code;
        countrySaleEntity.medicinalProductID = countryOfSale.medicinalProductID;
        countrySaleEntity.drug = drugSaved;
        countrySaleEntity = await this.countrySale.save(withAuditOnCreate(countrySaleEntity));

        await this.maholderService.syncMaholder(countryOfSale.maHolders || [], countrySaleEntity);
      }
    }
  }
}
