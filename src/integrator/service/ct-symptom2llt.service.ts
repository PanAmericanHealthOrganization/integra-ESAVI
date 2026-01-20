import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {  Repository } from 'typeorm';
import { CtSymptom2llt } from '../entity/ct-symptom2llt.entity';

@Injectable()
export class CtSymptom2lltService {
    constructor(
        @InjectRepository(CtSymptom2llt, 'POSTGRES_INTEGRATOR_DS')
        private readonly ctSymptom2lltRepository: Repository<CtSymptom2llt>,
    ) {}
    
    private readonly logger = new Logger(CtSymptom2lltService.name);
    /**
     * TODO: CRUD operaciones para CtSymptom2llt
     */
    //----------------------
    /**
     * @param symptom
     * @returns Mapea un síntoma dado a su correspondiente término LLT de MedDRA.
     */
    async mapSymptomToLlt(symptom: string): Promise<CtSymptom2llt> {
        if (!symptom || symptom.trim() === '') {
            this.logger.warn('Síntoma vacío o nulo para mapeo a LLT');
            return null;
        }

        symptom = symptom.trim();
        const mapping = await this.ctSymptom2lltRepository
            .createQueryBuilder('symptomMapping')
            .where('LOWER(symptomMapping.symptom) = :symptom', { symptom: (symptom || '').toLowerCase() }) // Comparar con el síntoma normalizado
            .getOne();

        if (!mapping) {
            this.logger.warn(`No se encontró mapeo LLT para el síntoma: "${symptom}"`);
        }
        return mapping;
    }
}
