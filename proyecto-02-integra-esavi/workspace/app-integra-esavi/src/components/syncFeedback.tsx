import { Alert, Snackbar } from "@mui/material"
import { useState } from "react"

/**
 * Piezas compartidas por los botones de sincronización.
 *
 * Viven aquí y no en `SyncActions.tsx` porque el botón de MedDRA creció hasta necesitar
 * su propio archivo, y tenerlas en uno de los dos crearía un ciclo de importaciones
 * entre ambos.
 */

/**
 * Todos los disparos de sincronización quedan restringidos al rol `admin`, el mismo que
 * el API exige en el endpoint: ocultar el botón por sí solo no es control de acceso.
 */
export const ROLES_SINCRONIZACION = ["admin"]

// "warning" cubre los desenlaces que no son ni éxito ni error: por ejemplo una
// regeneración de datamart que se descarta porque ya hay otra en curso.
export type Severidad = "success" | "error" | "warning" | "info"

type Feedback = { open: boolean; message: string; severity: Severidad }

export const useFeedback = () => {
  const [snack, setSnack] = useState<Feedback>({ open: false, message: "", severity: "success" })
  const show = (message: string, severity: Severidad) => setSnack({ open: true, message, severity })
  const node = (
    <Snackbar
      open={snack.open}
      autoHideDuration={8000}
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

export const mensajeError = (e: any, fallback: string) =>
  e?.response?.status === 403
    ? "No tienes permisos para ejecutar esta sincronización."
    : (e?.response?.data?.message ?? e?.message ?? fallback)
