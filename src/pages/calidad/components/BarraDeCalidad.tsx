import { Box, Stack, Tooltip, Typography } from "@mui/material"
import React from "react"

interface BarraDeCalidadProps {
  totalRegistros: number
  totalRegistrosValidos: number
  totalRegistrosInvalidos: number
  porcentajeRegistrosValidos: number
  porcentajeRegistrosInvalidos: number
}

const numberFormatter = new Intl.NumberFormat("es-ES")

export const BarraDeCalidad: React.FC<BarraDeCalidadProps> = ({
  totalRegistros,
  totalRegistrosValidos,
  totalRegistrosInvalidos,
  porcentajeRegistrosValidos,
  porcentajeRegistrosInvalidos,
}) => {
  const esVacio = totalRegistros === 0

  return (
    <Box sx={{ width: "100%" }}>
      {/* Total de registros sobre la barra */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 0.5, fontSize: "0.75rem" }}>
        Total: {numberFormatter.format(totalRegistros)} registros
      </Typography>

      {/* Barra horizontal con dos secciones */}
      <Box
        sx={{
          display: "flex",
          height: 32,
          borderRadius: 1,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          backgroundColor: esVacio ? "#9ca3af" : "transparent",
        }}>
        {/* Sección gris cuando no hay registros */}
        {esVacio && (
          <Box
            sx={{
              width: "100%",
              backgroundColor: "#9ca3af",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Typography
              variant="caption"
              sx={{
                color: "white",
                fontWeight: "bold",
                fontSize: "0.75rem",
              }}>
              Sin registros
            </Typography>
          </Box>
        )}

        {/* Sección verde (válidos) */}
        {!esVacio && porcentajeRegistrosValidos > 0 && (
          <Tooltip
            title={`Válidos: ${numberFormatter.format(totalRegistrosValidos)} registros`}
            arrow
            placement="top">
            <Box
              sx={{
                width: `${porcentajeRegistrosValidos}%`,
                backgroundColor: "#22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "help",
                transition: "opacity 0.2s",
                "&:hover": {
                  opacity: 0.85,
                },
              }}>
              {porcentajeRegistrosValidos >= 10 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.75rem",
                  }}>
                  {porcentajeRegistrosValidos.toFixed(1)}%
                </Typography>
              )}
            </Box>
          </Tooltip>
        )}

        {/* Sección roja salmon (inválidos) */}
        {!esVacio && porcentajeRegistrosInvalidos > 0 && (
          <Tooltip
            title={`Inválidos: ${numberFormatter.format(totalRegistrosInvalidos)} registros`}
            arrow
            placement="top">
            <Box
              sx={{
                width: `${porcentajeRegistrosInvalidos}%`,
                backgroundColor: "red",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "help",
                transition: "opacity 0.2s",
                "&:hover": {
                  opacity: 0.85,
                },
              }}>
              {porcentajeRegistrosInvalidos >= 10 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.75rem",
                  }}>
                  {porcentajeRegistrosInvalidos.toFixed(1)}%
                </Typography>
              )}
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* Leyenda debajo de la barra - solo si hay registros */}
      {!esVacio && (
        <Stack
          direction="row"
          spacing={2}
          sx={{ mt: 0.5, justifyContent: "center" }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: "#22c55e",
                borderRadius: 0.5,
              }}
            />
            <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
              Válidos: {porcentajeRegistrosValidos.toFixed(1)}%
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: "#fa8072",
                borderRadius: 0.5,
              }}
            />
            <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
              Inválidos: {porcentajeRegistrosInvalidos.toFixed(1)}%
            </Typography>
          </Stack>
        </Stack>
      )}
    </Box>
  )
}
