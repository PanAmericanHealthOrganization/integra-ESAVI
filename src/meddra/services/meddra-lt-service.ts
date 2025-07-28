import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SOC } from '../models/standar/soc.entity';
import { PT } from '../models/standar/pt.entity';
import { LLT } from '../models/standar/llt.entity';


@Injectable()
export class MeddraLLTService {
  constructor(
    @InjectRepository(LLT, 'meddra')
    private readonly lltRepository: Repository<LLT>,
  ) {}

  normalizeString(str: string): string {
    return str.normalize('NFD')  // Eliminar acentos (forma normalizada compuesta)
      .replace(/[\u0300-\u036f]/g, '')  // Eliminar los caracteres diacríticos (acentos)
      .toLowerCase()  // Convertir a minúsculas
      .trim();  // Eliminar espacios extra al principio y al final
  }

  // Método para buscar SOC por nombre
  async searchLLT(term: string): Promise<LLT[]> {
    // Normalizamos el término de búsqueda
    const normalizedTerm = this.normalizeString(term);  
  
    return this.lltRepository  
      .createQueryBuilder('llt')  
      .where('LOWER(llt.name) = :term', { term: normalizedTerm })  // Comparar con el nombre normalizado
      .getMany();  
  }
}
