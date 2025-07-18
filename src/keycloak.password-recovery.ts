import axios from "axios"

export async function sendKeycloakPasswordRecovery(email: string) {
  // Ajusta la URL según tu configuración de Keycloak
  const keycloakBaseUrl = import.meta.env.VITE_KEYCLOAK_URL
  const realm = import.meta.env.VITE_KEYCLOAK_REALM
  const url = `${keycloakBaseUrl}/realms/${realm}/login-actions/reset-credentials`

  // Keycloak espera el email como parámetro POST
  // En la mayoría de instalaciones, este endpoint requiere autenticación de cliente
  // Aquí se asume que el endpoint está expuesto o tienes un backend que lo gestione
  return axios.post(url, { email })
}
