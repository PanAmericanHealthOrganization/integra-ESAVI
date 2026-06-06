import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { MapeoMedraCie10 } from '../../domain/entities/MapeoMedraCie10';

export class MedraRepository {
  private repository: Repository<MapeoMedraCie10>;

  constructor() {
    this.repository = AppDataSource.getRepository(MapeoMedraCie10);
  }

  async obtenerMapeoPorCodigoMedra(codigoMedra: string): Promise<MapeoMedraCie10[]> {
    return this.repository.find({
      where: { codigoLltMeddra: codigoMedra }
    });
  }

  async obtenerMapeoPorCodigoCie10(codigoCie10: string): Promise<MapeoMedraCie10[]> {
    return this.repository.find({
      where: { codigoCie10: codigoCie10 }
    });
  }

  async agregaActualizaMedraToCie10(mapeo: MapeoMedraCie10): Promise<MapeoMedraCie10> {
    return this.repository.save(mapeo);
  }

  async obtenerAbreviatura(): Promise<any[]> {
    // Implementación basada en la interfaz MedraToCie10Dao
    return this.repository
      .createQueryBuilder('m')
      .select('DISTINCT m.terminoCie10')
      .getRawMany();
  }
}
