import { useDataProvider, useNotify } from "ra-core"
import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { ICalidadDataProvider } from "../../dataProviders/calidad.dataprovider"

export interface CompletenessQualityRow {
  tableName: string
  columnName: string
  columnDescription: string
  totalRecords: number
  totalNulls: number
  totalNonNulls: number
  completenessPercentage: number
}

// Nueva estructura de reglas de calidad del servicio
export interface QualityRule {
  codigo: string
  subDimension: string
  regla: string
  condicion: string
  descripcionRegla: string
  totalRegistros: number
  totalRegistrosValidos: number
  totalRegistrosInvalidos: number
  porcentajeRegistrosValidos: number
  porcentajeRegistrosInvalidos: number
  idNotificacionesNoValidos: string[]
}

// Nueva estructura de dimensión de calidad del servicio
export interface DimensionQuality {
  dimension: string
  calidadTotal: number
  deltaCalidadTotal: number
  jsonDimensionQuality: QualityRule[]
}

// Nueva estructura de respuesta del servicio
export interface CalidadApiResponse {
  id: string
  fecha: string
  dimension: string
  jsonQuality: DimensionQuality[]
  createdAt?: string
  updatedAt?: string
  isEnabled?: boolean
  isActive?: boolean
}

// Interfaces compatibles con los componentes existentes
export interface SyntacticQualityRow {
  codigo?: string
  subDimension?: string
  regla: string
  condicion: string
  descripcionRegla: string
  totalRegistros: number
  totalRegistrosValidos: number
  totalRegistrosInvalidos: number
  porcentajeRegistrosValidos: number
  porcentajeRegistrosInvalidos: number
  idNotificacionesNoValidos?: string[]
}

export interface SemanticQualityRow {
  codigo?: string
  subDimension?: string
  ruleCode?: string
  ruleName?: string
  ruleDescription?: string
  regla: string
  condicion: string
  descripcionRegla: string
  totalRecords: number
  totalRegistrosValidos: number
  totalRegistrosInvalidos: number
  porcentajeRegistrosValidos: number
  porcentajeRegistrosInvalidos: number
  idNotificacionesNoValidos?: string[]
}

export interface TemporalQualityRow {
  [key: string]: unknown
}

export interface DataQualitySummary {
  totalRegistros: number
  totalErrores: number
  totalPorcentaje: number
  completenessQualityTable: CompletenessQualityRow[]
  sintacticQuality: SyntacticQualityRow[]
  semanticQuality: SemanticQualityRow[]
  temporalQuality: TemporalQualityRow[]
  // Datos adicionales de la nueva estructura
  dimensiones?: DimensionQuality[]
  fecha?: string
}

interface CalidadDataQualityContextValue {
  data: DataQualitySummary | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  selectedDate: string
  setSelectedDate: (date: string) => void
}

const CalidadDataQualityContext = createContext<
  CalidadDataQualityContextValue | undefined
>(undefined)

const formatDate = (date: Date) => date.toISOString().slice(0, 10) // YYYY-MM-DD
const formatMonth = (date: Date) => date.toISOString().slice(0, 7) // YYYY-MM

/**
 * Transforma la nueva estructura de respuesta del API a la estructura
 * compatible con los componentes existentes
 */
const transformApiResponse = (
  apiResponse: CalidadApiResponse
): DataQualitySummary => {
  const allRules: QualityRule[] = []

  // Extraer todas las reglas de todas las dimensiones
  apiResponse.jsonQuality.forEach((dimension) => {
    dimension.jsonDimensionQuality.forEach((rule) => {
      allRules.push(rule)
    })
  })

  // Filtrar reglas de exactitud (subDimensiones: Sintáctica y Semántica)
  const sintacticQuality: SyntacticQualityRow[] = allRules
    .filter(
      (rule) =>
        rule.subDimension === "Sintáctica" || rule.subDimension === "Semántica"
    )
    .map((rule) => ({
      codigo: rule.codigo,
      subDimension: rule.subDimension,
      regla: rule.regla,
      condicion: rule.condicion,
      descripcionRegla: rule.descripcionRegla,
      totalRegistros: rule.totalRegistros,
      totalRegistrosValidos: rule.totalRegistrosValidos,
      totalRegistrosInvalidos: rule.totalRegistrosInvalidos,
      porcentajeRegistrosValidos: rule.porcentajeRegistrosValidos,
      porcentajeRegistrosInvalidos: rule.porcentajeRegistrosInvalidos,
      idNotificacionesNoValidos: rule.idNotificacionesNoValidos,
    }))

  // Filtrar reglas de consistencia (subDimensiones: Dominio, Intrarelación, Interrelación)
  const semanticQuality: SemanticQualityRow[] = allRules
    .filter(
      (rule) =>
        rule.subDimension === "Dominio" ||
        rule.subDimension === "Intrarelación" ||
        rule.subDimension === "Interrelación"
    )
    .map((rule) => ({
      codigo: rule.codigo,
      subDimension: rule.subDimension,
      regla: rule.regla,
      condicion: rule.condicion,
      descripcionRegla: rule.descripcionRegla,
      totalRecords: rule.totalRegistros,
      totalRegistrosValidos: rule.totalRegistrosValidos,
      totalRegistrosInvalidos: rule.totalRegistrosInvalidos,
      porcentajeRegistrosValidos: rule.porcentajeRegistrosValidos,
      porcentajeRegistrosInvalidos: rule.porcentajeRegistrosInvalidos,
      idNotificacionesNoValidos: rule.idNotificacionesNoValidos,
    }))

  // Filtrar reglas de completitud (subDimensión: Completitud)
  const completenessQuality: CompletenessQualityRow[] = allRules
    .filter((rule) => rule.subDimension === "Completitud")
    .map((rule) => {
      // Extraer nombre de tabla y columna del código de la regla
      // Formato esperado del código: "CON_DOM_001_NOMBRE_COLUMNA" o similar
      const partes = rule.codigo.split(".")
      const tableName = partes.length > 1 ? partes[0] : "TR_NOTIFICACION"
      const columnName = partes.length > 1 ? partes[1] : rule.regla

      return {
        tableName,
        columnName,
        columnDescription: rule.descripcionRegla,
        totalRecords: rule.totalRegistros,
        totalNulls: rule.totalRegistrosInvalidos,
        totalNonNulls: rule.totalRegistrosValidos,
        completenessPercentage: rule.porcentajeRegistrosValidos,
      }
    })

  // Calcular totales
  const totalRegistros = allRules.reduce((acc, rule) => {
    return acc > rule.totalRegistros ? acc : rule.totalRegistros
  }, 0)

  const totalErrores = allRules.reduce((acc, rule) => {
    return acc + rule.totalRegistrosInvalidos
  }, 0)

  const totalPorcentaje =
    allRules.length > 0
      ? allRules.reduce(
          (acc, rule) => acc + rule.porcentajeRegistrosValidos,
          0
        ) / allRules.length
      : 0

  return {
    totalRegistros,
    totalErrores,
    totalPorcentaje,
    completenessQualityTable: completenessQuality,
    sintacticQuality,
    semanticQuality,
    temporalQuality: [], // No viene en la nueva estructura
    dimensiones: apiResponse.jsonQuality,
    fecha: apiResponse.fecha,
  }
}

export const CalidadDataQualityProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const dataProvider = useDataProvider<ICalidadDataProvider>()
  const notify = useNotify()

  const [data, setData] = useState<DataQualitySummary | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    formatMonth(new Date())
  )

  const fetchData = useCallback(async () => {
    if (!selectedDate) {
      setData(null)
      setError("Debe seleccionar una fecha válida para consultar los datos.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await dataProvider.getDataQualitySummary("dataquality", {
        filter: { date: selectedDate },
      } as any)

      // Transformar la respuesta del API al formato compatible
      const transformedData = transformApiResponse(response)
      setData(transformedData)
    } catch (err) {
      console.error("Error cargando la calidad de datos:", err)
      const message =
        err instanceof Error && err.message
          ? err.message
          : "No se pudo cargar la información de calidad de datos."
      setError(message)
      notify(message, { type: "warning" })
    } finally {
      setLoading(false)
    }
  }, [dataProvider, notify, selectedDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const value = useMemo(
    () => ({
      data,
      loading,
      error,
      refresh: fetchData,
      selectedDate,
      setSelectedDate,
    }),
    [data, loading, error, fetchData, selectedDate]
  )

  return (
    <CalidadDataQualityContext.Provider value={value}>
      {children}
    </CalidadDataQualityContext.Provider>
  )
}

export const useCalidadDataQuality = () => {
  const context = useContext(CalidadDataQualityContext)

  if (!context) {
    throw new Error(
      "useCalidadDataQuality debe utilizarse dentro de un CalidadDataQualityProvider"
    )
  }

  return context
}
