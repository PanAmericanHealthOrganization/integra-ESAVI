import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { WhodrugVacsTemp } from '../entity/whodrug-vacstemp.entity';

@Injectable()
export class WhodrugVacsTempService {
    constructor(
        @InjectRepository(WhodrugVacsTemp, 'POSTGRES_INTEGRATOR_DS')
        private whodrugVacsTempRepository: Repository<WhodrugVacsTemp>,
    ) { }

    private readonly logger = new Logger(WhodrugVacsTempService.name);
    /**
     * TODO: CRUD operaciones para WhodrugVacsTemp
     */
    //----------------------
    /**
     * @param drugName
     * @returns Busca una vacuna en la tabla temporal de Whodrug por su nombre.
     */
    async getVaccinesByName(drugName: string): Promise<WhodrugVacsTemp[]> { //async findVaccineByName(drugName: string): Promise<WhodrugVacsTemp> {
        /*if (!drugName || drugName.trim() === '') {
            this.logger.warn('Nombre de medicamento vacío o nulo');
            return null;
        }

        drugName = drugName.trim();
        const vaccine = await this.whodrugVacsTempRepository
            .createQueryBuilder('vaccine')
            .where('LOWER(vaccine.vaccineName) = :drugName', { drugName: (drugName || '').toLowerCase() })
            .getOne();

        if (!vaccine) {
            this.logger.warn(`No se encontró vacuna para el nombre: "${drugName}"`);
        }
        return vaccine;*/
        //---------------
        const vaccinePartial = await this.whodrugVacsTempRepository.find({
            select: {
                item: true, //revisar si el id, y o el item son los campos que probablemente no permiten mostrar todas las coincidencias.
                drugName: true,
                drugCode: true,
                activeIngredient: true,
                actiIngredientTranslation: true,
                medicinalProductId: true,
                countryIso3Code: true,
            }
        });

        // Filtrar por nombre de medicamento si se proporciona
        const final = vaccinePartial
        .map( (vaccine) => {
            vaccine.drugName = `${vaccine.drugName}`.toUpperCase(); // Convertimos el nombre del medicamento a mayúsculas
            return vaccine;
            })
        .filter(
            ( vaccine) =>
                !drugName ||
                (drugName && `${vaccine.drugName}`.toUpperCase() === `${drugName}`.toUpperCase()), // Comparación exacta
        );
        //TODO: Se puede mejorar el filtro, si se convierte el valor del origen y el de la base de datos a vector, a cada
        // vector se le puede aplicar la función de ordenamiento de elementos, para luego relizar la comparación
        // entre arrays. //--------el algoritmo de similitud coseno, y si el valor es mayor a un umbral (ej. 0.8), se considera una coincidencia.
        return final;
    }

    async getVaccinesByNameAndIso3CodeNull(drugName: string): Promise<WhodrugVacsTemp[]> { //async findVaccineByName(drugName: string): Promise<WhodrugVacsTemp> {
        
        const vaccinePartial = await this.whodrugVacsTempRepository.find({
            select: {
                item: true, //revisar si el id, y o el item son los campos que probablemente no permiten mostrar todas las coincidencias.
                drugName: true,
                drugCode: true,
                activeIngredient: true,
                actiIngredientTranslation: true,
                medicinalProductId: true,
                countryIso3Code: true,
            },
            where: {
                countryIso3Code: IsNull(), // Filtrar por countryIso3Code nulo
            },
        });

        // Filtrar por nombre de medicamento si se proporciona
        const final = vaccinePartial
        .map( (vaccine) => {
            vaccine.drugName = `${vaccine.drugName}`.toUpperCase(); // Convertimos el nombre del medicamento a mayúsculas
            return vaccine;
            })
        .filter(
            ( vaccine ) =>
                !drugName ||
                (drugName && `${vaccine.drugName}`.toUpperCase() === `${drugName}`.toUpperCase()), // Comparación exacta
        );
        //TODO: Se puede mejorar el filtro, si se convierte el valor del origen y el de la base de datos a vector, a cada
        // vector se le puede aplicar la función de ordenamiento de elementos, para luego relizar la comparación
        // entre arrays. //--------el algoritmo de similitud coseno, y si el valor es mayor a un umbral (ej. 0.8), se considera una coincidencia.
        return final;
    }

    //--------------------------------------------------------------------------------------------//
    async getVaccinesByActiveIngredient(activeIngredient: string): Promise<WhodrugVacsTemp[]> {
        const vaccinePartial = await this.whodrugVacsTempRepository.find({
            select: {
                item: true,
                drugName: true,
                drugCode: true,
                activeIngredient: true,
                actiIngredientTranslation: true,
                medicinalProductId: true,
                countryIso3Code: true,
            },
            /*where: [
                { activeIngredient: activeIngredient }
            ],*/
        });

        //filtrar por principio activo si se proporciona
        const final = vaccinePartial
        .map( (vaccine) => {
            vaccine.activeIngredient = `${vaccine.activeIngredient}`.toUpperCase(); // Convertimos el nombre del medicamento a mayúsculas
            return vaccine;
            })
        .filter(
            ( vaccine ) =>
                !activeIngredient ||
                (activeIngredient && `${vaccine.activeIngredient}`.toUpperCase() === `${activeIngredient}`.toUpperCase()), // Comparación exacta
        );

        return vaccinePartial;
    }

    async getVaccsByActiveIngredientAndIso3CodeNull(activeIngredient: string): Promise<WhodrugVacsTemp[]> {
        const vaccinePartial = await this.whodrugVacsTempRepository.find({
            select: {
                item: true,
                drugName: true,
                drugCode: true,
                activeIngredient: true,
                actiIngredientTranslation: true,
                medicinalProductId: true,
                countryIso3Code: true,
            },
            where: {
                actiIngredientTranslation: activeIngredient,
                countryIso3Code: IsNull(), // Filtrar por countryIso3Code nulo
            },
        });

        //filtrar por principio activo si se proporciona
        const final = vaccinePartial
        .map( (vaccine) => {
            vaccine.activeIngredient = `${vaccine.activeIngredient}`.toUpperCase(); // Convertimos el nombre del medicamento a mayúsculas
            return vaccine;
            })
        .filter(
            ( vaccine ) =>
                !activeIngredient ||
                (activeIngredient && `${vaccine.activeIngredient}`.toUpperCase() === `${activeIngredient}`.toUpperCase()), // Comparación exacta
        );

        return vaccinePartial;
    }

    //--------------------------------------------------------------------------------------------//
    async getVaccinesByActIngTranslation(actIngTranslation: string): Promise<WhodrugVacsTemp[]> {
        const vaccinePartial = await this.whodrugVacsTempRepository.find({
            select: {
                item: true,
                drugName: true,
                drugCode: true,
                activeIngredient: true,
                actiIngredientTranslation: true,
                medicinalProductId: true,
                countryIso3Code: true,
            },
            /*where: [
                { actiIngredientTranslation: actIngTranslation }
            ],*/
        });

        //filtrar por principio activo si se proporciona
        const final = vaccinePartial
        .map( (vaccine) => {
            vaccine.actiIngredientTranslation = `${vaccine.actiIngredientTranslation}`.toUpperCase(); // Convertimos el nombre del medicamento a mayúsculas
            return vaccine;
            })
        .filter(
            ( vaccine ) =>
                !actIngTranslation ||
                (actIngTranslation && `${vaccine.actiIngredientTranslation}`.toUpperCase() === `${actIngTranslation}`.toUpperCase()), // Comparación exacta
        );

        return vaccinePartial;
    }

    async getVaccsByActIngTranslationAndIso3CodeNull(actIngTranslation: string): Promise<WhodrugVacsTemp[]> {
        const vaccinePartial = await this.whodrugVacsTempRepository.find({
            select: {
                item: true,
                drugName: true,
                drugCode: true,
                activeIngredient: true,
                actiIngredientTranslation: true,
                medicinalProductId: true,
                countryIso3Code: true,
            },
            where: {
                actiIngredientTranslation: actIngTranslation,
                countryIso3Code: IsNull(), // Filtrar por countryIso3Code nulo
            },
        });

        //filtrar por principio activo si se proporciona
        const final = vaccinePartial
        .map( (vaccine) => {
            vaccine.actiIngredientTranslation = `${vaccine.actiIngredientTranslation}`.toUpperCase(); // Convertimos el nombre del medicamento a mayúsculas
            return vaccine;
            })
        .filter(
            ( vaccine ) =>
                !actIngTranslation ||
                (actIngTranslation && `${vaccine.actiIngredientTranslation}`.toUpperCase() === `${actIngTranslation}`.toUpperCase()), // Comparación exacta
        );

        return vaccinePartial;
    }

}
