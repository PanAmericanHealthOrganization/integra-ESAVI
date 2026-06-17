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
import intESAVIClient from "./axios.client"

const findAllGeneros = async () => {
  const response = await intESAVIClient.get("integrator/genero/findAll")
  return response.data as any[]
}

export const generoDataProvider: DataProvider = {
  getList: async function <RecordType extends RaRecord = any>(
    _resource: string,
    params: GetListParams
  ): Promise<GetListResult<RecordType>> {
    const generos = await findAllGeneros()

    const q = (params.filter?.q ?? "").toString().toLowerCase().trim()
    const filtered = q
      ? generos.filter(
          (g) =>
            g.nombre?.toLowerCase().includes(q) ||
            g.codigo?.toLowerCase().includes(q)
        )
      : generos

    const { field = "nombre", order = "ASC" } = params.sort ?? {}
    const sorted = [...filtered].sort((a, b) => {
      const result = String(a[field] ?? "").localeCompare(String(b[field] ?? ""))
      return order === "DESC" ? -result : result
    })

    const { page = 1, perPage = 10 } = params.pagination ?? {}
    const start = (page - 1) * perPage
    const paginated = sorted.slice(start, start + perPage)

    return { data: paginated as RecordType[], total: sorted.length }
  },

  getOne: async function <RecordType extends RaRecord = any>(
    _resource: string,
    params: GetOneParams<RecordType>
  ): Promise<GetOneResult<RecordType>> {
    const response = await intESAVIClient.get(`integrator/genero/${params.id}`)
    return { data: response.data }
  },

  getMany: async function <RecordType extends RaRecord = any>(
    _resource: string,
    params: GetManyParams
  ): Promise<GetManyResult<RecordType>> {
    const generos = await findAllGeneros()
    const ids = params.ids.map(String)
    return { data: generos.filter((g) => ids.includes(String(g.id))) as RecordType[] }
  },

  getManyReference: async function <RecordType extends RaRecord = any>(
    _resource: string,
    params: GetManyReferenceParams
  ): Promise<GetManyReferenceResult<RecordType>> {
    return this.getList(_resource, {
      pagination: params.pagination,
      sort: params.sort,
      filter: { [params.target]: params.id, ...params.filter },
    }) as Promise<GetManyReferenceResult<RecordType>>
  },

  create: async function <
    RecordType extends Omit<RaRecord, "id"> = any,
    ResultRecordType extends RaRecord = RecordType & { id: Identifier },
  >(
    _resource: string,
    params: CreateParams
  ): Promise<CreateResult<ResultRecordType>> {
    const response = await intESAVIClient.post("integrator/genero/create", params.data)
    return { data: response.data }
  },

  update: async function <RecordType extends RaRecord = any>(
    _resource: string,
    params: UpdateParams
  ): Promise<UpdateResult<RecordType>> {
    const response = await intESAVIClient.patch(`integrator/genero/${params.id}`, params.data)
    return { data: response.data }
  },

  updateMany: async function <RecordType extends RaRecord = any>(
    _resource: string,
    _params: UpdateManyParams
  ): Promise<UpdateManyResult<RecordType>> {
    throw new Error("updateMany no implementado")
  },

  delete: async function <RecordType extends RaRecord = any>(
    _resource: string,
    params: DeleteParams<RecordType>
  ): Promise<DeleteResult<RecordType>> {
    const deletedBy = (params.meta?.deletedBy as string) ?? "SYSTEM"
    const response = await intESAVIClient.delete(`integrator/genero/${params.id}`, {
      params: { deletedBy },
    })
    return { data: response.data }
  },

  deleteMany: async function <RecordType extends RaRecord = any>(
    _resource: string,
    _params: DeleteManyParams<RecordType>
  ): Promise<DeleteManyResult<RecordType>> {
    throw new Error("deleteMany no implementado")
  },
}
