import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings"
import DeleteForeverIcon from "@mui/icons-material/DeleteForever"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import { alpha, useTheme } from "@mui/material/styles"
import { useState } from "react"
import { Title, useNotify, usePermissions } from "react-admin"
import intESAVIClient from "../../dataProviders/axios.client"

const ADMIN_ROLE = "admin"

// ── Acción individual de administración ──────────────────────────────────────

interface AdminActionProps {
  title: string
  description: string
  buttonLabel: string
  confirmMessage: string
  onConfirm: () => Promise<void>
}

const AdminAction = ({
  title,
  description,
  buttonLabel,
  confirmMessage,
  onConfirm,
}: AdminActionProps) => {
  const notify = useNotify()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      notify("Operación ejecutada exitosamente", { type: "success" })
    } catch {
      notify("Error al ejecutar la operación", { type: "error" })
    } finally {
      setLoading(false)
      setDialogOpen(false)
    }
  }

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {description}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<DeleteForeverIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ flexShrink: 0, textTransform: "none" }}>
            {buttonLabel}
          </Button>
        </Stack>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !loading && setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="error" fontSize="small" />
          Confirmar acción destructiva
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirm}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}>
            {loading ? "Ejecutando…" : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export const AdminPage = () => {
  const { permissions, isPending } = usePermissions()
  const theme = useTheme()

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" pt={6}>
        <CircularProgress />
      </Box>
    )
  }

  if (!permissions?.includes(ADMIN_ROLE)) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Acceso denegado. Esta sección es exclusiva para administradores.
        </Alert>
      </Box>
    )
  }

  return (
    <Box p={2} maxWidth={800}>
      <Title title="Administración del sistema" />

      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Box
          px={2.5}
          py={2}
          display="flex"
          alignItems="center"
          gap={1.5}
          sx={{ bgcolor: alpha(theme.palette.error.main, 0.04) }}>
          <Avatar sx={{ bgcolor: "error.main", width: 38, height: 38 }}>
            <AdminPanelSettingsIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              Administración del sistema
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Operaciones destructivas e irreversibles. Úselas con precaución.
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
        Las acciones de esta página son <strong>irreversibles</strong>. Confirme antes de ejecutar.
      </Alert>

      <Stack spacing={2}>
        {/*
          Va primero por ser la menos destructiva de las dos: si alguien entra a "limpiar
          las notificaciones", lo primero que encuentra es la acción acotada y no la que
          además se lleva por delante los diccionarios.
        */}
        <AdminAction
          title="Truncar solo notificaciones"
          description="Elimina todas las notificaciones y sus datos dependientes (vacunas, ESAVI, desenlaces, gravedad, causalidad, medicamentos) mediante TRUNCATE CASCADE. Los diccionarios WHODrug y MedDRA se conservan intactos, así que no hace falta volver a sincronizarlos."
          buttonLabel="Truncar notificaciones"
          confirmMessage="¿Está seguro de que desea eliminar TODAS las notificaciones y sus datos relacionados? Los diccionarios WHODrug y MedDRA, los parámetros de configuración y el historial de sincronizaciones se conservan. Esta acción no se puede deshacer."
          onConfirm={() => intESAVIClient.delete("seed/truncate-solo-notificaciones")}
        />
        <AdminAction
          title="Truncar datos y diccionarios"
          description="Elimina todas las notificaciones y sus datos dependientes (vacunas, ESAVI, desenlaces, gravedad, causalidad, medicamentos) y vacía los diccionarios WHODrug y MedDRA, mediante TRUNCATE CASCADE. Se conservan los parámetros de configuración y el historial de sincronizaciones."
          buttonLabel="Truncar"
          confirmMessage="¿Está seguro de que desea eliminar TODAS las notificaciones y sus datos relacionados, junto con los diccionarios WHODrug y MedDRA? Los parámetros de configuración se conservan. Esta acción no se puede deshacer."
          onConfirm={() => intESAVIClient.delete("seed/truncate-notificacion")}
        />
      </Stack>
    </Box>
  )
}
