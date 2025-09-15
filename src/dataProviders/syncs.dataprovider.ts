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
} from "ra-core"
import { axiosClient } from "./axios.integra.esavi.client"

export const syncsDataProvider: DataProvider = {
  getList: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetListParams
  ): Promise<GetListResult<RecordType>> {
    try {
      const response = await axiosClient.get(`/${resource}/many`, {
        params,
      })
      return {
        data: response.data.data,
        total: response.data.total,
      }
    } catch (error) {
      throw new Error("Error al obtener la lista de sincronizaciones")
    }
  },
  getOne: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetOneParams<RecordType>
  ): Promise<GetOneResult<RecordType>> {
    try {
      const response = await axiosClient.get(`/${resource}/${params.id}`)
      return {
        data: response.data,
      }
    } catch (error) {
      throw new Error("Error al obtener la sincronizacion")
    }
  },
  getMany: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetManyParams
  ): Promise<GetManyResult<RecordType>> {
    try {
      const response = await axiosClient.get(`/${resource}/many`, {
        params,
      })
      return {
        data: response.data.data,
      }
    } catch (error) {
      throw new Error("Error al obtener la lista de sincronizaciones")
    }
  },
  getManyReference: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetManyReferenceParams
  ): Promise<GetManyReferenceResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  update: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: UpdateParams
  ): Promise<UpdateResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  updateMany: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: UpdateManyParams
  ): Promise<UpdateManyResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  create: async function <
    RecordType extends Omit<RaRecord, "id"> = any,
    ResultRecordType extends RaRecord = RecordType & { id: Identifier },
  >(
    resource: string,
    params: CreateParams
  ): Promise<CreateResult<ResultRecordType>> {
    try {
      const response = await axiosClient.post(`/${resource}`, params)
      return {
        data: response.data,
      }
    } catch (error) {
      throw new Error("Error al crear la sincronizacion")
    }
  },
  delete: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: DeleteParams<RecordType>
  ): Promise<DeleteResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  deleteMany: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: DeleteManyParams<RecordType>
  ): Promise<DeleteManyResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
}
