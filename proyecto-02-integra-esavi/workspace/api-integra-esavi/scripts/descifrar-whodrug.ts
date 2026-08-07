/**
 * Descifra en sitio WHO_DRUG.DRUG.DRU_NAME y DRU_CODE.
 *
 * Contexto: esas dos columnas se guardaban cifradas con un ValueTransformer
 * (typeorm-encrypted, AES-256-CBC). Al retirar el cifrado de la entidad, la aplicación pasa a
 * leer la columna tal cual: las filas que quedaron cifradas se mostrarían como base64. Este
 * script hace la conversión una sola vez, antes de desplegar el cambio.
 *
 * Es idempotente y tolerante: la tabla ya venía con una mezcla de filas cifradas y filas en
 * texto plano (por eso existía el "TolerantEncryptionTransformer"). Una fila que no descifra
 * se deja intacta, que es justo lo correcto para las que ya estaban en claro.
 *
 * Uso:
 *   # 1. Simulación, no escribe nada. Revisar el resumen antes de aplicar.
 *   npm run whodrug:descifrar
 *
 *   # 2. Aplicar de verdad
 *   npm run whodrug:descifrar -- --commit
 *
 * Requiere en el entorno las credenciales de la BD WHODrug (WHD_DB_*) y la llave con la que se
 * cifró (WHD_TRANSFORM_KEY). Tras ejecutarlo, ambas variables de cifrado pueden borrarse.
 */
import { createDecipheriv } from 'crypto';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

const ALGORITMO = 'aes-256-cbc';
const IV_LENGTH = 16;
const LOTE = 1000;

interface FilaDrug {
  ID: string;
  DRU_NAME: string | null;
  DRU_CODE: string | null;
}

/**
 * Réplica del formato de typeorm-encrypted: base64( IV(16 bytes) || ciphertext ), con la llave
 * en hexadecimal. Se reimplementa aquí a propósito para no depender de la librería, que se
 * desinstala junto con este cambio.
 */
function descifrar(valor: string, llaveHex: string): string | null {
  const datos = Buffer.from(valor, 'base64');
  if (datos.length <= IV_LENGTH) {
    return null; // Demasiado corto para llevar IV: es texto plano.
  }
  try {
    // `as any` sobre la función: @types/node modela Buffer como Uint8Array<ArrayBufferLike>,
    // incompatible en strict mode con el CipherKey/BinaryLike esperado. Mismo workaround que
    // en integrator/utils/parametro-crypto.util.ts.
    const descifrador = (createDecipheriv as any)(
      ALGORITMO,
      Buffer.from(llaveHex, 'hex'),
      datos.subarray(0, IV_LENGTH),
    );
    const claro = Buffer.concat([
      descifrador.update(datos.subarray(IV_LENGTH)),
      descifrador.final(),
    ]).toString('utf8');
    // Un descifrado con la llave equivocada puede "funcionar" y devolver bytes basura; se exige
    // texto imprimible para no escribir mojibake sobre un dato que estaba bien.
    return /^[\x20-\x7EÀ-ſ]*$/.test(claro) ? claro : null;
  } catch {
    return null; // Padding inválido / IV inválido: la fila ya estaba en texto plano.
  }
}

async function main() {
  const aplicar = process.argv.includes('--commit');
  const llave = process.env.WHD_TRANSFORM_KEY;

  if (!llave) {
    throw new Error('Falta WHD_TRANSFORM_KEY en el entorno: es la llave con la que se cifró.');
  }

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.HOST_DATABASE,
    port: +process.env.WHD_DB_PORT,
    username: process.env.WHD_DB_USER,
    password: process.env.WHD_DB_PASS,
    database: process.env.WHD_DB_NAME,
  });

  await dataSource.initialize();
  console.log(`Conectado a ${process.env.WHD_DB_NAME}. Modo: ${aplicar ? 'APLICAR' : 'SIMULACIÓN'}`);

  const filas: FilaDrug[] = await dataSource.query(
    'SELECT "ID", "DRU_NAME", "DRU_CODE" FROM "WHO_DRUG"."DRUG"',
  );
  console.log(`Filas leídas: ${filas.length}`);

  const cambios: { id: string; nombre: string | null; codigo: string | null }[] = [];
  let intactas = 0;

  for (const fila of filas) {
    const nombre = fila.DRU_NAME ? descifrar(fila.DRU_NAME, llave) : null;
    const codigo = fila.DRU_CODE ? descifrar(fila.DRU_CODE, llave) : null;

    if (nombre === null && codigo === null) {
      intactas++;
      continue;
    }
    cambios.push({ id: fila.ID, nombre, codigo });
  }

  console.log(`  Filas cifradas a convertir : ${cambios.length}`);
  console.log(`  Filas ya en texto plano     : ${intactas}`);
  console.log('  Muestra:');
  for (const c of cambios.slice(0, 5)) {
    console.log(`    ${c.id} → DRU_NAME="${c.nombre}" DRU_CODE="${c.codigo}"`);
  }

  if (!aplicar) {
    console.log('\nSimulación: no se escribió nada. Repetir con --commit para aplicar.');
    await dataSource.destroy();
    return;
  }

  // Una sola transacción: si algo falla a mitad, la tabla no queda con la mitad de las filas
  // descifradas y la otra mitad cifradas, que es un estado imposible de distinguir después.
  await dataSource.transaction(async (manager) => {
    for (let i = 0; i < cambios.length; i += LOTE) {
      const lote = cambios.slice(i, i + LOTE);
      for (const c of lote) {
        await manager.query(
          `UPDATE "WHO_DRUG"."DRUG"
             SET "DRU_NAME" = COALESCE($2, "DRU_NAME"),
                 "DRU_CODE" = COALESCE($3, "DRU_CODE")
           WHERE "ID" = $1`,
          [c.id, c.nombre, c.codigo],
        );
      }
      console.log(`  Actualizadas ${Math.min(i + LOTE, cambios.length)}/${cambios.length}`);
    }
  });

  console.log('\nListo. Ya se puede eliminar WHD_TRANSFORM_KEY y WHD_TRANSFORM_IV del .env.');
  await dataSource.destroy();
}

main().catch((error) => {
  console.error('Falló el descifrado:', error.message);
  process.exit(1);
});
