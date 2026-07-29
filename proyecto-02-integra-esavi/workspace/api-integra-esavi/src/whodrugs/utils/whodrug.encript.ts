import { Logger } from '@nestjs/common';
import { FindOperator, ValueTransformer } from 'typeorm';
import { EncryptionTransformer } from 'typeorm-encrypted';
import * as dotenv from 'dotenv';
dotenv.config();

const logger = new Logger('WhodrugEncriptionTransformer');

const transformerBase = new EncryptionTransformer({
  key: process.env.WHD_TRANSFORM_KEY,
  algorithm: 'aes-256-cbc',
  ivLength: 16,
  iv: process.env.WHD_TRANSFORM_IV,
});

/**
 * Transformer tolerante a valores no cifrados en las columnas DRU_NAME / DRU_CODE.
 *
 * `typeorm-encrypted` no guarda el IV en la configuración: al descifrar toma los primeros 16
 * bytes del propio valor almacenado. Si una fila trae texto plano —filas cargadas antes de que
 * la columna se cifrara, o insertadas por fuera de TypeORM— `Buffer.from(valor, 'base64')`
 * produce menos de 16 bytes y `createDecipheriv` revienta con "Invalid initialization vector".
 *
 * Como `Drug.getDrugsPaginated` hidrata TODA la tabla, una sola fila así tumbaba el endpoint
 * completo con un 500. Aquí el fallo se degrada a warning y se devuelve el valor tal cual está
 * en BD, que para las filas en texto plano es justamente el dato correcto. La escritura NO se
 * toca: todo lo que se guarde a partir de ahora sigue cifrándose.
 */
class TolerantEncryptionTransformer implements ValueTransformer {
  /** Se registra un warning por columna, no por fila: la tabla tiene cientos de miles. */
  private readonly columnasReportadas = new Set<string>();

  from(value?: string | null): string | undefined {
    if (!value) {
      return undefined;
    }
    try {
      return transformerBase.from(value);
    } catch (error: any) {
      this.reportarUnaVez(error?.message ?? String(error));
      return value;
    }
  }

  to(value?: string | FindOperator<any> | null): string | FindOperator<any> | undefined {
    return transformerBase.to(value);
  }

  private reportarUnaVez(mensaje: string) {
    if (this.columnasReportadas.has(mensaje)) {
      return;
    }
    this.columnasReportadas.add(mensaje);
    logger.warn(
      `Valor no descifrable en una columna cifrada de WHO_DRUG (${mensaje}). ` +
        'Se devuelve el valor almacenado sin descifrar; probablemente son filas en texto plano ' +
        'anteriores al cifrado. Se recomienda re-sincronizar WHODrug para normalizarlas.',
    );
  }
}

// TODO: encapsulate
export const encriptionTransformer = new TolerantEncryptionTransformer();
