import SyncIcon from "@mui/icons-material/Sync"
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material"
import { useState } from "react"
import Authorize from "../authorization.utils"
import intESAVIClient from "../dataProviders/axios.client"
import { ROLES_SINCRONIZACION, mensajeError, useFeedback } from "./syncFeedback"

/**
 * Botones de sincronización bajo demanda.
 *
 * Cada uno vive junto a la tabla de su propio módulo (MedDRA en MedDRA, WHODrug
 * en WHODrug, datamart en ESAVIS) en lugar de la antigua página que los
 * agrupaba. Todos quedan restringidos al rol `admin`, el mismo que el API exige
 * en el endpoint: ocultar el botón por sí solo no era control de acceso.
 */

/**
 * MedDRA vive en su propio archivo: su diálogo descomprime el ZIP de MSSO y valida la
 * distribución, y no cabía aquí. Se re-exporta para no obligar a cambiar los imports.
 */
export { SincronizarMeddraButton } from "./meddra/SincronizarMeddraButton"

/** WHODrug: descarga completa del diccionario, sólo confirmación. */
export const SincronizarWhodrugButton = ({ onDone }: { onDone?: () => void }) => {
  const [open, setOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const { show, node } = useFeedback()

  const sincronizar = async () => {
    setSyncing(true)
    try {
      await intESAVIClient.post("/whodrug/sync")
      show("Sincronización WHODrug iniciada correctamente.", "success")
      onDone?.()
    } catch (e: any) {
      show(mensajeError(e, "Error al sincronizar WHODrug."), "error")
    } finally {
      setSyncing(false)
      setOpen(false)
    }
  }

  return (
    <Authorize allowedRoles={ROLES_SINCRONIZACION} deniedRoles={[]}>
      <Button
        variant="contained"
        size="small"
        color="secondary"
        startIcon={<SyncIcon />}
        onClick={() => setOpen(true)}>
        Sincronizar WHODrug
      </Button>

      <Dialog open={open} onClose={() => !syncing && setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Sincronizar WHODrug</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Este proceso descarga y actualiza el diccionario WHODrug completo. Puede tomar varios
            minutos. ¿Deseas continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={syncing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={sincronizar}
            disabled={syncing}
            startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}>
            {syncing ? "Iniciando…" : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
      {node}
    </Authorize>
  )
}

/** Datamart: regenera el DuckDB que alimenta el dashboard analítico. */
export const RegenerarDatamartButton = ({ onDone }: { onDone?: () => void }) => {
  const [open, setOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const { show, node } = useFeedback()

  const regenerar = async () => {
    setSyncing(true)
    try {
      const res = await intESAVIClient.post("/datamart/regenerar")
      const result = res.data
      // El endpoint responde 200 incluso cuando la generación falla o se omite:
      // el desenlace viene en el cuerpo (ok / skipped / error).
      show(
        result.message ?? result.error ?? "Datamart regenerado.",
        result.skipped ? "warning" : result.ok ? "success" : "error",
      )
    } catch (e: any) {
      show(mensajeError(e, "Error al regenerar el datamart."), "error")
    } finally {
      setSyncing(false)
      setOpen(false)
      onDone?.()
    }
  }

  return (
    <Authorize allowedRoles={ROLES_SINCRONIZACION} deniedRoles={[]}>
      <Button
        variant="contained"
        size="small"
        color="warning"
        startIcon={<SyncIcon />}
        onClick={() => setOpen(true)}
        disabled={syncing}>
        Regenerar Datamart
      </Button>

      <Dialog open={open} onClose={() => !syncing && setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Regenerar Datamart</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Este proceso reconstruye el archivo DuckDB que alimenta el dashboard analítico a partir
            de los datos actuales. La petición permanece en espera hasta que la regeneración termina
            y puede tomar varios minutos. ¿Deseas continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={syncing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={regenerar}
            disabled={syncing}
            startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}>
            {syncing ? "Regenerando…" : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
      {node}
    </Authorize>
  )
}
