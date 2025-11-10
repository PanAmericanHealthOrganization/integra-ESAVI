export const getMonth = (month: number) => {
  // retornar el mes concatenado 0 si es menor a 10
  return month < 10 ? `0${month}` : `${month}`;
};
