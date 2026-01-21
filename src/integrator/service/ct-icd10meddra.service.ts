import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CtIcd10meddra } from '../entity/ct-icd10meddra.entity';

@Injectable()
export class CtIcd10meddraService {
    constructor(
        @InjectRepository(CtIcd10meddra, 'POSTGRES_INTEGRATOR_DS')
        private readonly ctIcd10meddraRepository: Repository<CtIcd10meddra>,
    ) {}

    private readonly logger = new Logger(CtIcd10meddraService.name);
    /**
     * TODO: CRUD operaciones para CtIcd10meddra
     */
    //----------------------
    /**
     * @param lltCode
     * @returns Mapea un código LLT dado a su correspondiente código ICD-10 (En idioma espñol CIE-10). En realidad devuelve todo el objeto de mapeo.
     */
    async mapLltToIcd10ByCode(lltCode: string): Promise<CtIcd10meddra> {
        if (!lltCode || lltCode.trim() === '') {
            this.logger.warn('Código LLT vacío o nulo para mapeo a ICD-10');
            return null;
        }

        lltCode = lltCode.trim();
        const mapping = await this.ctIcd10meddraRepository
            .createQueryBuilder('lltIcd10Mapping')
            .where('LOWER(lltIcd10Mapping.meddraLltCode) = :lltCode', { lltCode: (lltCode || '').toLowerCase() }) // Comparar con el código LLT normalizado
            .getOne();

        if (!mapping) {
            this.logger.warn(`No se encontró mapeo ICD-10 para el código LLT: "${lltCode}"`);
        }
        return mapping;
    }

    /**
     * @param icd10Code
     * @returns Mapea un código ICD-10 dado a su correspondiente código LLT (En idioma español CIE-10). En realidad devuelve todo el objeto de mapeo.
     */
    async mapIcd10ToLltByCode(icd10Code: string): Promise<CtIcd10meddra> {
        if (!icd10Code || icd10Code.trim() === '') {
            this.logger.warn('Código LLT vacío o nulo para mapeo a ICD-10');
            return null;
        }

        icd10Code = icd10Code.trim();
        const mapping = await this.ctIcd10meddraRepository
            .createQueryBuilder('icd10ToLlltMapping')
            .where("REPLACE( LOWER(icd10ToLlltMapping.icd10Code), '.', '' ) = REPLACE( LOWER(:icd10Code), '.', '' )", { icd10Code: (icd10Code || '').toLowerCase() }) // Comparar con el código ICD10 normalizado
            .getOne();

        if (!mapping) {
            this.logger.warn(`No se encontró mapeo LLT para el código ICD-10: "${icd10Code}"`);
        }
        return mapping;
    }
}
