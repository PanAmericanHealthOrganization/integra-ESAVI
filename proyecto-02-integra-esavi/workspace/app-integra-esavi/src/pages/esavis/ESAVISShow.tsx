import AssignmentIcon from "@mui/icons-material/Assignment"
import PersonIcon from "@mui/icons-material/Person"
import {
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material"
import React, { useState } from "react"
import { Show, useShowContext } from "react-admin"

// ─── TabPanel ─────────────────────────────────────────────────────────────────

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`esavi-tabpanel-${index}`}
      aria-labelledby={`esavi-tab-${index}`}
      style={{ overflow: "visible" }}
      {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `esavi-tab-${index}`,
    "aria-controls": `esavi-tabpanel-${index}`,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (value?: string | null) => {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const val = (v?: string | number | null) => (v != null && v !== "" ? String(v) : "—")

interface FieldRowProps {
  label: string
  value?: string | number | null
}

const FieldRow = ({ label, value }: FieldRowProps) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body1">{val(value)}</Typography>
  </Box>
)

// ─── Tab Notificación ─────────────────────────────────────────────────────────

const TabNotificacion = () => {
  const { record } = useShowContext()
  if (!record) return null

  return (
    <Grid container spacing={3} sx={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
      {/* ── Columna izquierda: info estructurada ── */}
      <Grid item xs={12} md={7} sx={{ minWidth: 0 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Identificación
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FieldRow label="Código Origen" value={record.codigoOrigenNotificacion} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldRow label="Sistema Origen" value={record.origen} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldRow label="Unidad Organizacional" value={record.organizacionUnitCode} />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Reporte
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FieldRow label="Título del Reporte" value={record.tituloReporte} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldRow label="Tipo de Reporte" value={record.tipoReporte} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldRow label="Medio de Notificación" value={record.medioNotificacion} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldRow label="Tipo Emisor" value={record.tipoEmisor} />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Fechas
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FieldRow label="Fecha de Notificación" value={formatDate(record.fechaNotificacion)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldRow label="Fecha Reporte Nacional" value={formatDate(record.fechaReporteNacional)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldRow label="Fecha Llenado Ficha" value={formatDate(record.fechaLlenadoFicha)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldRow label="Fecha Atención Médica" value={formatDate(record.fechaAtencion)} />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Notificador
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FieldRow label="Identificación" value={record.notificador?.identificacion} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FieldRow label="Nombres" value={record.notificador?.nombres} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FieldRow
                  label="Profesión"
                  value={
                    record.notificador?.profesion?.nombre ??
                    record.notificador?.profesion?.descripcion ??
                    record.profesionNotificador?.nombre ??
                    record.profesionNotificador?.descripcion
                  }
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* ── Columna derecha: caso narrativo ── */}
      <Grid item xs={12} md={5} sx={{ minWidth: 0 }}>
        <Typography variant="h6" gutterBottom>
          Caso Narrativo
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Paper
          variant="outlined"
          sx={{ p: 2, bgcolor: "grey.50", minHeight: 200, maxHeight: "calc(100vh - 320px)", overflow: "auto" }}>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {record.casoNarrativo || "—"}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  )
}

// ─── Tab Persona ──────────────────────────────────────────────────────────────

const TabPersona = () => {
  const { record } = useShowContext()
  if (!record) return null

  const paciente = record.paciente ?? {}

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Datos Personales
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FieldRow label="Nombre" value={paciente.nombre} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldRow label="Apellidos" value={paciente.apellidos} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldRow label="Iniciales" value={paciente.inicialesNombre} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldRow label="Identificación" value={paciente.identificacion} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldRow label="Fecha de Nacimiento" value={formatDate(paciente.fechaNacimiento)} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldRow
              label="Sexo"
              value={paciente.sexo?.nombre ?? paciente.sexo?.descripcion ?? paciente.sexo}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldRow
              label="Auto-identificación Étnica"
              value={
                paciente.autoIdentificacion?.nombre ??
                paciente.autoIdentificacion?.descripcion ??
                paciente.autoIdentificacion
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldRow label="Código Origen Paciente" value={paciente.codigoOrigen} />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Datos al Momento de la Notificación
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FieldRow
              label="Edad"
              value={
                record.edad != null
                  ? `${record.edad} ${record.unidadEdad?.nombre ?? record.unidadEdad?.descripcion ?? ""}`
                  : undefined
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FieldRow label="Peso (kg)" value={record.peso} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FieldRow label="Altura (cm)" value={record.altura} />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Residencia
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FieldRow
              label="Provincia"
              value={
                record.provinciaResidencia?.nombre ??
                record.provinciaResidencia?.descripcion ??
                record.provinciaResidencia
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldRow
              label="Cantón"
              value={
                record.cantonResidencia?.nombre ??
                record.cantonResidencia?.descripcion ??
                record.cantonResidencia
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldRow
              label="Parroquia"
              value={
                record.parroquiaResidencia?.nombre ??
                record.parroquiaResidencia?.descripcion ??
                record.parroquiaResidencia
              }
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

// ─── Show Page ────────────────────────────────────────────────────────────────

const ESAVISShowContent = () => {
  const { record } = useShowContext()
  const [currentTab, setCurrentTab] = useState(0)

  if (!record) return null

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          Evento de Notificación
        </Typography>
        {record.origen && (
          <Chip label={record.origen} color="primary" size="small" />
        )}
        <Typography variant="body2" color="text.secondary">
          {record.codigoOrigenNotificacion ?? record.id}
        </Typography>
      </Box>

      <Paper elevation={1}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={currentTab}
            onChange={(_e, v) => setCurrentTab(v)}
            aria-label="pestañas del evento de notificación">
            <Tab
              icon={<AssignmentIcon />}
              iconPosition="start"
              label="Notificación"
              {...a11yProps(0)}
            />
            <Tab
              icon={<PersonIcon />}
              iconPosition="start"
              label="Persona"
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <TabNotificacion />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <TabPersona />
        </TabPanel>
      </Paper>
    </Box>
  )
}

export const ESAVISShow = () => (
  <Show>
    <ESAVISShowContent />
  </Show>
)
