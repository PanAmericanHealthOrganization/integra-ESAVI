/**
 * Catálogo de parámetros de TC_PARAMETRO con su valor predeterminado.
 *
 * Sirve a dos flujos que corren al arrancar el servicio:
 *  - El seed de desarrollo, que inserta estos valores si la clave no existe.
 *  - La carga desde variables de entorno, que sustituye el predeterminado por el
 *    valor del entorno pero nunca pisa un valor propio ya configurado.
 *
 * La clave del parámetro es también el nombre de la variable de entorno que lo
 * alimenta: `WHD_UMC_LICENSE_KEY` en TC_PARAMETRO se carga desde
 * `WHD_UMC_LICENSE_KEY` del entorno.
 *
 * `es_encriptado` es true únicamente para contraseñas y llaves/tokens sensibles
 * (*_PASSWD, WHD_UMC_*_KEY). El resto (URLs, usuarios, client id, grant type,
 * scope) no son secretos y viajan en texto plano.
 */
export interface ParametroPorDefecto {
  modulo: string;
  clave: string;
  /** Valor predeterminado. Es el único que la carga desde entorno puede sustituir. */
  valor: string;
  descripcion: string;
  es_encriptado: boolean;
}

export const PARAMETROS_POR_DEFECTO: ParametroPorDefecto[] = [
  {
    modulo: 'DHIS2',
    clave: 'DHIS2_URL',
    valor: 'https://dev-ops-gss.msp.gob.ec',
    descripcion: 'URL base del servidor DHIS2 (valor dummy de desarrollo, reemplazar antes de usar)',
    es_encriptado: false,
  },
  {
    modulo: 'DHIS2',
    clave: 'DHIS2_ROOT_ORG_UNIT',
    valor: 'CcPKoI4rpPZ',
    descripcion: 'Unidad organizativa raíz sobre la que se consultan las instancias del tracker',
    es_encriptado: false,
  },
  {
    modulo: 'DHIS2',
    clave: 'DHIS2_USERNAME',
    valor: 'CAMBIAR_DHIS2_USERNAME',
    descripcion: 'Usuario de DHIS2 (valor dummy de desarrollo, reemplazar antes de usar)',
    es_encriptado: false,
  },
  {
    modulo: 'DHIS2',
    clave: 'DHIS2_PASSWD',
    valor: 'CAMBIAR_DHIS2_PASSWD',
    descripcion: 'Contraseña de DHIS2 (valor dummy de desarrollo, reemplazar antes de usar)',
    es_encriptado: true,
  },
  {
    modulo: 'VIGIFLOW',
    clave: 'VIGIFLOW_USERNAME',
    valor: 'CAMBIAR_VIGIFLOW_USERNAME',
    descripcion: 'Usuario de VigiFlow (valor dummy de desarrollo, reemplazar antes de usar)',
    es_encriptado: false,
  },
  {
    modulo: 'VIGIFLOW',
    clave: 'VIGIFLOW_PASSWD',
    valor: 'CAMBIAR_VIGIFLOW_PASSWD',
    descripcion: 'Contraseña de VigiFlow (valor dummy de desarrollo, reemplazar antes de usar)',
    es_encriptado: true,
  },
  {
    modulo: 'WHODRUG',
    clave: 'WHD_API_URL',
    valor: 'https://api.who-umc.org/',
    descripcion: 'URL base de la API de WHODrug (UMC)',
    es_encriptado: false,
  },
  {
    modulo: 'WHODRUG',
    clave: 'WHD_UMC_LICENSE_KEY',
    valor: 'CAMBIAR_WHD_UMC_LICENSE_KEY',
    descripcion:
      'License key de WHODrug: viaja en la cabecera umc-license-key (valor dummy de desarrollo, reemplazar antes de usar)',
    es_encriptado: true,
  },
  {
    modulo: 'WHODRUG',
    clave: 'WHD_UMC_CLIENT_KEY',
    valor: 'CAMBIAR_WHD_UMC_CLIENT_KEY',
    descripcion:
      'Client key de WHODrug: viaja en la cabecera umc-client-key y como Ocp-Apim-Subscription-Key del APIM que publica la API (valor dummy de desarrollo, reemplazar antes de usar)',
    es_encriptado: true,
  },
  {
    modulo: 'MEDDRA',
    clave: 'MED_URL_TOKEN',
    valor: 'https://mid.meddra.org/connect/token',
    descripcion: 'URL del endpoint OAuth (token) de MedDRA',
    es_encriptado: false,
  },
  {
    modulo: 'MEDDRA',
    clave: 'MED_URL_API',
    valor: 'https://mapisbx.meddra.org/api/search',
    descripcion: 'URL del endpoint de búsqueda (API) de MedDRA',
    es_encriptado: false,
  },
  {
    modulo: 'MEDDRA',
    clave: 'MED_GRANT_TYPE',
    valor: 'password',
    descripcion: 'Grant type OAuth de MedDRA (valor dummy de desarrollo, reemplazar antes de usar)',
    es_encriptado: false,
  },
  {
    modulo: 'MEDDRA',
    clave: 'MED_CLIENT_ID',
    valor: 'CAMBIAR_MED_CLIENT_ID',
    descripcion: 'Client ID de MedDRA (valor dummy de desarrollo, reemplazar antes de usar)',
    es_encriptado: false,
  },
  {
    modulo: 'MEDDRA',
    clave: 'MED_USER_NAME',
    valor: 'CAMBIAR_MED_USER_NAME',
    descripcion: 'Usuario de MedDRA (valor dummy de desarrollo, reemplazar antes de usar)',
    es_encriptado: false,
  },
  {
    modulo: 'MEDDRA',
    clave: 'MED_PASSWORD',
    valor: 'CAMBIAR_MED_PASSWORD',
    descripcion: 'Contraseña de MedDRA (valor dummy de desarrollo, reemplazar antes de usar)',
    es_encriptado: true,
  },
  {
    modulo: 'MEDDRA',
    clave: 'MED_SCOPE',
    valor: 'CAMBIAR_MED_SCOPE',
    descripcion: 'Scope OAuth de MedDRA (valor dummy de desarrollo, reemplazar antes de usar)',
    es_encriptado: false,
  },
];
