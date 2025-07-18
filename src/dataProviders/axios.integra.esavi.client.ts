import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"
import { INT_API_KEY } from "./fetch.integra.esavi.client"

enum StatusCode {
  Unauthorized = 401,
  Forbidden = 403,
  TooManyRequests = 429,
  InternalServerError = 500,
}

const headers: Readonly<Record<string, string | boolean>> = {
  Accept: "application/json",

  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Credentials": true,
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET, PUT, DELETE",
  "X-Requested-With": "XMLHttpRequest",
  "X-API-KEY": INT_API_KEY || "",
  "Cache-Control": "no-cache",
}

// Podemos usar la siguiente función para inyectar el token JWT a través de un interceptor
// Obtenemos el 'AccessToken` del LocalStorage que establecemos cuando autenticamos
const injectToken = (config: any): any => {
  try {
    const token = localStorage.getItem("accessToken")

    if (token != null) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
      console.log(config)
    }
    return config
  } catch (error: any) {
    throw new Error(error)
  }
}

class Http {
  private instance: AxiosInstance | null = null

  private get http(): AxiosInstance {
    return this.instance != null ? this.instance : this.initHttp()
  }

  initHttp() {
    const http = axios.create({
      baseURL: import.meta.env.VITE_INTEGRA_ESAVI_API_URL,
      headers,
      withCredentials: true,
    })
    console.log("baseURL", import.meta.env.VITE_INTEGRA_ESAVI_API_URL)
    console.log("Headers ::", headers)
    http.interceptors.response.use(
      (response) => response,
      (error) => {
        const { response } = error
        return this.handleError(response)
      }
    )

    this.instance = http
    return http
  }

  request<T = any, R = AxiosResponse<T>>(
    config: AxiosRequestConfig
  ): Promise<R> {
    return this.http.request(config)
  }

  get<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<R> {
    console.log("Config:::", config)

    return this.http.get<T, R>(url, config)
  }

  post<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.http.post<T, R>(url, data, config)
  }

  put<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.http.put<T, R>(url, data, config)
  }

  delete<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.http.delete<T, R>(url, config)
  }

  // Manejar errores de aplicación global
  // Podemos manejar los errores genéricos de la aplicación según el código de estado
  private handleError(error: any) {
    if (!error) {
      return Promise.reject()
    }

    const { status } = error

    switch (status) {
      case StatusCode.InternalServerError: {
        // Handle InternalServerError
        break
      }
      case StatusCode.Forbidden: {
        // Handle Forbidden
        break
      }
      case StatusCode.Unauthorized: {
        // Handle Unauthorized
        break
      }
      case StatusCode.TooManyRequests: {
        // Handle TooManyRequests
        break
      }
    }

    return Promise.reject(error)
  }
}

export const axiosClient = new Http()
