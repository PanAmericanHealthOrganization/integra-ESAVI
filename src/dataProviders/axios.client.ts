import axios from "axios"
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
