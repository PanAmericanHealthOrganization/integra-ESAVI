import axios from "axios"
import keycloak from "../keycloak"
import ENV_CONFIG from "../utils/env_utils"

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
  function (config) {
    const username = keycloak.tokenParsed?.preferred_username
    if (username) {
      config.headers["X-Username"] = username
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
  function (error) {
    return Promise.reject(error)
  }
)

export default intESAVIClient
