import SyncIcon from "@mui/icons-material/Sync"
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  TextField,
} from "@mui/material"
import { useState } from "react"
import Authorize from "../authorization.utils"
import intESAVIClient from "../dataProviders/axios.client"

/**
 * Botones de sincronización bajo demanda.
 *
 * Cada uno vive junto a la tabla de su propio módulo (MedDRA en MedDRA, WHODrug
 * en WHODrug, datamart en ESAVIS) en lugar de la antigua página que los
 * agrupaba. Todos quedan restringidos al rol `admin`, el mismo que el API exige
 * en el endpoint: ocultar el botón por sí solo no era control de acceso.
 */
const ROLES_SINCRONIZACION = ["admin"]

type Feedback = { open: boolean; message: string; severity: "success" | "error" }

const useFeedback = () => {
  const [snack, setSnack] = useState<Feedback>({ open: false, message: "", severity: "success" })
  const show = (message: string, severity: "success" | "error") =>
    setSnack({ open: true, message, severity })
  const node = (
    <Snackbar
      open={snack.open}
      autoHideDuration={5000}
      onClose={() => setSnack((s) => ({ ...s, open: false }))}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
      <Alert
        severity={snack.severity}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        variant="filled">
        {snack.message}
      </Alert>
    </Snackbar>
  )
  return { show, node }
}

const mensajeError = (e: any, fallback: string) =>
  e?.response?.status === 403
    ? "No tienes permisos para ejecutar esta sincronización."
    : (e?.response?.data?.message ?? e?.message ?? fallback)

/** MedDRA: pide versión e idioma de los archivos ya cargados en el servidor. */
export const SincronizarMeddraButton = ({ onDone }: { onDone: () => void }) => {
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState("")
  const [lang, setLang] = useState("")
  const [syncing, setSyncing] = useState(false)
  const { show, node } = useFeedback()

  const sincronizar = async () => {
    if (!version.trim() || !lang.trim()) return
    setSyncing(true)
    try {
      await intESAVIClient.post("/meddra/version/process", {
        version: version.trim(),
        lang: lang.trim(),
      })
      show("Sincronización MedDRA iniciada correctamente.", "success")
      setOpen(false)
      setVersion("")
      setLang("")
      onDone()
    } catch (e: any) {
      show(mensajeError(e, "Error al sincronizar MedDRA."), "error")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Authorize allowedRoles={ROLES_SINCRONIZACION} deniedRoles={[]}>
      <Button variant="contained" size="small" startIcon={<SyncIcon />} onClick={() => setOpen(true)}>
        Sincronizar MedDRA
      </Button>

      <Dialog open={open} onClose={() => !syncing && setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Sincronizar MedDRA</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Ingresa la versión y el idioma de los archivos MedDRA ya cargados en el servidor (ruta:{" "}
            <code>upload_files/meddra/&lt;versión&gt;/&lt;idioma&gt;/</code>).
          </DialogContentText>
          <TextField
            label="Versión"
            placeholder="Ej: 27_1"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            disabled={syncing}
          />
          <TextField
            label="Idioma"
            placeholder="Ej: es"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            fullWidth
            size="small"
            disabled={syncing}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={syncing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={sincronizar}
            disabled={syncing || !version.trim() || !lang.trim()}
            startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}>
            {syncing ? "Procesando…" : "Sincronizar"}
          </Button>
        </DialogActions>
      </Dialog>
      {node}
    </Authorize>
  )
}

/** WHODrug: descarga completa del diccionario, sólo confirmación. */
export const SincronizarWhodrugButton = ({ onDone }: { onDone: () => void }) => {
  const [open, setOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const { show, node } = useFeedback()

  const sincronizar = async () => {
    setSyncing(true)
    try {
      await intESAVIClient.post("/whodrug/sync")
      show("Sincronización WHODrug iniciada correctamente.", "success")
      onDone()
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
export const RegenerarDatamartButton = ({ onDone }: { onDone: () => void }) => {
  const [open, setOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const { show, node } = useFeedback()

  const regenerar = async () => {
    setSyncing(true)
    try {
      const res = await intESAVIClient.post("/datamart/regenerar")
      const result = res.data
      // El endpoint responde 200 incluso cuando la generación falla: el
      // resultado viene en el cuerpo (ok / error).
      show(
        result.message ?? result.error ?? "Datamart regenerado.",
        result.ok ? "success" : "error",
      )
    } catch (e: any) {
      show(mensajeError(e, "Error al regenerar el datamart."), "error")
    } finally {
      setSyncing(false)
      setOpen(false)
      onDone()
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
