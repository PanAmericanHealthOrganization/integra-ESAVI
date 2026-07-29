import { Equal } from 'typeorm';

// La clave/IV deben existir ANTES de importar el módulo: el transformer se construye al cargarlo.
process.env.WHD_TRANSFORM_KEY = 'a'.repeat(64); // 32 bytes en hex
process.env.WHD_TRANSFORM_IV = 'b'.repeat(32); // 16 bytes en hex

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { encriptionTransformer } = require('./whodrug.encript');

describe('encriptionTransformer (WHO_DRUG)', () => {
  it('cifra y descifra un valor en el ciclo completo', () => {
    const cifrado = encriptionTransformer.to('AMOXICILINA') as string;

    expect(cifrado).not.toBe('AMOXICILINA');
    expect(encriptionTransformer.from(cifrado)).toBe('AMOXICILINA');
  });

  it('devuelve el valor tal cual cuando la fila está en texto plano, en vez de reventar', () => {
    // Reproduce el error de producción: "ASPIRINA" en base64 son menos de 16 bytes, así que
    // createDecipheriv lanzaba "Invalid initialization vector" y tumbaba POST /v1/whodrug.
    expect(() => encriptionTransformer.from('ASPIRINA')).not.toThrow();
    expect(encriptionTransformer.from('ASPIRINA')).toBe('ASPIRINA');
  });

  it('no rompe con valores nulos o vacíos', () => {
    expect(encriptionTransformer.from(null)).toBeUndefined();
    expect(encriptionTransformer.from('')).toBeUndefined();
    expect(encriptionTransformer.from(undefined)).toBeUndefined();
  });

  it('sigue cifrando en la escritura: el arreglo es solo de lectura', () => {
    const cifrado = encriptionTransformer.to('VACUNA') as string;

    expect(cifrado).not.toBe('VACUNA');
    // Formato de typeorm-encrypted: base64 de IV(16) + ciphertext.
    expect(Buffer.from(cifrado, 'base64').length).toBeGreaterThanOrEqual(32);
  });

  it('soporta FindOperator en los where (delega en el transformer original)', () => {
    const operador = encriptionTransformer.to(Equal('VACUNA')) as any;

    expect(operador.type).toBe('equal');
    expect(encriptionTransformer.from(operador.value)).toBe('VACUNA');
  });
});
