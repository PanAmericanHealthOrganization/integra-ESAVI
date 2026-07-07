import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Cifrado simétrico de los valores de TC_PARAMETRO con una única llave maestra
 * (PROD_ENCRYPTION_KEY). AES-256-GCM con IV aleatorio por operación: mismo
 * texto plano nunca produce el mismo cifrado dos veces, y el authTag detecta
 * cualquier manipulación del valor almacenado.
 * Formato persistido (base64): IV(12) + authTag(16) + ciphertext.
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getMasterKey(): Buffer {
  const key = process.env.PROD_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('PROD_ENCRYPTION_KEY no está configurada en el entorno');
  }
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `PROD_ENCRYPTION_KEY debe ser una cadena hexadecimal de ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} caracteres)`,
    );
  }
  return keyBuffer;
}

export function encryptValue(plainText: string): string {
  const key = getMasterKey();
  const iv = randomBytes(IV_LENGTH);
  // `as any`: @types/node modela Buffer como Uint8Array<ArrayBufferLike>, incompatible en
  // strict mode con el CipherKey/BinaryLike esperado (mismo workaround que typeorm-encrypted).
  const cipher = (createCipheriv as any)(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}

export function decryptValue(encoded: string): string {
  const key = getMasterKey();
  const raw = Buffer.from(encoded, 'base64');
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const cipherText = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = (createDecipheriv as any)(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(cipherText), decipher.final()]).toString('utf8');
}
