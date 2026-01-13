export class CreateGravedadEsaviDto {
  tipo: string;
  muerte: boolean;
  riesgoVida: boolean;
  discapacidad: boolean;
  hospitalizacion: boolean;
  anomaliaCongenita: boolean;
  aborto: boolean;
  muerteFetal: boolean;
  //eventoImportante: boolean;
  //comentarioEventoImportante: string;
  parteEventosPreocupacion: string;
  sonEventosNuevos: string;//nuevoEventos: boolean;
  descripcionEventoNuevo: string;
  condicionEgreso: string;
}
