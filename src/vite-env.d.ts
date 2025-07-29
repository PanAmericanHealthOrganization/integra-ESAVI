/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KEYCLOAK_URL: string
  readonly VITE_KEYCLOAK_REALM: string
  readonly VITE_KEYCLOAK_CLIENT_ID: string
  readonly VITE_INTEGRA_ESAVI_API_URL: string
  readonly VITE_API_KEY: string
  readonly VITE_ESAVI_GRAVE: string
  readonly VITE_DATA_ANALISIS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
