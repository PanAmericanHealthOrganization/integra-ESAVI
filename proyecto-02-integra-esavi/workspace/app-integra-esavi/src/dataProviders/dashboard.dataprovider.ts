import {
  CreateResult,
  DataProvider,
  DeleteManyResult,
  DeleteResult,
  GetListResult,
  GetManyReferenceResult,
  GetManyResult,
  GetOneResult,
  RaRecord,
  UpdateManyResult,
  UpdateResult,
} from "react-admin"
import { INT_ESAV_API, INT_API_KEY } from "./fetch.integra.esavi.client"
import { TokenUtils } from "../utils/token_utils"

// Refresca el token si está por expirar y arma los headers de la petición.
// El backend valida el JWT de Keycloak (firma/issuer) en los endpoints de reportes.
// Este dataProvider usa fetch, no la instancia de axios, así que no pasa por su
// interceptor: la renovación se pide aquí explícitamente, con la misma utilidad.
const authHeaders = async (): Promise<HeadersInit> => {
  const token = await TokenUtils.asegurarVigente()
  return {
    "X-API-KEY": INT_API_KEY || "",
    Authorization: token ? `Bearer ${token}` : "",
  }
}

/**
 *
 */
export const dashboardDataProvider: DataProvider = {
  casosEsaviPorSexoGrave: async () => {
    const response = await fetch(
      `${INT_ESAV_API}/v1/integrator/reports/casosEsaviPorSexoGrave`,
      {
        headers: await authHeaders(),
      }
    )
    const data = await response.json()
    return data
  },

  casosEsaviPorSexoNoGrave: async () => {
    const response = await fetch(
      `${INT_ESAV_API}/v1/integrator/reports/casosEsaviPorSexoNoGrave`,
      {
        headers: await authHeaders(),
      }
    )
    const data = await response.json()
    return data
  },

  casosCruzadosMeddra: async () => {
    const response = await fetch(
      `${INT_ESAV_API}/v1/integrator/reports/casosCruzadosMeddra`,
      {
        headers: await authHeaders(),
      }
    )
    const data = await response.json()
    return data
  },

  casosNoCruzadosMeddra: async () => {
    const response = await fetch(
      `${INT_ESAV_API}/v1/integrator/reports/casosNoCruzadosMeddra`,
      {
        headers: await authHeaders(),
      }
    )
    const data = await response.json()
    return data
  },

  casosCruzadosWhodrug: async () => {
    const response = await fetch(
      `${INT_ESAV_API}/v1/integrator/reports/casosCruzadosWhodrug`,
      {
        headers: await authHeaders(),
      }
    )
    const data = await response.json()
    return data
  },

  casosEsaviPorMes: async () => {
    const response = await fetch(
      `${INT_ESAV_API}/v1/integrator/reports/casosEsaviPorMes`,
      {
        headers: await authHeaders(),
      }
    )
    const data = await response.json()
    return data
  },
  getList: async (): Promise<GetListResult<any>> => {
    const respuesta = {
      data: [],
      total: 0,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: true,
      },
    }

    return respuesta
  },

  getOne: function <RecordType extends RaRecord = any>(): Promise<
    GetOneResult<RecordType>
  > {
    throw new Error("Function not implemented.")
  },
  getMany: function <RecordType extends RaRecord = any>(): Promise<
    GetManyResult<RecordType>
  > {
    throw new Error("Function not implemented.")
  },
  getManyReference: function <RecordType extends RaRecord = any>(): Promise<
    GetManyReferenceResult<RecordType>
  > {
    throw new Error("Function not implemented.")
  },
  update: function <RecordType extends RaRecord = any>(): Promise<
    UpdateResult<RecordType>
  > {
    throw new Error("Function not implemented.")
  },
  updateMany: function <RecordType extends RaRecord = any>(): Promise<
    UpdateManyResult<RecordType>
  > {
    throw new Error("Function not implemented.")
  },
  create: function <RecordType extends RaRecord = any>(): Promise<
    CreateResult<RecordType>
  > {
    throw new Error("Function not implemented.")
  },
  delete: function <RecordType extends RaRecord = any>(): Promise<
    DeleteResult<RecordType>
  > {
    throw new Error("Function not implemented.")
  },
  deleteMany: function <RecordType extends RaRecord = any>(): Promise<
    DeleteManyResult<RecordType>
  > {
    throw new Error("Function not implemented.")
  },
}
