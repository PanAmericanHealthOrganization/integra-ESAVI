export interface ProblemaCalidad {
  codigo: string
  subDimension: string
  regla: string
  condicion?: string
  descripcionRegla: string
  totalRegistros: number
  totalRegistrosValidos: number
  totalRegistrosInvalidos: number
  porcentajeRegistrosValidos: number
  porcentajeRegistrosInvalidos: number
  idNotificacionesNoValidos: string[]
}

export interface DimensionCalidad {
  dimension: string
  calidadTotal: number
  deltaCalidadTotal: number
  jsonDimensionQuality: ProblemaCalidad[]
}

export interface DataQualityResponse {
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  deletedAt: string | null
  deletedBy: string | null
  isEnabled: boolean
  isActive: boolean
  id: string
  anio: number
  mes: number
  jsonQuality: DimensionCalidad[]
}

export interface ProblemaDetalle {
  ID: string
  FECHA_NOTIFICACION: string
  ORIGEN: string
  NOMBRE: string
  IDENTIFICACION: string | null
}
