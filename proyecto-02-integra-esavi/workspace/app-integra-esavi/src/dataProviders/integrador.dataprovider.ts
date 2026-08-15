import {
  CreateParams,
  CreateResult,
  DataProvider,
  DeleteManyParams,
  DeleteManyResult,
  DeleteParams,
  DeleteResult,
  GetListParams,
  GetListResult,
  GetManyParams,
  GetManyReferenceParams,
  GetManyReferenceResult,
  GetManyResult,
  GetOneParams,
  GetOneResult,
  RaRecord,
  UpdateManyParams,
  UpdateManyResult,
  UpdateParams,
  UpdateResult,
} from "react-admin"
import intESAVIClient from "./axios.client"
import { INT_ESAV_API } from "./fetch.integra.esavi.client"

/**
 * Las tres importaciones van por `intESAVIClient` y no por `fetch` a pelo: su interceptor
 * adjunta el token de Keycloak (y lo renueva si hace falta), que es lo que permite al API
 * saber quién lanzó la corrida y dejarle la notificación en su buzón al terminar. Con la
 * X-API-KEY sola el proceso quedaba registrado en TR_SYNC_PROCESS pero sin destinatario,
 * así que nadie recibía el aviso.
 *
 * VigiFlow va con URL absoluta porque su controlador no está versionado: cuelga de
 * `/integrator/vigiflow`, mientras que el baseURL del cliente apunta a `/v1`.
 */
export const integradorDataProvider: DataProvider = {
  importDataVigiflow: async (startDate: string, endDate: string) => {
    const { data } = await intESAVIClient.get(
      `${INT_ESAV_API}/integrator/vigiflow/bulk`,
      { params: { codigoATC: "J07", fechaInicio: startDate, fechaFin: endDate } }
    )
    return data
  },
  importDataVigiflowFromFile: async () => {
    const { data } = await intESAVIClient.get(
      `${INT_ESAV_API}/integrator/vigiflow/bulk-from-file`
    )
    return data
  },
  importDataDHIS2: async (startDate: string, endDate: string) => {
    const { data } = await intESAVIClient.get("integrator/dhis2/bulk", {
      params: { codigoATC: "DHIS2", fechaInicio: startDate, fechaFin: endDate },
    })
    return data
  },
  getList: async (
    resource: string,
    params: GetListParams
  ): Promise<GetListResult<any>> => {
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

  getOne: function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetOneParams<any>
  ): Promise<GetOneResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  getMany: function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetManyParams
  ): Promise<GetManyResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  getManyReference: function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetManyReferenceParams
  ): Promise<GetManyReferenceResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  update: function <RecordType extends RaRecord = any>(
    resource: string,
    params: UpdateParams<any>
  ): Promise<UpdateResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  updateMany: function <RecordType extends RaRecord = any>(
    resource: string,
    params: UpdateManyParams<any>
  ): Promise<UpdateManyResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  create: function <RecordType extends RaRecord = any>(
    resource: string,
    params: CreateParams<any>
  ): Promise<CreateResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  delete: function <RecordType extends RaRecord = any>(
    resource: string,
    params: DeleteParams<RecordType>
  ): Promise<DeleteResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  deleteMany: function <RecordType extends RaRecord = any>(
    resource: string,
    params: DeleteManyParams<RecordType>
  ): Promise<DeleteManyResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
}
