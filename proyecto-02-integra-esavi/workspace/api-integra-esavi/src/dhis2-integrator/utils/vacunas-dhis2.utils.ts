/**
 * Homologación de las vacunas del esquema nacional contra WHODrug, para el origen DHIS2.
 *
 * DHIS2 no entrega ningún identificador de catálogo: el nombre de la vacuna llega como la
 * etiqueta del option set del programa DNVE ESAVI TRK («01. BCG», «17. INFLUENZA»…), que no
 * se parece a ningún DRU_NAME del diccionario. Buscar ese texto contra WHODrug resuelve
 * prácticamente nada, y lo poco que resuelve lo hace mal: «BCG» empareja con el producto
 * «Bcg» en vez de con «Vacuna bcg», que es el que compra el Ministerio.
 *
 * De ahí esta tabla. Es una correspondencia fija, revisada por el área funcional, entre cada
 * vacuna del esquema y el MAHOLDER.MEDICINAL_PRODUCT_ID del producto concreto que el país
 * aplica. Con ese identificador la consulta al diccionario es exacta: una sola fila, y de
 * ella salen DRUG_CODE, DRU_NAME, COS_MEDICINAL_PRODUCT_ID y el titular.
 *
 * Es deliberadamente estática y aplica SÓLO a DHIS2. VigiFlow codifica por principio activo
 * (columna F) contra el diccionario y no pasa por aquí.
 *
 * Mantenimiento: al cambiar de proveedor de una vacuna cambia el titular y con él el MPID.
 * Esta tabla hay que revisarla en cada renovación del esquema; no se actualiza sola.
 */
export abstract class VacunasDhis2Utils {
  /**
   * NOMBRE_VACUNA_DHIS2 → MAHOLDER.MEDICINAL_PRODUCT_ID.
   *
   * Se conserva el ordinal («01. », «02. »…) tal como aparece en el option set de origen,
   * para poder cotejar la lista contra la fuente funcional de un vistazo. La búsqueda lo
   * ignora, así que da igual si DHIS2 lo entrega o no.
   *
   * «HB PEDIÁTRICA» y «HB ADULTO» comparten MPID (6885246) a propósito: en el diccionario
   * son el mismo producto, «Vacuna de la hepatitis b (radn)» de Serum Institute of India.
   * La presentación pediátrica o de adulto no la distingue WHODrug.
   */
  private static readonly TABLA: ReadonlyArray<readonly [string, number]> = [
    ['01. BCG', 6874880],
    ['02. ROTAVIRUS', 5290879],
    ['03. PENTAVALENTE', 6885173],
    ['04. NEUMOCOCO', 6870680],
    ['05. FIEBRE AMARILLA', 5290885],
    ['06. VARICELA', 5946672],
    ['07. SRP', 6874580],
    ['08. VPH', 6870000],
    ['09. DPT', 6873647],
    ['10. DT ADULTO', 6883010],
    ['11. SR', 5946689],
    ['12. HB PEDIÁTRICA', 6885246],
    ['13. HB ADULTO', 6885246],
    ['14. HB CERO', 6874468],
    ['15. FIPV', 6882989],
    ['16. BOPV', 6874878],
    ['17. INFLUENZA', 6867978],
  ];

  /** La tabla indexada por nombre normalizado, para que la búsqueda no recorra la lista. */
  private static readonly POR_NOMBRE: ReadonlyMap<string, number> = new Map(
    VacunasDhis2Utils.TABLA.map(([nombre, mpid]) => [VacunasDhis2Utils.normalizar(nombre), mpid]),
  );

  /**
   * MAHOLDER.MEDICINAL_PRODUCT_ID de una vacuna reportada por DHIS2, o null si el nombre no
   * está en la tabla.
   *
   * Null no es un error: DHIS2 admite vacunas fuera del esquema nacional y el integrador
   * tiene que poder seguir con ellas.
   */
  static maHolderMedicinalProductId(nombreVacunaDhis2?: string | null): number | null {
    if (!nombreVacunaDhis2) return null;
    return VacunasDhis2Utils.POR_NOMBRE.get(VacunasDhis2Utils.normalizar(nombreVacunaDhis2)) ?? null;
  }

  /**
   * Deja el nombre en una forma comparable: sin ordinal, sin tildes, en mayúsculas y con los
   * espacios colapsados.
   *
   * El ordinal sólo se quita cuando trae separador («01. », «1) », «03 - »). Exigirlo evita
   * mutilar un nombre que empiece por cifras por su propio contenido.
   *
   * Las tildes se descartan porque el mismo término aparece escrito de las dos formas según
   * quién cargue el option set: «PEDIÁTRICA» y «PEDIATRICA» tienen que resolver igual.
   */
  private static normalizar(nombre: string): string {
    return nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/^\s*\d{1,3}\s*[.)\-]\s*/, '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ' ');
  }
}
