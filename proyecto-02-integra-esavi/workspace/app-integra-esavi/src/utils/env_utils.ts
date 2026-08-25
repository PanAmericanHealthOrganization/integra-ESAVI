// Dashboard R Shiny publicado para producción. En PROD el botón «ESAVIS Dashboard» apunta
// siempre aquí, sin depender de que el `.env` del servidor traiga la URL correcta.
const DASH_APP_PRODUCCION = "https://esaviecu-dash.kuyacode.com/"

// Se considera producción todo valor de VITE_ENV que inicie con "PROD"
const IS_PRODUCTION = String(import.meta.env.VITE_ENV || "")
  .toUpperCase()
  .startsWith("PROD")

const ENV_CONFIG = {
  // Ambiente de despliegue (DEV, QA, PROD...). Se considera producción todo valor que inicie con "PROD"
  INT_ENV: (import.meta.env.VITE_ENV || "") as string,
  IS_PRODUCTION,
  INT_ESAV_API: import.meta.env.VITE_INTEGRA_ESAVI_API_URL,
  INT_API_KEY: import.meta.env.VITE_API_KEY,
  INT_KEYCLOAK_URL: import.meta.env.VITE_KEYCLOAK_URL,
  INT_KEYCLOAK_REALM: import.meta.env.VITE_KEYCLOAK_REALM,
  INT_KEYCLOAK_CLIENT_ID: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  INT_DASH_APP: (IS_PRODUCTION
    ? DASH_APP_PRODUCCION
    : import.meta.env.VITE_DASH_APP) as string,
}

export default ENV_CONFIG
