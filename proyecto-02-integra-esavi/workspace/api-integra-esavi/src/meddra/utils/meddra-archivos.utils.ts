/**
 * Catálogo de los archivos `.asc` que compone una distribución de MedDRA y las reglas
 * para aceptar una carga.
 *
 * El navegador descomprime el ZIP que entrega MSSO —la contraseña nunca sale del
 * cliente— y manda al API sólo los archivos que el pipeline lee de verdad. Nada se
 * escribe en disco: los buffers se parsean en memoria y se descartan al terminar la
 * corrida, de modo que `upload_files/meddra/<versión>/<idioma>/` ya no interviene.
 *
 * La validación no puede vivir sólo en el cliente porque el endpoint es alcanzable con
 * curl; este módulo es la copia autoritativa. El front
 * (`components/meddra/meddraZip.ts`) replica la lista para poder deshabilitar el botón
 * antes de transferir nada.
 */
export abstract class MeddraArchivosUtils {
  /**
   * Los únicos archivos que se transfieren al API.
   *
   * `soc.asc`, `pt.asc` y `llt.asc` son los que MeddraProcessFilesService parsea;
   * `meddra_release.asc` pesa 17 bytes y trae el sello de versión e idioma, con el que
   * el servidor comprueba que el ZIP es el que el usuario dice que es. El resto de la
   * distribución se valida en el navegador y no se sube: subir 21 MB para descartarlos
   * no aporta nada cuando ya no se persiste nada.
   */
  public static readonly ARCHIVOS_A_PROCESAR: readonly string[] = [
    'soc.asc',
    'pt.asc',
    'llt.asc',
    'meddra_release.asc',
  ];

  /**
   * Estructura mínima que debe tener el ZIP para considerarlo una distribución válida.
   * Se comprueba contra el manifiesto que envía el cliente (la lista de `.asc` que
   * encontró al descomprimir). Un ZIP al que le falte cualquiera de estos no es una
   * distribución de MedDRA y se rechaza antes de tocar la base.
   */
  public static readonly ARCHIVOS_REQUERIDOS: readonly string[] = [
    'soc.asc',
    'soc_hlgt.asc',
    'hlgt.asc',
    'hlgt_hlt.asc',
    'hlt.asc',
    'hlt_pt.asc',
    'pt.asc',
    'llt.asc',
    'mdhier.asc',
    'intl_ord.asc',
    'meddra_release.asc',
  ];

  /**
   * Archivos que pueden faltar sin invalidar la distribución: los SMQ dependen de la
   * licencia contratada y el histórico lleva el idioma en el nombre
   * (`meddra_history_spanish.asc`, `meddra_history_english.asc`, …).
   */
  public static readonly ARCHIVOS_OPCIONALES: readonly string[] = [
    'smq_content.asc',
    'smq_list.asc',
  ];

  /** Familias opcionales cuyo nombre varía; se aceptan por patrón. */
  public static readonly PATRONES_OPCIONALES: readonly RegExp[] = [/^meddra_history_[a-z]+\.asc$/];

  /** Versión tal como la escribe el usuario: `28`, `28_0`, `21_1`… */
  public static readonly PATRON_VERSION = /^\d{1,2}(_\d)?$/;

  /** Idiomas soportados. */
  public static readonly IDIOMAS = ['ES', 'EN'] as const;

  /**
   * Idioma tal como lo escribe MedDRA dentro de `meddra_release.asc`, que es una sola
   * línea con la forma `28.0$Spanish$$$$`.
   */
  private static readonly IDIOMA_POR_NOMBRE: Record<string, string> = {
    spanish: 'ES',
    english: 'EN',
  };

  /**
   * Normaliza el nombre con el que llega un archivo: MSSO lo entrega dentro de
   * `ascii-280/` y el cliente podría mandar la ruta completa. Sólo interesa el nombre
   * base en minúsculas; se cortan los separadores de ambos sistemas para que un
   * `..\\..\\algo` no signifique nada aquí.
   */
  public static nombreBase(ruta: string): string {
    const partes = String(ruta ?? '').split(/[\\/]/);
    return (partes[partes.length - 1] ?? '').trim().toLowerCase();
  }

  /** ¿El nombre pertenece al catálogo (requerido u opcional)? */
  public static esArchivoConocido(nombre: string): boolean {
    return (
      this.ARCHIVOS_REQUERIDOS.includes(nombre) ||
      this.ARCHIVOS_OPCIONALES.includes(nombre) ||
      this.PATRONES_OPCIONALES.some((patron) => patron.test(nombre))
    );
  }

  /** Requeridos ausentes en la lista dada. */
  public static faltantes(nombres: string[], requeridos: readonly string[] = this.ARCHIVOS_REQUERIDOS): string[] {
    const presentes = new Set(nombres);
    return requeridos.filter((nombre) => !presentes.has(nombre));
  }

  /** Nombres fuera del catálogo. */
  public static desconocidos(nombres: string[]): string[] {
    return nombres.filter((nombre) => !this.esArchivoConocido(nombre));
  }

  /** Nombres repetidos (dos `llt.asc` en carpetas distintas del mismo ZIP). */
  public static duplicados(nombres: string[]): string[] {
    const vistos = new Set<string>();
    const repetidos = new Set<string>();
    for (const nombre of nombres) {
      if (vistos.has(nombre)) repetidos.add(nombre);
      vistos.add(nombre);
    }
    return [...repetidos];
  }

  /**
   * Interpreta `meddra_release.asc`. Devuelve `null` si el contenido no tiene la forma
   * esperada, para que el llamador decida si eso basta para rechazar la carga.
   *
   * @param contenido texto del archivo, p. ej. `28.0$Spanish$$$$`
   */
  public static leerRelease(contenido: string): { version: string; idioma: string | null } | null {
    const primeraLinea = String(contenido ?? '').split(/\r?\n/)[0]?.trim();
    if (!primeraLinea) return null;

    const [versionCruda, idiomaCrudo] = primeraLinea.split('$');
    if (!versionCruda || !/^\d{1,2}\.\d$/.test(versionCruda.trim())) return null;

    return {
      // `28.0` → `28_0`, la forma con la que se etiqueta la corrida.
      version: versionCruda.trim().replace('.', '_'),
      idioma: this.IDIOMA_POR_NOMBRE[(idiomaCrudo ?? '').trim().toLowerCase()] ?? null,
    };
  }

  /**
   * ¿La versión que eligió el usuario describe a la del release? Se acepta tanto la
   * forma completa (`28_0`) como sólo la mayor (`28`), porque las cargas históricas se
   * registraron con la mayor a secas.
   */
  public static versionCoincide(versionUsuario: string, versionRelease: string): boolean {
    const usuario = versionUsuario.trim();
    return usuario === versionRelease || usuario === versionRelease.split('_')[0];
  }
}
