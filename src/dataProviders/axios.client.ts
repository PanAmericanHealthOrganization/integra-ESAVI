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
    // Puedes modificar la solicitud aquí antes de enviarla
    // Por ejemplo, agregar más headers si es necesario
    // console.log("Solicitud enviada:", config)
    console.log("config", config)
    return config
  },
  function (error) {
    // Manejar el error de la solicitud
    // console.error("Error en la solicitud:", error)
    return Promise.reject(error)
  }
)

// Interceptor de respuesta (response)
intESAVIClient.interceptors.response.use(
  function (response) {
    // Puedes modificar la respuesta aquí antes de retornarla
    // console.log("Respuesta recibida:", response)
    return response
  },
  function (error) {
    // Manejar el error de la respuesta
    // console.error("Error en la respuesta:", error)
    return Promise.reject(error)
  }
)

export default intESAVIClient
