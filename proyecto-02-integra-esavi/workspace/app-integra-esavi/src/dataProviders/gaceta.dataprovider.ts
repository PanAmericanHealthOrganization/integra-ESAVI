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

export interface GacetaDataProvider extends DataProvider {
  getGacetaFile: (resource: string, params: any) => Promise<{ data: any }>
}
export const gacetaDataProvider: GacetaDataProvider = {
  getGacetaFile: async function (resource: string, params: any) {
    try {
      //GET http://localhost:8081/v1/integrator/gaceta/pdf?anio=2025&mes=11
      const response = await intESAVIClient.get(`/integrator/${resource}/pdf`, {
        params,
        responseType: "blob", // Para manejar archivos binarios
      })
      return {
        data: response.data,
      }
    } catch (error) {
      throw new Error("Error al obtener el archivo de la gaceta")
    }
  },
  getList: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetListParams
  ): Promise<GetListResult<RecordType>> {
    try {
      const response = await intESAVIClient.post(
        `integrator/${resource}/paginated`,
        {
          ...params,
        }
      )
      return {
        data: response.data.data,
        total: response.data.total,
        pageInfo: {
          hasNextPage: response.data.hasNextPage,
          hasPreviousPage: response.data.hasPreviousPage,
        },
      }
    } catch (error) {
      throw new Error("Error al obtener la lista de vacunometro")
    }
  },
  getOne: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetOneParams<RecordType>
  ): Promise<GetOneResult<RecordType>> {
    try {
      const response = await intESAVIClient.get(
        `/integrator/${resource}/getOne/${params.id}`
      )
      return {
        data: response.data,
      }
    } catch (error) {
      throw new Error("Error al obtener la gaceta")
    }
  },
  getMany: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetManyParams
  ): Promise<GetManyResult<RecordType>> {
    try {
      const response = await intESAVIClient.get(
        `/integrator/${resource}/findAll`,
        {
          params,
        }
      )
      return {
        data: response.data.data,
      }
    } catch (error) {
      throw new Error("Error al obtener la lista de vacunometro")
    }
  },
  getManyReference: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetManyReferenceParams
  ): Promise<GetManyReferenceResult<RecordType>> {
    try {
      const response = await intESAVIClient.get(
        `/integrator/${resource}/findAll`,
        {
          params,
        }
      )
      return {
        data: response.data.data,
      }
    } catch (error) {
      throw new Error("Error al obtener la lista de vacunometro")
    }
  },
  update: async function <RecordType extends RaRecord = any>(
    resource: string,
    params: UpdateParams
  ): Promise<UpdateResult<RecordType>> {
    try {
      const response = await intESAVIClient.put(
        `integrator/${resource}/update/${params.id}`,
        {
          ...params.data,
        }
      )
      return {
        data: response.data,
      }
    } catch (error) {
      throw new Error("Error al actualizar la gaceta")
    }
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
    throw new Error("Function not implemented.")
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
  syncVacunometro: async function (resource: string, params: any) {
    try {
      const response = await intESAVIClient.post(
        `integrator/${resource}/syncVacunometro`,
        {
          ...params,
        }
      )
      return {
        data: response.data,
      }
    } catch (error) {
      throw new Error("Error al sincronizar el vacunometro")
    }
  },
}
