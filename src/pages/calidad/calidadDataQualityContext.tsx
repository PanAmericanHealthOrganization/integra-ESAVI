import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useDataProvider, useNotify } from "ra-core"

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

export interface SyntacticQualityRow {
  regla: string
  condicion: string
  descripcionRegla: string
  totalRegistros: number
  totalRegistrosValidos: number
  porcentajeRegistrosValidos: number
}

export interface SemanticQualityRow {
  ruleCode: string
  ruleName: string
  ruleDescription: string
  totalRecords: number
  totalValidRecords: number
  totalInvalidRecords: number
  percentageValidRecords: number
  percentageInvalidRecords: number
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

export const CalidadDataQualityProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const dataProvider = useDataProvider<ICalidadDataProvider>()
  const notify = useNotify()

  const [data, setData] = useState<DataQualitySummary | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    formatDate(new Date())
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

      setData(response)
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
