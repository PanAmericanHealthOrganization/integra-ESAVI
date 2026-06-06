import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { DatosWhodrug } from '../../domain/entities/DatosWhodrug';

export class WhoDrugRepository {
  private repository: Repository<DatosWhodrug>;

  constructor() {
    this.repository = AppDataSource.getRepository(DatosWhodrug);
  }

  async obtenerAbreviatura(code: string): Promise<any[]> {
    return this.repository
      .createQueryBuilder('d')
      .select('DISTINCT d.abbreviation', 'abbreviation')
      .where('d.drugCode = :code', { code })
      .getRawMany();
  }

  async obtenerAbreviaturaCovid(code: string): Promise<any[]> {
    // Basado en el análisis de NamedQueries, la lógica es similar a obtenerAbreviatura
    return this.repository
      .createQueryBuilder('d')
      .select('DISTINCT d.abbreviation', 'abbreviation')
      .where('d.drugCode = :code', { code })
      .getRawMany();
  }

  async obtenerDrugsByAbreviature(code: string): Promise<any[]> {
    return this.repository
      .createQueryBuilder('d')
      .select('DISTINCT d.drugCode', 'drugCode')
      .where('d.abbreviation = :code', { code })
      .getRawMany();
  }

  async obtenerMaholderByDrugCode(code: string): Promise<any[]> {
    return this.repository
      .createQueryBuilder('d')
      .select('DISTINCT d.maHoldersmedicinalProductID', 'maHolderId')
      .where('d.drugCode = :code', { code })
      .getRawMany();
  }

  async obtenerFormByMaholderCode(code: string): Promise<any[]> {
    return this.repository
      .createQueryBuilder('d')
      .select('DISTINCT d.form', 'form')
      .where('d.maHoldersmedicinalProductID = :code', { code })
      .getRawMany();
  }

  async obtenerStrengthByFormCode(code: string): Promise<any[]> {
    return this.repository
      .createQueryBuilder('d')
      .select('DISTINCT d.strength', 'strength')
      .where('d.form = :code', { code })
      .getRawMany();
  }

  async agregaActualizaWhodrug(datos: DatosWhodrug): Promise<DatosWhodrug> {
    return this.repository.save(datos);
  }

  async deleteWhodrugData(): Promise<void> {
    await this.repository.clear();
  }
}
