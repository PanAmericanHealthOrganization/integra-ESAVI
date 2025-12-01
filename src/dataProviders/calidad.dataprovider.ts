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
  QueryFunctionContext,
  RaRecord,
  UpdateManyParams,
  UpdateManyResult,
  UpdateParams,
  UpdateResult,
} from "react-admin"
import intESAVIClient from "./axios.client"

export interface ICalidadDataProvider extends DataProvider {
  getDataQualitySummary: (
    resource: string,
    params: GetListParams & QueryFunctionContext
  ) => Promise<any>
  getProblems: (
    resource: string,
    anio: number,
    mes: number,
    codigo: string
  ) => Promise<any[]>
  downloadProblemsCSV: (
    resource: string,
    anio: number,
    mes: number,
    codigo: string
  ) => Promise<void>
  getHistory: (
    resource: string,
    startDay: string,
    endDay: string
  ) => Promise<any>
}

export const calidadDataProvider: ICalidadDataProvider = {
  getDataQualitySummary: async function (
    resource: string,
    params: GetListParams & QueryFunctionContext
  ): Promise<any> {
    const { date } = params.filter
    console.log("date", date)
    const response = await intESAVIClient.get(
      `/${resource}/general?date=${date}`
    )
    return response.data
  },
  getProblems: async function (
    resource: string,
    anio: number,
    mes: number,
    codigo: string
  ): Promise<any[]> {
    const response = await intESAVIClient.get(
      `/${resource}/problems?anio=${anio}&mes=${mes}&codigo=${codigo}`
    )
    return response.data
  },
  downloadProblemsCSV: async function (
    resource: string,
    anio: number,
    mes: number,
    codigo: string
  ): Promise<void> {
    try {
      const data = await this.getProblems(resource, anio, mes, codigo)

      if (!data || data.length === 0) {
        alert("No hay datos disponibles para descargar")
        return
      }

      // Obtener las claves del primer objeto para crear los headers
      const headers = Object.keys(data[0])

      // Crear el contenido CSV
      const csvContent = [
        headers.join(","), // Headers
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header]
              // Escapar valores que contengan comas o comillas
              if (value === null || value === undefined) return ""
              const stringValue = String(value)
              if (stringValue.includes(",") || stringValue.includes('"')) {
                return `"${stringValue.replace(/"/g, '""')}"`
              }
              return stringValue
            })
            .join(",")
        ),
      ].join("\n")

      // Crear el blob y descargar
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)

      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `problemas_calidad_${codigo}_${anio}_${mes}.csv`
      )
      link.style.visibility = "hidden"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error al descargar CSV:", error)
      alert("Error al descargar el archivo CSV")
    }
  },
  getHistory: async function (
    resource: string,
    startDay: string,
    endDay: string
  ): Promise<any> {
    const response = await intESAVIClient.post(`/${resource}/history`, {
      startDay,
      endDay,
    })
    return response.data
  },
  getList: function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetListParams & QueryFunctionContext
  ): Promise<GetListResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  getOne: function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetOneParams<RecordType> & QueryFunctionContext
  ): Promise<GetOneResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  getMany: function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetManyParams<RecordType> & QueryFunctionContext
  ): Promise<GetManyResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  getManyReference: function <RecordType extends RaRecord = any>(
    resource: string,
    params: GetManyReferenceParams & QueryFunctionContext
  ): Promise<GetManyReferenceResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  update: function <RecordType extends RaRecord = any>(
    resource: string,
    params: UpdateParams
  ): Promise<UpdateResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  updateMany: function <RecordType extends RaRecord = any>(
    resource: string,
    params: UpdateManyParams
  ): Promise<UpdateManyResult<RecordType>> {
    throw new Error("Function not implemented.")
  },
  create: function <
    RecordType extends Omit<RaRecord, "id"> = any,
    ResultRecordType extends RaRecord = RecordType & { id: Identifier },
  >(
    resource: string,
    params: CreateParams
  ): Promise<CreateResult<ResultRecordType>> {
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
