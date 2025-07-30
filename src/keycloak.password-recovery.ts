import axios from "axios"
import ENV_CONFIG from "./utils/env_utils"

export async function sendKeycloakPasswordRecovery(email: string) {
  // Ajusta la URL según tu configuración de Keycloak
  const keycloakBaseUrl = ENV_CONFIG.INT_KEYCLOAK_URL
  const realm = ENV_CONFIG.INT_KEYCLOAK_REALM
  const url = `${keycloakBaseUrl}/realms/${realm}/login-actions/reset-credentials`

  // Keycloak espera el email como parámetro POST
  // En la mayoría de instalaciones, este endpoint requiere autenticación de cliente
  // Aquí se asume que el endpoint está expuesto o tienes un backend que lo gestione
  return axios.post(url, { email })
}
