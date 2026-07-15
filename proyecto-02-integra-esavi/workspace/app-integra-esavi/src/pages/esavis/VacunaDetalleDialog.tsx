import CloseIcon from "@mui/icons-material/Close"
import VaccinesIcon from "@mui/icons-material/Vaccines"
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Typography,
} from "@mui/material"
import React from "react"

const formatDate = (value?: string | null) => {
  if (!value) return "—"
  // Estas fechas se guardan como "solo fecha" a medianoche UTC (ver formatoFecha en el
  // backend); forzar timeZone: "UTC" evita que se corran un día en husos negativos (ej. Ecuador).
  return new Date(value).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
}

const val = (v?: string | number | null) => (v != null && v !== "" ? String(v) : "—")

interface FieldRowProps {
  label: string
  value?: string | number | null
}

const FieldRow = ({ label, value }: FieldRowProps) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
      {val(value)}
    </Typography>
  </Box>
)

interface SeccionProps {
  titulo: string
  children: React.ReactNode
}

const Seccion = ({ titulo, children }: SeccionProps) => (
  <Grid item xs={12}>
    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
      {titulo}
    </Typography>
    <Divider sx={{ mb: 2 }} />
    <Grid container spacing={2}>
      {children}
    </Grid>
  </Grid>
)

interface VacunaDetalleDialogProps {
  open: boolean
  onClose: () => void
  vacuna: any | null
}

/**
 * Ventana emergente con el detalle completo de un registro de DatoVacuna
 * (tabla TR_DATO_VACUNA), agrupado por secciones.
 */
const VacunaDetalleDialog: React.FC<VacunaDetalleDialogProps> = ({ open, onClose, vacuna }) => {
  if (!vacuna) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pr: 6 }}>
        <VaccinesIcon color="primary" />
        <Typography variant="h6" component="span" sx={{ flexShrink: 0 }}>
          Detalle de Vacuna
        </Typography>
        {(vacuna.drugName || vacuna.nombreVacPatenteWHODrug) && (
          <Chip
            label={vacuna.drugName ?? vacuna.nombreVacPatenteWHODrug}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ maxWidth: 340 }}
          />
        )}
        <IconButton
          aria-label="Cerrar"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          <Seccion titulo="Codificación WHODrug">
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Sistema de Codificación" value={vacuna.sistemaDeCodificacion} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Código ATC" value={vacuna.codigoAtc} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow
                label="Rol de la Vacuna"
                value={vacuna.rolVacuna?.nombre ?? vacuna.rolVacuna?.descripcion}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Nombre (WHODrug)" value={vacuna.drugName} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Código (WHODrug)" value={vacuna.drugCode} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Medicinal Product ID" value={vacuna.medicinalProductId} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Laboratorio Titular (MAH)" value={vacuna.maHolder} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Medicinal Product ID del Titular" value={vacuna.maHolderMedicinalProductId} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Ingrediente Sospechoso" value={vacuna.ingredienteSospechoso} />
            </Grid>
          </Seccion>

          <Seccion titulo="Dosis y Administración">
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="N° de Dosis" value={vacuna.numeroDosisVacuna} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Dosis Administrada" value={vacuna.dosis} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Dosis de Aplicación" value={vacuna.dosis1} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Intervalo de Dosificación" value={vacuna.intervaloDosificacion} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Duración del Tratamiento" value={vacuna.duracion} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Strength / Potencia" value={vacuna.strengthPotencia} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Vía de Administración" value={vacuna.viaAdministracion} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Vía de Administración (EDQM)" value={vacuna.viaAdministracionEDQM} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Forma Farmacéutica" value={vacuna.formaFarmaceutica} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Forma Farmacéutica (EDQM)" value={vacuna.formaFarmaceuticaEDQM} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Acción Tomada" value={vacuna.accionTomada} />
            </Grid>
          </Seccion>

          <Seccion titulo="Lote y Diluyente">
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="N° de Lote" value={vacuna.numeroLote} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Vencimiento de la Vacuna" value={formatDate(vacuna.fechaVencimientoVacuna)} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="País de Autorización (ISO3)" value={vacuna.paisAutorizacionIso3Code} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Nombre del Diluyente" value={vacuna.nombreDiluyenteVacuna} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldRow label="Vencimiento del Diluyente" value={formatDate(vacuna.fechaVencimientoDiluyente)} />
            </Grid>
          </Seccion>

          <Seccion titulo="Indicación e Información Adicional">
            <Grid item xs={12} sm={6}>
              <FieldRow label="Indicación (MedDRA)" value={vacuna.indicacionMeddra} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FieldRow label="Indicación del Notificador Primario" value={vacuna.indicacionNotificadorPrimario} />
            </Grid>
            <Grid item xs={12}>
              <FieldRow label="Información Adicional del Medicamento" value={vacuna.informacionAdicionalMedicamento} />
            </Grid>
          </Seccion>
        </Grid>
      </DialogContent>
    </Dialog>
  )
}

export default VacunaDetalleDialog
