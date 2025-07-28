import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SOC } from '../models/standar/soc.entity';


@Injectable()
export class MeddraSocService {
  constructor(
    @InjectRepository(SOC, 'meddra')
    private readonly socRepository: Repository<SOC>,
  ) {}

  normalizeString(str: string): string {
    return str.normalize('NFD')  // Eliminar acentos
      .replace(/[\u0300-\u036f]/g, '')  // Eliminar los caracteres diacríticos (acentos)
      .toLowerCase()  // Convertir a minúsculas
      .trim();  // Eliminar espacios extra al principio y al final
  }

  // Método para buscar SOC por nombre
  async searchSOC(term: string): Promise<SOC[]> {
    const normalizedTerm = this.normalizeString(term);

    return this.socRepository
      .createQueryBuilder('soc')
      .where('LOWER(soc.name) = :term', { term: normalizedTerm })  
      .orWhere('LOWER(soc.abbrev) = :term', { term: normalizedTerm }) 
      .getMany();  
  }
}
