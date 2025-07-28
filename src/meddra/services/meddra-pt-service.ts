import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SOC } from '../models/standar/soc.entity';
import { PT } from '../models/standar/pt.entity';


@Injectable()
export class MeddraPtService {
  constructor(
    @InjectRepository(PT, 'meddra')
    private readonly ptRepository: Repository<PT>,
  ) {}

  normalizeString(str: string): string {
    return str.normalize('NFD')  // Eliminar acentos (forma normalizada compuesta)
      .replace(/[\u0300-\u036f]/g, '')  // Eliminar los caracteres diacríticos (acentos)
      .toLowerCase()  // Convertir a minúsculas
      .trim();  // Eliminar espacios extra al principio y al final
  }

  // Método para buscar SOC por nombre
  async searchPT(term: string): Promise<PT[]> {
    // Normalizamos el término de búsqueda
    const normalizedTerm = this.normalizeString(term);  
  
    return this.ptRepository  // Usamos el repositorio de PT
      .createQueryBuilder('pt')  // Alias de la tabla PT
      .where('LOWER(pt.name) = :term', { term: normalizedTerm })  // Comparar con el nombre normalizado
      .getMany();  // Obtener los resultados que coinciden
  }
}
