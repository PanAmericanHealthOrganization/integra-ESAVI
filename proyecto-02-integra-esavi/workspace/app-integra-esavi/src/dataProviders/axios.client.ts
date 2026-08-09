import axios from "axios"
import ENV_CONFIG from "../utils/env_utils"
import { TokenUtils } from "../utils/token_utils"

// Crear una instancia de axios
const intESAVIClient = axios.create({
  baseURL: ENV_CONFIG.INT_ESAV_API + "/v1",
  headers: {
    "X-API-KEY": ENV_CONFIG.INT_API_KEY || "",
    "Content-Type": "application/json",
  },
})

// Interceptor de solicitud (request)
intESAVIClient.interceptors.request.use(
  async function (config) {
    // Se renueva antes de adjuntarlo: keycloak-js no refresca solo, así que leer
    // keycloak.token a secas mandaba un JWT vencido en cuanto pasaba su tiempo de vida.
    const token = await TokenUtils.asegurarVigente()
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

// Interceptor de respuesta (response)
intESAVIClient.interceptors.response.use(
  function (response) {
    return response
  },
  async function (error) {
    // Red de seguridad para el 401 que el navegador no vio venir: el token le parecía
    // vigente pero el API lo rechazó (reloj desfasado, claves rotadas en Keycloak). Se
    // fuerza una renovación y se reintenta una única vez, marcando la petición para que
    // un segundo 401 se propague en lugar de entrar en bucle.
    const original = error?.config
    if (error?.response?.status === 401 && original && !original.__reintentadoTrasRenovar) {
      original.__reintentadoTrasRenovar = true
      const token = await TokenUtils.renovarForzado()
      if (token) {
        original.headers["Authorization"] = `Bearer ${token}`
        return intESAVIClient(original)
      }
    }
    return Promise.reject(error)
  }
)

export default intESAVIClient
