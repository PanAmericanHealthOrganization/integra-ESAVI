export class CreateAntecedenteEventoDto {
  antecedente: number;
  //alergiaVacuna: boolean;  //variable no encontrada en los orígenes. En realidad una vacuna es un medicamento.
  alergiaMedicamento: string;
  alergiaAlimentos : string;
  alergiaInsectos : string;
  alergiaPolvo : string;
  otrasAlergias : string;
}
