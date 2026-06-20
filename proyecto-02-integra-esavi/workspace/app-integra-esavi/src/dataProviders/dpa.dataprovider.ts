import type {
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

const withId = (item: any) => ({ ...item, id: item.codigo })

export const dpaDataProvider: DataProvider = {
  getList: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetListParams
  ): Promise<GetListResult<RecordType>> {
    const response = await intESAVIClient.get(`/integrator/${resource}`)
    let data: RecordType[] = (response.data || []).map(withId)

    const { q } = params.filter || {}
    if (q) {
      const lower = q.toLowerCase()
      data = data.filter(
        (item: any) =>
          item.codigo?.toLowerCase().includes(lower) ||
          item.nombre?.toLowerCase().includes(lower)
      )
    }

    return { data, total: data.length }
  },

  getOne: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetOneParams<RecordType>
  ): Promise<GetOneResult<RecordType>> {
    const response = await intESAVIClient.get(`/integrator/${resource}/${params.id}`)
    return { data: withId(response.data) }
  },

  getMany: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetManyParams
  ): Promise<GetManyResult<RecordType>> {
    const response = await intESAVIClient.get(`/integrator/${resource}`)
    const data = (response.data || []).map(withId).filter((item: any) =>
      params.ids.includes(item.id)
    )
    return { data }
  },

  getManyReference: async function <RecordType extends RaRecord = any>(
    _resource: string,
    _params: GetManyReferenceParams
  ): Promise<GetManyReferenceResult<RecordType>> {
    throw new Error("Function not implemented.")
  },

  create: async function <
    RecordType extends Omit<RaRecord, "id"> = any,
    ResultRecordType extends RaRecord = RecordType & { id: Identifier },
  >(
    resource: string,
    params: CreateParams
  ): Promise<CreateResult<ResultRecordType>> {
    const response = await intESAVIClient.post(`/integrator/${resource}`, params.data)
    return { data: withId(response.data) }
  },

  update: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: UpdateParams
  ): Promise<UpdateResult<RecordType>> {
    const response = await intESAVIClient.put(
      `/integrator/${resource}/${params.id}`,
      params.data
    )
    return { data: withId(response.data) }
  },

  updateMany: async function <RecordType extends RaRecord = any>(
    _resource: string,
    _params: UpdateManyParams
  ): Promise<UpdateManyResult<RecordType>> {
    throw new Error("Function not implemented.")
  },

  delete: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: DeleteParams<RecordType>
  ): Promise<DeleteResult<RecordType>> {
    const response = await intESAVIClient.delete(`/integrator/${resource}/${params.id}`)
    return { data: withId(response.data) }
  },

  deleteMany: async function <RecordType extends RaRecord = any>(
    _resource: string,
    _params: DeleteManyParams<RecordType>
  ): Promise<DeleteManyResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
}
