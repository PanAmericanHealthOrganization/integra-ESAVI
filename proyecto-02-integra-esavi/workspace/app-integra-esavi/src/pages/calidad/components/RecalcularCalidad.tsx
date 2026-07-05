import { RestartAlt } from "@mui/icons-material"
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material"
import React, { useState } from "react"
import { useDataProvider, useNotify, usePermissions } from "react-admin"

import { ICalidadDataProvider } from "../../../dataProviders/calidad.dataprovider"
import { useCalidadDataQuality } from "../calidadDataQualityContext"

const currentMonth = () => new Date().toISOString().slice(0, 7) // YYYY-MM

const toStartDate = (month: string) => `${month}-01`

const toEndDate = (month: string) => {
  const [year, mm] = month.split("-").map(Number)
  const lastDay = new Date(year, mm, 0).getDate()
  return `${month}-${String(lastDay).padStart(2, "0")}`
}

/**
 * Botón "Recalcular" del dashboard de calidad — visible solo para administradores.
 * Abre un diálogo que borra el estado actual de las evaluaciones y lanza el
 * recálculo para el rango año/mes inicio → año/mes fin indicado.
 */
export const RecalcularCalidad: React.FC = () => {
  const { permissions } = usePermissions()
  const dataProvider = useDataProvider<ICalidadDataProvider>()
  const notify = useNotify()
  const { refresh } = useCalidadDataQuality()

  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [mesInicio, setMesInicio] = useState("")
  const [mesFin, setMesFin] = useState(currentMonth())

  const isAdmin = Array.isArray(permissions) && permissions.includes("admin")
  if (!isAdmin) return null

  const rangoInvalido = !!mesInicio && !!mesFin && mesInicio > mesFin
  const puedeEjecutar = !!mesInicio && !!mesFin && !rangoInvalido && !running

  const handleClose = () => {
    if (!running) setOpen(false)
  }

  const handleRecalcular = async () => {
    setRunning(true)
    try {
      // 1. Borrar el estado actual de las evaluaciones
      await dataProvider.deleteEvaluations("dataquality")

      // 2. Lanzar el recálculo para el rango indicado
      await dataProvider.recalculateRange(
        "dataquality",
        toStartDate(mesInicio),
        toEndDate(mesFin)
      )

      notify(
        `Estado eliminado y recálculo iniciado para ${mesInicio} → ${mesFin}. El proceso continúa en segundo plano.`,
        { type: "info" }
      )
      setOpen(false)
      refresh()
    } catch (err) {
      console.error("Error al recalcular la calidad de datos:", err)
      const message =
        err instanceof Error && err.message
          ? err.message
          : "No se pudo iniciar el recálculo de calidad de datos."
      notify(message, { type: "error" })
    } finally {
      setRunning(false)
    }
  }

  return (
    <>
      <Tooltip title="Recalcular calidad de datos (borra el estado actual)">
        <IconButton color="warning" onClick={() => setOpen(true)}>
          <RestartAlt />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Recalcular calidad de datos</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta acción <strong>borra el estado actual</strong> de todas las
            evaluaciones de calidad y recalcula únicamente el rango indicado.
          </Alert>
          <DialogContentText sx={{ mb: 2 }}>
            Seleccione el período (año y mes) de inicio y fin para el recálculo.
          </DialogContentText>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Inicio (año y mes)"
              type="month"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={mesInicio}
              onChange={(e) => setMesInicio(e.target.value)}
              inputProps={{ max: mesFin || currentMonth() }}
              disabled={running}
            />
            <TextField
              label="Fin (año y mes)"
              type="month"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={mesFin}
              onChange={(e) => setMesFin(e.target.value)}
              inputProps={{ min: mesInicio || undefined, max: currentMonth() }}
              disabled={running}
            />
          </Stack>
          {rangoInvalido && (
            <Alert severity="error" sx={{ mt: 2 }}>
              El período de inicio no puede ser posterior al período de fin.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={running}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleRecalcular}
            disabled={!puedeEjecutar}
            startIcon={
              running ? <CircularProgress size={16} /> : <RestartAlt />
            }>
            {running ? "Procesando…" : "Borrar y recalcular"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default RecalcularCalidad
