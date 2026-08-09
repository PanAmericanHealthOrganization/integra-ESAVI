/**
 * Sustituto de `jwks-rsa` para las pruebas.
 *
 * El paquete se publica como ESM y Jest no lo transforma, así que cualquier spec que importe
 * un controlador protegido falla al cargar: el import arrastra `KeycloakAuthGuard`, que hace
 * `import jwksRsa = require('jwks-rsa')`. Antes esto no molestaba porque casi ningún
 * controlador tenía guards; al protegerlos, el problema alcanza a todos sus specs.
 *
 * Devolver una función basta: los specs comparan clases de guards y construyen controladores
 * a mano, nunca instancian `KeycloakAuthGuard` (que es lo único que llegaría a invocarla).
 */
const jwksRsa = () => {
  throw new Error(
    'jwks-rsa está simulado en las pruebas: ningún spec debería descargar claves JWKS. ' +
      'Si necesitas ejercitar KeycloakAuthGuard de verdad, simula sus dependencias en el propio spec.',
  );
};

export = jwksRsa;
