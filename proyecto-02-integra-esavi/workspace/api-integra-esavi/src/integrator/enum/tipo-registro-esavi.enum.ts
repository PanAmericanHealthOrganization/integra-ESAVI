/**
 * Clasifica el origen del evento dentro de la ficha, es decir de qué bloque del formulario
 * proviene cada fila de TR_DATOS_ESAVI. Reemplaza al antiguo campo DESCRIPCION, que pese a
 * su nombre nunca almacenó la narrativa del caso (esa vive, una sola vez por caso, en
 * TR_NOTIFICACION.CASO_NARRATIVO) sino etiquetas de tipo del estilo "Diagnóstico inicial DHIS2 1".
 */
export enum TipoRegistroEsaviEnum {
  DIAGNOSTICO_INICIAL = 'DIAGNOSTICO_INICIAL',
  DIAGNOSTICO_FINAL = 'DIAGNOSTICO_FINAL',
  SINTOMATOLOGIA = 'SINTOMATOLOGIA',
  REACCION = 'REACCION',
}
