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
    const response = await intESAVIClient.get("/integrator/establecimientos")
    let data: RecordType[] = (response.data || []).map(withId)

    const { q } = params.filter || {}
    if (q) {
      const lower = q.toLowerCase()
      data = data.filter(
        (item: any) =>
          item.uniCodigo?.toLowerCase().includes(lower) ||
          item.uniNombre?.toLowerCase().includes(lower) ||
          (item.tipoEntidad ?? "").toLowerCase().includes(lower) ||
          (item.parroquiaResidencia?.nombre ?? "").toLowerCase().includes(lower)
      )
    }

    const { page, perPage } = params.pagination ?? { page: 1, perPage: 9999 }
    const total = data.length
    const start = (page - 1) * perPage
    return { data: data.slice(start, start + perPage), total }
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
    const response = await intESAVIClient.get("/integrator/establecimientos")
    const data = (response.data || []).map(withId).filter((item: any) => params.ids.includes(item.id))
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
