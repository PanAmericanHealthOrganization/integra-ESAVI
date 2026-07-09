import type {
  CreateParams, CreateResult, DataProvider, DeleteManyParams, DeleteManyResult,
  DeleteParams, DeleteResult, GetListParams, GetListResult, GetManyParams,
  GetManyReferenceParams, GetManyReferenceResult, GetManyResult, GetOneParams,
  GetOneResult, RaRecord, UpdateManyParams, UpdateManyResult, UpdateParams, UpdateResult,
} from "react-admin"
import intESAVIClient from "./axios.client"

const withId = (item: any) => ({ ...item, id: item.id ?? item.uniCodigo })

export const establecimientoDataProvider: DataProvider = {
  getList: async function <RecordType extends RaRecord = any>(
    _resource: string,
    params: GetListParams
  ): Promise<GetListResult<RecordType>> {
    const { page, perPage } = params.pagination ?? { page: 1, perPage: 10 }
    const { q } = params.filter || {}
    const response = await intESAVIClient.get("/integrator/establecimientos", {
      params: { page, perPage, ...(q ? { q } : {}) },
    })
    const data: RecordType[] = (response.data?.data ?? []).map(withId)
    return { data, total: response.data?.total ?? 0 }
  },

  getOne: async function <RecordType extends RaRecord = any>(
    _resource: string,
    params: GetOneParams<RecordType>
  ): Promise<GetOneResult<RecordType>> {
    const response = await intESAVIClient.get(`/integrator/establecimientos/${params.id}`)
    return { data: withId(response.data) }
  },

  getMany: async function <RecordType extends RaRecord = any>(
    _resource: string,
    params: GetManyParams
  ): Promise<GetManyResult<RecordType>> {
    const response = await intESAVIClient.get("/integrator/establecimientos", { params: { perPage: 9999 } })
    const data = (response.data?.data ?? []).map(withId).filter((item: any) => params.ids.includes(item.id))
    return { data }
  },

  getManyReference: async function <RecordType extends RaRecord = any>(
    _resource: string,
    _params: GetManyReferenceParams
  ): Promise<GetManyReferenceResult<RecordType>> {
    throw new Error("Not implemented")
  },

  create: async function <RecordType extends Omit<RaRecord, "id"> = any, ResultRecordType extends RaRecord = any>(
    _resource: string,
    params: CreateParams
  ): Promise<CreateResult<ResultRecordType>> {
    const response = await intESAVIClient.post("/integrator/establecimientos", params.data)
    return { data: withId(response.data) }
  },

  update: async function <RecordType extends RaRecord = any>(
    _resource: string,
    params: UpdateParams
  ): Promise<UpdateResult<RecordType>> {
    const response = await intESAVIClient.put(`/integrator/establecimientos/${params.id}`, params.data)
    return { data: withId(response.data) }
  },

  updateMany: async function <RecordType extends RaRecord = any>(
    _resource: string,
    _params: UpdateManyParams
  ): Promise<UpdateManyResult<RecordType>> {
    throw new Error("Not implemented")
  },

  delete: async function <RecordType extends RaRecord = any>(
    _resource: string,
    params: DeleteParams<RecordType>
  ): Promise<DeleteResult<RecordType>> {
    const response = await intESAVIClient.delete(`/integrator/establecimientos/${params.id}`)
    return { data: withId(response.data) }
  },

  deleteMany: async function <RecordType extends RaRecord = any>(
    _resource: string,
    _params: DeleteManyParams<RecordType>
  ): Promise<DeleteManyResult<RecordType>> {
    throw new Error("Not implemented")
  },
}
