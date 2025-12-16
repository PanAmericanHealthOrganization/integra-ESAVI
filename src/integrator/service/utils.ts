import { AuditoriaDto } from '../entity';

export const getMonth = (month: number) => {
  // retornar el mes concatenado 0 si es menor a 10
  return month < 10 ? `0${month}` : `${month}`;
};

/**
 *
 * @param year
 * @param month
 * @returns
 */
export const getLastDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

export const getCreateAuditDto = (): AuditoriaDto => {
  return {
    createdAt: new Date(),
    createdBy: 'SYSTEM',
    updatedAt: null,
    updatedBy: null,
    deletedAt: null,
    deletedBy: null,
    isEnabled: true,
    isActive: true,
  };
};
