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

export const parametroDataProvider: DataProvider = {
  getList: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetListParams
  ): Promise<GetListResult<RecordType>> {
    const response = await intESAVIClient.get(`/integrator/${resource}/findAll`)
    let data: RecordType[] = response.data

    const { q } = params.filter || {}
    if (q) {
      const lower = q.toLowerCase()
      data = data.filter(
        (item: any) =>
          item.clave?.toLowerCase().includes(lower) ||
          item.valor?.toLowerCase().includes(lower) ||
          item.descripcion?.toLowerCase().includes(lower)
      )
    }

    const total = data.length

    const { field, order } = params.sort || {}
    if (field) {
      data = [...data].sort((a: any, b: any) => {
        if (a[field] < b[field]) return order === "ASC" ? -1 : 1
        if (a[field] > b[field]) return order === "ASC" ? 1 : -1
        return 0
      })
    }

    const { page, perPage } = params.pagination || { page: 1, perPage: 10 }
    data = data.slice((page - 1) * perPage, page * perPage)

    return { data, total }
  },

  getOne: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetOneParams<RecordType>
  ): Promise<GetOneResult<RecordType>> {
    const response = await intESAVIClient.get(`/integrator/${resource}/${params.id}`)
    return { data: response.data }
  },

  getMany: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetManyParams
  ): Promise<GetManyResult<RecordType>> {
    const response = await intESAVIClient.get(`/integrator/${resource}/findAll`)
    const data = response.data.filter((item: any) => params.ids.includes(item.id))
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
    const response = await intESAVIClient.post(`/integrator/${resource}/create`, {
      ...params.data,
    })
    return { data: response.data }
  },

  update: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: UpdateParams
  ): Promise<UpdateResult<RecordType>> {
    const response = await intESAVIClient.put(`/integrator/${resource}/${params.id}`, {
      ...params.data,
    })
    return { data: response.data }
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
    return { data: response.data }
  },

  deleteMany: async function <RecordType extends RaRecord = any>(
    _resource: string,
    _params: DeleteManyParams<RecordType>
  ): Promise<DeleteManyResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
}
