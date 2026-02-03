import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { WhodrugHomologaVacs } from '../entity/whodrug-homologavacs.entity';

@Injectable()
export class WhodrugHomologaVacsService {
    constructor(
        @InjectRepository(WhodrugHomologaVacs, 'POSTGRES_INTEGRATOR_DS')
        private whodrugHomologaVacsRepository: Repository<WhodrugHomologaVacs>,
    ) { }

    private readonly logger = new Logger(WhodrugHomologaVacsService.name);
    /**
     * TODO: CRUD operaciones para WhodrugHomologaVacs
     */
    //----------------------
    /**
     * @param drugName //nombreVacPatenteWHODrugVigiFlow
     * @returns Busca una vacuna homologada en la tabla WhodrugHomologaVacs por su nombre.
     */
    async getHomologatedVaccByDrugName(drugName: string): Promise<WhodrugHomologaVacs[]> {
        const vaccinePartial = await this.whodrugHomologaVacsRepository.find({
            select: {
                patenteWhodrugVigiflow: true,
                drugNameWhodrug: true,
                mpIdWhodrug: true,
            },
            where: {
                patenteWhodrugVigiflow: drugName, // y además si drugNameWhodrug es diferente de "Sin coincidencia"
                drugNameWhodrug: Not('Sin coincidencia'), // "o" mpIdWhodrug no es NULL.
            },
        });

        // Filtrar por el nombre homologado o equiparado de la vacuna si se proporciona
        const final = vaccinePartial
            .map((vaccine) => {
                vaccine.patenteWhodrugVigiflow = `${vaccine.patenteWhodrugVigiflow}`.toUpperCase(); // Convertimos el nombre del medicamento a mayúsculas
                return vaccine;
            })
            .filter(
                (vaccine) =>
                    !drugName ||
                    (drugName && `${vaccine.patenteWhodrugVigiflow}`.toUpperCase() === `${drugName}`.toUpperCase()), // Comparación exacta
            );

        return final;
    }
}
    

