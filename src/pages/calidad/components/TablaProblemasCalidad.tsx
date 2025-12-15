import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useCalidadNavigation } from "../contexts/CalidadNavigationContext"
import { DimensionCalidad } from "../types/calidad.types"
import { BarraDeCalidad } from "./BarraDeCalidad"
import { DescargaErrores } from "./descargaErrores"

interface TablaProblemasCalidadProps {
  dimension: string
  subDimension?: string
  data: DimensionCalidad | null

  onDownload?: (codigo: string, anio: number, mes: number) => void
  anio?: number
  mes?: number
}

const numberFormatter = new Intl.NumberFormat("es-ES")

export const TablaProblemasCalidad: React.FC<TablaProblemasCalidadProps> = ({
  dimension,
  subDimension,
  data,
  onDownload,
  anio,
  mes,
}) => {
  const [selectedSubDimension, setSelectedSubDimension] = useState<
    string | null
  >(null)
  const { targetRuleCodigo, clearTargetRule } = useCalidadNavigation()
  const tableRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({})

  // Filtrar problemas por la dimensión especificada
  const problemasFiltered = useMemo(() => {
    if (!data || data.dimension !== dimension) {
      return []
    }
    return data.jsonDimensionQuality || []
  }, [data, dimension])

  // Efecto para hacer scroll a la regla objetivo
  useEffect(() => {
    if (targetRuleCodigo && data?.dimension === dimension) {
      // Buscar si la regla objetivo está en esta dimensión
      const targetRule = problemasFiltered.find(
        (p) => p.codigo === targetRuleCodigo
      )

      if (targetRule) {
        // Seleccionar la subdimensión correcta si existe
        if (targetRule.subDimension) {
          setSelectedSubDimension(targetRule.subDimension)
        }

        // Esperar a que la tabla se renderice con los filtros aplicados
        setTimeout(() => {
          const rowElement = rowRefs.current[targetRuleCodigo]
          if (rowElement) {
            rowElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            })
            // Destacar la fila temporalmente
            rowElement.style.backgroundColor = "#fff3cd"
            setTimeout(() => {
              rowElement.style.backgroundColor = ""
            }, 2000)
          }
          clearTargetRule()
        }, 300)
      }
    }
  }, [targetRuleCodigo, data, dimension, problemasFiltered, clearTargetRule])

  // Obtener subdimensiones únicas
  const subdimensiones = useMemo(() => {
    const unique = new Set<string>()
    problemasFiltered.forEach((p) => {
      if (p.subDimension) {
        unique.add(p.subDimension)
      }
    })
    return Array.from(unique)
  }, [problemasFiltered])

  // Filtrar por subdimensión seleccionada
  const problemasToDisplay = useMemo(() => {
    if (!selectedSubDimension) {
      return problemasFiltered
    }
    return problemasFiltered.filter(
      (p) => p.subDimension === selectedSubDimension
    )
  }, [problemasFiltered, selectedSubDimension])

  const handleDownloadClick = (codigo: string) => {
    if (onDownload && anio && mes) {
      onDownload(codigo, anio, mes)
    } else {
      alert("Descarga no implementada")
    }
  }

  if (!data || data.dimension !== dimension) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          No hay datos de calidad disponibles para la dimensión: {dimension}
        </Typography>
      </Box>
    )
  }

  if (problemasFiltered.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          No hay problemas de calidad para la dimensión: {dimension}
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Chips de subdimensiones */}
      {subdimensiones.length > 0 && (
        <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Chip
            label="Todas"
            onClick={() => setSelectedSubDimension(null)}
            color={selectedSubDimension === null ? "primary" : "default"}
            variant={selectedSubDimension === null ? "filled" : "outlined"}
          />
          {subdimensiones.map((subDim) => (
            <Chip
              key={subDim}
              label={subDim}
              onClick={() => setSelectedSubDimension(subDim)}
              color={selectedSubDimension === subDim ? "primary" : "default"}
              variant={selectedSubDimension === subDim ? "filled" : "outlined"}
            />
          ))}
        </Box>
      )}

      {/* Tabla de problemas */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "20%" }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Código / Regla
                </Typography>
              </TableCell>
              <TableCell sx={{ width: "30%" }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Descripción de Regla
                </Typography>
              </TableCell>
              <TableCell sx={{ width: "28%" }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Porcentaje
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ width: "10%" }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Descarga
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {problemasToDisplay.map((problema, index) => (
              <TableRow
                key={`${problema.codigo}-${index}`}
                hover
                ref={(el) => {
                  rowRefs.current[problema.codigo] = el
                }}>
                {/* Código / Regla */}
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.7rem" }}>
                      {problema.codigo}
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{ fontSize: "0.95rem" }}>
                      {problema.regla}
                    </Typography>
                  </Stack>
                </TableCell>

                {/* Descripción de Regla con Tooltip */}
                <TableCell>
                  {problema.condicion ? (
                    <Tooltip
                      title={
                        <Typography variant="body2">
                          <strong>Condición:</strong> {problema.condicion}
                        </Typography>
                      }
                      arrow
                      placement="top">
                      <Typography
                        variant="body2"
                        sx={{
                          cursor: "help",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}>
                        {problema.descripcionRegla}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="body2">
                      {problema.descripcionRegla}
                    </Typography>
                  )}
                </TableCell>

                {/* Barra de Válidos vs Errores */}
                <TableCell>
                  <BarraDeCalidad
                    totalRegistros={problema.totalRegistros}
                    totalRegistrosValidos={problema.totalRegistrosValidos}
                    totalRegistrosInvalidos={problema.totalRegistrosInvalidos}
                    porcentajeRegistrosValidos={
                      problema.porcentajeRegistrosValidos
                    }
                    porcentajeRegistrosInvalidos={
                      problema.porcentajeRegistrosInvalidos
                    }
                  />
                </TableCell>

                {/* Botón de Descarga */}
                <TableCell align="center">
                  {problema.totalRegistrosInvalidos > 0 &&
                    anio !== undefined &&
                    mes !== undefined && (
                      <DescargaErrores
                        anio={anio}
                        mes={mes}
                        codigoRegla={problema.codigo}
                      />
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {problemasToDisplay.length > 0 && selectedSubDimension && (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            No hay problemas para la subdimensión: {selectedSubDimension}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
