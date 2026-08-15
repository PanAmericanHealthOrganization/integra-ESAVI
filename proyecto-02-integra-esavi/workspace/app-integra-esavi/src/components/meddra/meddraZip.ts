import { BlobReader, BlobWriter, ZipReader, configure } from "@zip.js/zip.js"
// Sólo tipos: zip.js no los exporta en tiempo de ejecución.
import type { Entry, FileEntry } from "@zip.js/zip.js"

/**
 * Lectura y validación del ZIP de MedDRA en el navegador.
 *
 * MSSO entrega la distribución en un ZIP cifrado. Se abre **aquí**, no en el servidor:
 * así la contraseña no viaja por la red ni acaba en un log del API. De los 14 `.asc` que
 * trae sólo se suben los cuatro que el API lee (`soc`, `pt`, `llt` y el sello
 * `meddra_release`); la estructura completa se acredita con el manifiesto, que es la
 * lista de nombres hallados.
 *
 * El catálogo replica el de `src/meddra/utils/meddra-archivos.utils.ts` en el API. Está
 * duplicado a propósito —son dos repositorios distintos— y el servidor vuelve a validar
 * todo: esta copia sólo sirve para poder deshabilitar el botón antes de transferir nada.
 */

// zip.js reparte la descompresión en Web Workers por defecto. Se desactivan: el
// empaquetado del worker depende del bundler y una configuración que falle sólo se nota
// en producción, mientras que descomprimir ~28 MB en el hilo principal tarda unos
// segundos y el diálogo ya muestra progreso mientras tanto.
configure({ useWebWorkers: false })

/** Sin estos el ZIP no es una distribución de MedDRA y no se permite la carga. */
export const ARCHIVOS_REQUERIDOS = [
  "soc.asc",
  "soc_hlgt.asc",
  "hlgt.asc",
  "hlgt_hlt.asc",
  "hlt.asc",
  "hlt_pt.asc",
  "pt.asc",
  "llt.asc",
  "mdhier.asc",
  "intl_ord.asc",
  "meddra_release.asc",
] as const

/** Dependen de la licencia (SMQ) o llevan el idioma en el nombre (histórico). */
export const ARCHIVOS_OPCIONALES = ["smq_content.asc", "smq_list.asc"] as const
const PATRONES_OPCIONALES = [/^meddra_history_[a-z]+\.asc$/]

/** Lo único que se transfiere al API. */
export const ARCHIVOS_A_SUBIR = ["soc.asc", "pt.asc", "llt.asc", "meddra_release.asc"] as const

export const IDIOMAS = ["ES", "EN"] as const
export type IdiomaMeddra = (typeof IDIOMAS)[number]

/** `28` o `28_0`; es lo que se usa como etiqueta de la corrida. */
export const PATRON_VERSION = /^\d{1,2}(_\d)?$/

const IDIOMA_POR_NOMBRE: Record<string, IdiomaMeddra> = { spanish: "ES", english: "EN" }

export interface ArchivoAsc {
  /** Nombre canónico, en minúsculas y sin carpeta. */
  nombre: string
  /** Ruta tal como venía dentro del ZIP, para poder mostrarla. */
  rutaEnZip: string
  tamano: number
  /** Sólo se extrae el contenido de los archivos que se van a subir. */
  blob?: Blob
}

export interface ReleaseMeddra {
  version: string
  idioma: IdiomaMeddra | null
  crudo: string
}

export interface AnalisisZip {
  archivos: ArchivoAsc[]
  /** Nombres de todos los `.asc` hallados; es lo que se envía como manifiesto. */
  manifiesto: string[]
  faltantes: string[]
  desconocidos: string[]
  duplicados: string[]
  opcionalesAusentes: string[]
  release: ReleaseMeddra | null
  /** Impiden la carga. */
  errores: string[]
  /** No impiden la carga, pero conviene que el usuario los vea. */
  avisos: string[]
  /** `true` si el ZIP puede subirse. */
  valido: boolean
}

/** Error con un mensaje ya redactado para el usuario. */
export class ErrorZip extends Error {}

/** Nombre base, en minúsculas y sin carpeta. */
export const nombreBase = (ruta: string): string => {
  const partes = String(ruta ?? "").split(/[\\/]/)
  return (partes[partes.length - 1] ?? "").trim().toLowerCase()
}

const esArchivoConocido = (nombre: string): boolean =>
  (ARCHIVOS_REQUERIDOS as readonly string[]).includes(nombre) ||
  (ARCHIVOS_OPCIONALES as readonly string[]).includes(nombre) ||
  PATRONES_OPCIONALES.some((p) => p.test(nombre))

/** Interpreta el sello `28.0$Spanish$$$$`. */
export const leerRelease = (contenido: string): ReleaseMeddra | null => {
  const primeraLinea = String(contenido ?? "").split(/\r?\n/)[0]?.trim()
  if (!primeraLinea) return null

  const [versionCruda, idiomaCrudo] = primeraLinea.split("$")
  if (!versionCruda || !/^\d{1,2}\.\d$/.test(versionCruda.trim())) return null

  return {
    version: versionCruda.trim().replace(".", "_"),
    idioma: IDIOMA_POR_NOMBRE[(idiomaCrudo ?? "").trim().toLowerCase()] ?? null,
    crudo: primeraLinea,
  }
}

/** `28_0` describe a `28.0`; `28` también, porque así se etiquetaron las cargas antiguas. */
export const versionCoincide = (versionUsuario: string, versionRelease: string): boolean => {
  const usuario = versionUsuario.trim()
  return usuario === versionRelease || usuario === versionRelease.split("_")[0]
}

/** Comprueba la firma `PK\x03\x04` antes de intentar nada más. */
const pareceZip = async (file: File): Promise<boolean> => {
  const cabecera = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  return cabecera[0] === 0x50 && cabecera[1] === 0x4b && cabecera[2] === 0x03 && cabecera[3] === 0x04
}

/** Traduce los errores de zip.js a algo que el usuario pueda accionar. */
const traducirError = (error: unknown, hayPassword: boolean): ErrorZip => {
  const mensaje = error instanceof Error ? error.message : String(error)

  if (/password/i.test(mensaje)) {
    return new ErrorZip(
      hayPassword
        ? "La contraseña no es correcta para este ZIP."
        : "El ZIP está protegido con contraseña. Introdúcela para continuar."
    )
  }
  if (/encrypted/i.test(mensaje)) {
    return new ErrorZip("El ZIP está cifrado y no se pudo abrir con la contraseña indicada.")
  }
  return new ErrorZip(`No se pudo leer el ZIP: ${mensaje}`)
}

/**
 * Descomprime el ZIP, extrae los `.asc` que hay que subir y comprueba la estructura.
 *
 * Recorre **todas** las entradas del ZIP buscando `.asc` sin importar en qué carpeta
 * estén: MSSO los mete en `ascii-280/`, pero el número cambia con cada versión y hay
 * distribuciones reempaquetadas por terceros.
 *
 * @throws ErrorZip si el archivo no es un ZIP, si la contraseña falta o es incorrecta.
 */
export const analizarZip = async (
  file: File,
  password?: string,
  onProgreso?: (mensaje: string) => void
): Promise<AnalisisZip> => {
  if (!/\.zip$/i.test(file.name) || !(await pareceZip(file))) {
    throw new ErrorZip("El archivo seleccionado no es un ZIP.")
  }

  const clave = password?.trim() ? password : undefined
  const lector = new ZipReader(new BlobReader(file), clave ? { password: clave } : {})

  try {
    onProgreso?.("Leyendo el contenido del ZIP…")
    const entradas = await lector.getEntries()

    // `Entry` es la unión de FileEntry y DirectoryEntry, y sólo la primera tiene
    // `getData`; el predicado la estrecha para poder extraer el contenido más abajo.
    const esAsc = (e: Entry): e is FileEntry =>
      !e.directory && nombreBase(e.filename).endsWith(".asc")
    const ascs = entradas.filter(esAsc)

    if (ascs.length === 0) {
      throw new ErrorZip("El ZIP no contiene ningún archivo .asc.")
    }

    // Con `getEntries` basta para saber si hay cifrado: el índice del ZIP no lo está.
    if (ascs.some((e) => e.encrypted) && !clave) {
      throw new ErrorZip("El ZIP está protegido con contraseña. Introdúcela para continuar.")
    }

    const archivos: ArchivoAsc[] = []
    const aSubir = new Set<string>(ARCHIVOS_A_SUBIR)

    for (const entrada of ascs) {
      const nombre = nombreBase(entrada.filename)
      const archivo: ArchivoAsc = {
        nombre,
        rutaEnZip: entrada.filename,
        tamano: entrada.uncompressedSize ?? 0,
      }

      // Sólo se materializa el contenido de lo que se va a transferir. Extraer los 28 MB
      // completos para descartar tres cuartas partes sería trabajo y memoria a cambio de
      // nada: del resto basta con saber que están.
      if (aSubir.has(nombre)) {
        onProgreso?.(`Extrayendo ${nombre}…`)
        archivo.blob = await entrada.getData(new BlobWriter())
      }

      archivos.push(archivo)
    }

    const analisis = construirAnalisis(archivos)
    analisis.release = await leerSelloDeRelease(archivos)

    if (!analisis.release && presentesEl("meddra_release.asc", archivos)) {
      analisis.errores.push(
        'meddra_release.asc no tiene el formato esperado (ej. "28.0$Spanish$$$$"): ' +
          "el ZIP no parece una distribución de MedDRA."
      )
      analisis.valido = false
    }

    return analisis
  } catch (error) {
    if (error instanceof ErrorZip) throw error
    throw traducirError(error, Boolean(clave))
  } finally {
    await lector.close().catch(() => undefined)
  }
}

/** Contrasta lo hallado contra el catálogo y redacta errores y avisos. */
const construirAnalisis = (archivos: ArchivoAsc[]): AnalisisZip => {
  const manifiesto = archivos.map((a) => a.nombre)
  const presentes = new Set(manifiesto)

  const faltantes = ARCHIVOS_REQUERIDOS.filter((n) => !presentes.has(n))
  const desconocidos = Array.from(new Set(manifiesto.filter((n) => !esArchivoConocido(n))))
  const opcionalesAusentes = ARCHIVOS_OPCIONALES.filter((n) => !presentes.has(n))

  const vistos = new Set<string>()
  const repetidos = new Set<string>()
  for (const nombre of manifiesto) {
    if (vistos.has(nombre)) repetidos.add(nombre)
    vistos.add(nombre)
  }
  const duplicados = Array.from(repetidos)

  const errores: string[] = []
  const avisos: string[] = []

  if (faltantes.length) {
    errores.push(`Faltan archivos obligatorios: ${faltantes.join(", ")}`)
  }
  if (desconocidos.length) {
    errores.push(`Hay archivos .asc ajenos a una distribución MedDRA: ${desconocidos.join(", ")}`)
  }
  if (duplicados.length) {
    errores.push(`El mismo archivo aparece en más de una carpeta: ${duplicados.join(", ")}`)
  }

  const sinContenido = ARCHIVOS_A_SUBIR.filter(
    (n) => presentes.has(n) && !archivos.find((a) => a.nombre === n)?.blob?.size
  )
  if (sinContenido.length) {
    errores.push(`Estos archivos están vacíos: ${sinContenido.join(", ")}`)
  }

  if (opcionalesAusentes.length) {
    avisos.push(
      `No vienen los archivos opcionales ${opcionalesAusentes.join(", ")} (dependen de la licencia contratada).`
    )
  }
  if (!manifiesto.some((n) => /^meddra_history_[a-z]+\.asc$/.test(n))) {
    avisos.push("El ZIP no trae el archivo de histórico (meddra_history_*.asc).")
  }

  return {
    archivos,
    manifiesto,
    faltantes,
    desconocidos,
    duplicados,
    opcionalesAusentes,
    // Lo rellena `analizarZip`: leer el blob del sello es asíncrono.
    release: null,
    errores,
    avisos,
    valido: errores.length === 0,
  }
}

const presentesEl = (nombre: string, archivos: ArchivoAsc[]) =>
  archivos.some((a) => a.nombre === nombre)

/** Lee el sello `meddra_release.asc` de los archivos ya extraídos. */
const leerSelloDeRelease = async (archivos: ArchivoAsc[]): Promise<ReleaseMeddra | null> => {
  const blob = archivos.find((a) => a.nombre === "meddra_release.asc")?.blob
  if (!blob) return null

  // Los .asc vienen en ISO-8859-1; leerlos como UTF-8 corrompe las tildes. En este
  // archivo concreto da igual, pero se mantiene el mismo criterio que en el API.
  const texto = new TextDecoder("iso-8859-1").decode(await blob.arrayBuffer())
  return leerRelease(texto)
}

/** Tamaño legible, para el listado de archivos del diálogo. */
export const formatearTamano = (bytes: number): string => {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
