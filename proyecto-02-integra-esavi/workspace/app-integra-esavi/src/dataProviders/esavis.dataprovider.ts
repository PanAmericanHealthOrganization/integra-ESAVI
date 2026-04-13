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
  Identifier,
  RaRecord,
  UpdateManyParams,
  UpdateManyResult,
  UpdateParams,
  UpdateResult,
} from "react-admin"
import intESAVIClient from "./axios.client"

// Constantes para endpoints
const ENDPOINTS = {
  NOTIFICACIONES: "/integrator/notificacion",
  FIND_ALL: "/integrator/notificacion/findAllPaginated",
} as const

// Tipos para los datos de ESAVI
interface ESAVIData {
  tipo: string
  paciente: {
    identificacion: string
  }
  [key: string]: any
}

export const esaviDataProvider: DataProvider = {
  getList: async function <RecordType extends RaRecord<Identifier> = any>(
    resource: string,
    params: GetListParams
  ): Promise<GetListResult<RecordType>> {
    console.log("params", params)
    const { filter = {}, pagination } = params
    try {
      const response = await intESAVIClient.post(ENDPOINTS.FIND_ALL, {
        filter,
        pagination,
      })
      return {
        data: response.data.data as any[],
        total: response.data.total,
      }
    } catch (error) {
      throw new Error("Error al obtener la lista de ESAVIs")
    }
  },

  getOne: async function <RecordType extends RaRecord<Identifier> = any>(
    resource: string,
    params: GetOneParams<RecordType>
  ): Promise<GetOneResult<RecordType>> {
    console.log("params", params)
    const { id } = params

    try {
      const response = await intESAVIClient.get(
        `${ENDPOINTS.NOTIFICACIONES}/${id}`
      )

      return {
        data: response.data as any,
      }
    } catch (error) {
      throw new Error("Error al obtener la lista de ESAVIs")
    }
  },

  getMany: async function <RecordType extends RaRecord<Identifier> = any>(
    resource: string,
    params: GetManyParams
  ): Promise<GetManyResult<RecordType>> {
    const { ids } = params

    try {
      const response = await intESAVIClient.get(ENDPOINTS.FIND_ALL)
      const allData = response.data as ESAVIData[]

      // Filtrar por IDs si se proporcionan
      const filteredData = ids
        ? allData.filter((item: any) => ids.includes(item.id))
        : allData

      return {
        data: filteredData as any,
      }
    } catch (error) {
      throw new Error("Error al obtener la lista de ESAVIs")
    }
  },

  getManyReference: function <RecordType extends RaRecord<Identifier> = any>(
    resource: string,
    params: GetManyReferenceParams
  ): Promise<GetManyReferenceResult<RecordType>> {
    throw new Error("Función getManyReference no implementada para ESAVI")
  },

  update: function <RecordType extends RaRecord<Identifier> = any>(
    resource: string,
    params: UpdateParams<any>
  ): Promise<UpdateResult<RecordType>> {
    throw new Error("Función update no implementada para ESAVI")
  },

  updateMany: function <RecordType extends RaRecord<Identifier> = any>(
    resource: string,
    params: UpdateManyParams<any>
  ): Promise<UpdateManyResult<RecordType>> {
    throw new Error("Función updateMany no implementada para ESAVI")
  },

  create: function <
    RecordType extends Omit<RaRecord<Identifier>, "id"> = any,
    ResultRecordType extends RaRecord<Identifier> = RecordType & {
      id: Identifier
    },
  >(
    resource: string,
    params: CreateParams<any>
  ): Promise<CreateResult<ResultRecordType>> {
    throw new Error("Función create no implementada para ESAVI")
  },

  delete: function <RecordType extends RaRecord<Identifier> = any>(
    resource: string,
    params: DeleteParams<RecordType>
  ): Promise<DeleteResult<RecordType>> {
    throw new Error("Función delete no implementada para ESAVI")
  },

  deleteMany: function <RecordType extends RaRecord<Identifier> = any>(
    resource: string,
    params: DeleteManyParams<RecordType>
  ): Promise<DeleteManyResult<RecordType>> {
    throw new Error("Función deleteMany no implementada para ESAVI")
  },
}
