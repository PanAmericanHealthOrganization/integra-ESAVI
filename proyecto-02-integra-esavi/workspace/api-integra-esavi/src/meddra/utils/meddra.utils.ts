import * as fs from 'fs';
import {join} from 'path';
import * as readline from 'readline';

/**
 *
 */
export class MeddraUtils {
  /**
   * Checks if a directory exists at the given path
   * @param path
   * @returns boolean indicating if directory exists
   */
  public static directoryExists = (path: string): boolean => {
    return fs.existsSync(path) && fs.lstatSync(path).isDirectory();
  };

  /**
   * Reads the content of a file for a given version, language, and filename
   * @param version, versión de meddra
   * @param lang, idioma
   * @param file, nombre del archivo
   * @returns Matriz con el contenido del archivo
   */
  public static readFileContent = async (version: string, lang: string, file: string): Promise<string[][]> => {
    const filePath = join(process.cwd(), 'upload_files', 'meddra', version, lang, file);

    // TODO: mejorar para identificar el tipo de enconde de forma dinámica
    const fileStream = fs.createReadStream(filePath, { encoding: 'latin1' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    const lines = [];
    for await (const line of rl) {
      const lineContent = line.split('$');
      lines.push(lineContent);
    }
    return lines;
  };

  /**
   * Misma lectura que {@link readFileContent} pero sobre un buffer en memoria, para los
   * archivos que llegan por multipart y nunca se escriben en disco.
   *
   * El encoding es `latin1` por la misma razón que en la versión de disco: MedDRA
   * distribuye los `.asc` en ISO-8859-1, y leerlos como UTF-8 corrompe cualquier término
   * con tilde o eñe. Las líneas vacías se descartan —el archivo termina en salto de
   * línea y produciría una fila de un solo campo vacío—.
   *
   * @param buffer contenido crudo del `.asc`
   * @returns matriz de campos, separados por `$`
   */
  public static parseAsc = (buffer: Buffer): string[][] => {
    return buffer
      .toString('latin1')
      .split(/\r?\n/)
      .filter((linea) => linea.length > 0)
      .map((linea) => linea.split('$'));
  };
}
