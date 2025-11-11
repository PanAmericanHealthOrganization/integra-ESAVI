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
