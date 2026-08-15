import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import ErrorIcon from "@mui/icons-material/Error"
import InfoIcon from "@mui/icons-material/Info"
import NotificationsIcon from "@mui/icons-material/Notifications"
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material"
import { useState } from "react"
import { Notificacion, useNotificaciones } from "./NotificacionesProvider"

const formatearFecha = (iso: string) => {
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? "—" : fecha.toLocaleString("es-EC")
}

const iconoPorNivel = (nivel: Notificacion["nivel"]) => {
  if (nivel === "ERROR") return <ErrorIcon color="error" fontSize="small" />
  if (nivel === "EXITO") return <CheckCircleIcon color="success" fontSize="small" />
  return <InfoIcon color="info" fontSize="small" />
}

/**
 * Campana de la barra superior.
 *
 * Es donde acaban los avisos de los procesos que ya no bloquean la petición: la carga de
 * MedDRA, la sincronización de WHODrug y la regeneración del datamart responden al
 * instante y comunican su desenlace aquí.
 */
export const CampanaNotificaciones = () => {
  const estado = useNotificaciones()
  const [ancla, setAncla] = useState<HTMLElement | null>(null)

  // Fuera del provider la campana simplemente no se pinta.
  if (!estado) return null

  const { notificaciones, noLeidas, marcarLeidas, eliminar, limpiar } = estado

  const abrir = (e: React.MouseEvent<HTMLElement>) => {
    setAncla(e.currentTarget)
    if (noLeidas > 0) void marcarLeidas()
  }

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton color="inherit" onClick={abrir} size="large">
          <Badge badgeContent={noLeidas} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(ancla)}
        anchorEl={ancla}
        onClose={() => setAncla(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 420, maxWidth: "100vw" } } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} py={1.5}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notificaciones
          </Typography>
          {notificaciones.length > 0 && (
            <Button size="small" onClick={() => limpiar()}>
              Vaciar
            </Button>
          )}
        </Stack>
        <Divider />

        {notificaciones.length === 0 ? (
          <Box px={2} py={4} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              No tienes notificaciones.
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ maxHeight: 420, overflowY: "auto", py: 0 }}>
            {notificaciones.map((n) => (
              <ListItem
                key={n.id}
                divider
                alignItems="flex-start"
                sx={{ bgcolor: n.leida ? "transparent" : "action.hover" }}
                secondaryAction={
                  <IconButton edge="end" size="small" onClick={() => eliminar(n.id)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                }>
                <ListItemIcon sx={{ minWidth: 34, mt: 0.5 }}>{iconoPorNivel(n.nivel)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={n.leida ? 400 : 600}>
                      {n.titulo}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {n.mensaje}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {formatearFecha(n.fecha)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Popover>
    </>
  )
}
