import {
  CreateParams,
  CreateResult,
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
import { DataProvider } from "react-admin"
import intESAVIClient from "./axios.client"

export const homologatorDataProvider: DataProvider = {
  getList: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetListParams
  ): Promise<GetListResult<RecordType>> {
    const response = await intESAVIClient.post(`integrator/${resource}/paginated`, { ...params })
    return {
      data: response.data.data,
      total: response.data.total,
    }
  },

  getOne: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetOneParams<RecordType>
  ): Promise<GetOneResult<RecordType>> {
    const response = await intESAVIClient.get(`/integrator/${resource}/getOne/${params.id}`)
    return { data: response.data }
  },

  getMany: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetManyParams
  ): Promise<GetManyResult<RecordType>> {
    const response = await intESAVIClient.post(`/integrator/${resource}/getMany`, { ids: params.ids })
    return { data: response.data }
  },

  getManyReference: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetManyReferenceParams
  ): Promise<GetManyReferenceResult<RecordType>> {
    const response = await intESAVIClient.post(`integrator/${resource}/paginated`, {
      pagination: params.pagination,
      sort: params.sort,
      filter: { [params.target]: params.id, ...params.filter },
    })
    return {
      data: response.data.data,
      total: response.data.total,
    }
  },

  create: async function <
    RecordType extends Omit<RaRecord, "id"> = any,
    ResultRecordType extends RaRecord = RecordType & { id: Identifier },
  >(
    resource: string,
    params: CreateParams
  ): Promise<CreateResult<ResultRecordType>> {
    const response = await intESAVIClient.post(`integrator/${resource}/create`, params.data)
    return { data: response.data }
  },

  update: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: UpdateParams
  ): Promise<UpdateResult<RecordType>> {
    const response = await intESAVIClient.put(`integrator/${resource}/update/${params.id}`, params.data)
    return { data: response.data }
  },

  updateMany: async function <RecordType extends RaRecord = any>(
    _resource: string,
    _params: UpdateManyParams
  ): Promise<UpdateManyResult<RecordType>> {
    throw new Error("updateMany no implementado")
  },

  delete: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: DeleteParams<RecordType>
  ): Promise<DeleteResult<RecordType>> {
    const response = await intESAVIClient.delete(`integrator/${resource}/${params.id}`)
    return { data: response.data }
  },

  deleteMany: async function <RecordType extends RaRecord = any>(
    _resource: string,
    _params: DeleteManyParams<RecordType>
  ): Promise<DeleteManyResult<RecordType>> {
    throw new Error("deleteMany no implementado")
  },
}
