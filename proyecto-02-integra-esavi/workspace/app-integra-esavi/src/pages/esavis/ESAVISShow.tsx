import AssignmentIcon from "@mui/icons-material/Assignment"
import FactCheckIcon from "@mui/icons-material/FactCheck"
import LocalHospitalIcon from "@mui/icons-material/LocalHospital"
import PersonIcon from "@mui/icons-material/Person"
import VaccinesIcon from "@mui/icons-material/Vaccines"
import VisibilityIcon from "@mui/icons-material/Visibility"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material"
import React,{useEffect,useState} from "react"
import {Datagrid,FunctionField,ListContextProvider,Pagination,Show,useList,useShowContext} from "react-admin"
import intESAVIClient from "../../dataProviders/axios.client"
import VacunaDetalleDialog from "./VacunaDetalleDialog"

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
      style={{ overflowY: "auto", maxHeight: "calc(100vh - 210px)" }}
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

// La app no tiene i18nProvider, así que react-admin rotula la paginación con su diccionario
// inglés por defecto ("Rows per page:"). Estas props llegan a MUI TablePagination y lo
// sobreescriben; el cast es necesario porque react-admin tipa <Pagination> con TableCellProps,
// que no las declara aunque sí las reenvía.
const etiquetasPaginacion = {
  labelRowsPerPage: "Filas por página:",
  labelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) =>
    `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`,
} as Record<string, unknown>

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

const FieldCell = ({ label, value }: FieldRowProps) => (
  <Box sx={{ minWidth: 0, flex: 1 }}>
    <Typography variant="caption" color="text.secondary" noWrap display="block">
      {label}
    </Typography>
    <Typography variant="body2" noWrap title={val(value)}>
      {val(value)}
    </Typography>
  </Box>
)

// RESULTADO_EVENTO se guarda homologado a código numérico (ver TR_DESENLACE_ESAVI).
const RESULTADO_EVENTO: Record<string, string> = {
  "0": "Desconocido",
  "1": "Recuperado",
  "2": "En recuperación",
  "3": "No recuperado",
  "4": "Recuperado con secuelas",
  "5": "Muerte",
}

// AUTOPSIA: si=1, no=0, desconocido=2 (misma convención en DHIS2 y VigiFlow).
const AUTOPSIA: Record<string, string> = { "0": "No", "1": "Sí", "2": "Desconocido" }

const etiqueta = (mapa: Record<string, string>, valor?: string | number | null) =>
  valor == null || valor === "" ? "—" : (mapa[String(valor)] ?? String(valor))

/** Banderas de gravedad: se persisten como texto "1"/"0". */
const SiNoChip = ({ label, value }: FieldRowProps) => {
  const v = value == null || value === "" ? null : String(value)
  const esSi = v === "1" || v?.toLowerCase() === "true"
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      {v == null ? (
        <Typography variant="body1">—</Typography>
      ) : (
        <Chip
          size="small"
          label={esSi ? "Sí" : "No"}
          color={esSi ? "error" : "default"}
          variant={esSi ? "filled" : "outlined"}
        />
      )}
    </Box>
  )
}

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
                <FieldRow label="Unidad Organizacional" value={record.establecimiento?.uniNombre ?? record.organizacionUnitCode} />
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
                <FieldRow label="Tipo de Reporte" value={record.tipoReporte?.nombre} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldRow label="Medio de Notificación" value={record.medioNotificacion} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldRow label="Tipo Emisor" value={record.tipoEmisor?.nombre} />
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

// ─── Tab Paciente ─────────────────────────────────────────────────────────────

const esFemenino = (sexo: any): boolean => {
  if (!sexo) return false
  return sexo.codigo === "MUJER"
}

const TabPaciente = () => {
  const { record } = useShowContext()
  const [embarazada, setEmbarazada] = useState<any>(null)
  const [antecedente, setAntecedente] = useState<any>(null)
  const [loadingEmb, setLoadingEmb] = useState(false)

  const paciente = record?.paciente ?? {}
  const mujer = esFemenino(paciente.sexo)

  useEffect(() => {
    if (!record?.id || !mujer) return
    setLoadingEmb(true)
    Promise.all([
      intESAVIClient.get(`/integrator/notificacion/${record.id}/paciente-embarazada`),
      intESAVIClient.get(`/integrator/notificacion/${record.id}/antecedente-embarazo`),
      // VigiFlow registra el embarazo en TR_ESAVI_DURANTE_EMBARAZO; DHIS2 en TR_ANTECEDENTES_EMBARAZO.
      intESAVIClient.get(`/integrator/notificacion/${record.id}/embarazo-esavi`),
    ])
      .then(([resEmb, resAnt, resEsavi]) => {
        setEmbarazada(resEmb.data ?? null)
        const antArr = Array.isArray(resAnt.data) ? resAnt.data : resAnt.data ? [resAnt.data] : []
        const esaviArr = Array.isArray(resEsavi.data) ? resEsavi.data : resEsavi.data ? [resEsavi.data] : []
        // Prevalece el bloque de embarazo durante el ESAVI cuando existe.
        setAntecedente(esaviArr[0] ?? antArr[0] ?? null)
      })
      .catch(() => {
        setEmbarazada(null)
        setAntecedente(null)
      })
      .finally(() => setLoadingEmb(false))
  }, [record?.id, mujer])

  if (!record) return null

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
            <FieldRow label="Sexo" value={paciente.sexo?.nombre} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldRow
              label="Auto-identificación Étnica"
              value={paciente.autoIdentificacion?.nombre}
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
                  ? `${record.edad} ${record.unidadEdad?.nombre ?? ""}`
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
              value={record.provinciaResidencia?.nombre}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldRow
              label="Cantón"
              value={record.cantonResidencia?.nombre}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldRow
              label="Parroquia"
              value={record.parroquiaResidencia?.nombre}
            />
          </Grid>
        </Grid>
      </Grid>

      {mujer && (
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Embarazo
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {loadingEmb ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FieldRow
                  label="Embarazada al momento de la vacuna"
                  value={embarazada?.momentoVacuna === "1" ? "Sí" : embarazada?.momentoVacuna === "0" ? "No" : "—"}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FieldRow
                  label="Embarazada al momento del ESAVI"
                  value={embarazada?.momentoEsavi === "1" ? "Sí" : embarazada?.momentoEsavi === "0" ? "No" : "—"}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FieldRow
                  label="Edad gestacional (semanas)"
                  value={antecedente?.edadGestacional}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FieldRow
                  label="Fecha última menstruación"
                  value={formatDate(antecedente?.fechaUltimaMenstruacion)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FieldRow
                  label="Fecha probable de parto"
                  value={formatDate(antecedente?.fechaParto)}
                />
              </Grid>
            </Grid>
          )}
        </Grid>
      )}
    </Grid>
  )
}

// ─── Tab Vacunación ───────────────────────────────────────────────────────────

const TabVacunacion = () => {
  const { record } = useShowContext()
  const [vacunacion, setVacunacion] = useState<any>(null)
  const [vacunas, setVacunas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vacunaDetalle, setVacunaDetalle] = useState<any>(null)

  useEffect(() => {
    if (!record?.id) return
    setLoading(true)
    Promise.all([
      intESAVIClient.get(`/integrator/notificacion/${record.id}/dato-vacunacion`),
      intESAVIClient.get(`/integrator/notificacion/${record.id}/dato-vacuna`),
    ])
      .then(([resVacunacion, resVacunas]) => {
        setVacunacion(resVacunacion.data ?? null)
        setVacunas(Array.isArray(resVacunas.data) ? resVacunas.data : [])
      })
      .catch(() => {
        setVacunacion(null)
        setVacunas([])
      })
      .finally(() => setLoading(false))
  }, [record?.id])

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* ── Evento de vacunación ── */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Evento de Vacunación
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {vacunacion ? (
          <Box sx={{ display: "flex", gap: 2, overflowX: "auto" }}>
            <FieldCell label="Vacunatorio" value={vacunacion.establecimiento?.uniNombre ?? vacunacion.nombreVacunatorio} />
            <FieldCell label="Fecha de Vacunación" value={formatDate(vacunacion.fechaVacunacion)} />
            <FieldCell label="Provincia" value={vacunacion.establecimiento?.provinciaDescripcion} />
            <FieldCell label="Cantón" value={vacunacion.establecimiento?.cantonDescripcion} />
            <FieldCell label="Parroquia" value={vacunacion.establecimiento?.parroquiaDescripcion} />
            <FieldCell label="Otra Dirección" value={vacunacion.otraDireccion} />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Sin datos de vacunación registrados.
          </Typography>
        )}
      </Box>

      {/* ── Vacunas aplicadas ── */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Vacuna{vacunas.length !== 1 ? "s" : ""} Aplicada{vacunas.length !== 1 ? "s" : ""}
          {vacunas.length > 0 && (
            <Chip label={vacunas.length} size="small" sx={{ ml: 1 }} />
          )}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {vacunas.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Sin vacunas registradas.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {vacunas.map((v, idx) => (
              <Paper variant="outlined" sx={{ p: 2 }} key={v.id ?? idx}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Vacuna {idx + 1}{v.drugName ? ` — ${v.drugName}` : ""}
                  </Typography>
                  <Tooltip title="Ver detalle completo" arrow>
                    <IconButton size="small" color="primary" onClick={() => setVacunaDetalle(v)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: "flex", gap: 2, overflowX: "auto" }}>
                  <FieldCell label="Nombre (WHODrug)" value={v.nombreVacPatenteWHODrug ?? v.drugName} />
                  <FieldCell label="Fabricante" value={v.maHolder ?? v.nombreFabricante ?? v.nombreFabricanteWhoDrug} />
                  <FieldCell label="N° Lote" value={v.numeroLote} />
                  <FieldCell label="N° Dosis" value={v.numeroDosisVacuna} />
                  <FieldCell label="Código ATC" value={v.codigoAtc} />
                  <FieldCell label="Vía Administración" value={v.viaAdministracion} />
                  <FieldCell label="Inicio Administración" value={formatDate(v.inicioAdministracion)} />
                  <FieldCell label="Vencimiento" value={formatDate(v.fechaVencimientoVacuna)} />
                  {v.rolVacuna && (
                    <FieldCell
                      label="Rol Vacuna"
                      value={v.rolVacuna?.nombre ?? v.rolVacuna?.descripcion}
                    />
                  )}
                  {v.numeroLoteDiluyente && (
                    <FieldCell label="N° Lote Diluyente" value={v.numeroLoteDiluyente} />
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      {/* ── Detalle completo de la vacuna seleccionada ── */}
      <VacunaDetalleDialog
        open={vacunaDetalle != null}
        vacuna={vacunaDetalle}
        onClose={() => setVacunaDetalle(null)}
      />
    </Box>
  )
}

// ─── MedDRA tree ──────────────────────────────────────────────────────────────

interface MeddraNode {
  code: string
  name: string
  level: "LLT" | "PT" | "SOC"
}

interface MeddraTreeChipProps {
  node: MeddraNode
}

const MeddraTreeChip = ({ node }: MeddraTreeChipProps) => (
  <Tooltip title={node.code} arrow placement="top">
    <Chip
      label={`${node.name} (${node.level})`}
      size="small"
      variant="outlined"
      color={node.level === "LLT" ? "primary" : node.level === "PT" ? "default" : "secondary"}
      sx={{ maxWidth: 320, ".MuiChip-label": { whiteSpace: "normal", lineHeight: 1.3 } }}
    />
  </Tooltip>
)

// ─── Tab ESAVI ────────────────────────────────────────────────────────────────

const TabEsavi = () => {
  const { record } = useShowContext()
  const [esavis, setEsavis] = useState<any[]>([])
  const [meddraMap, setMeddraMap] = useState<Record<string, MeddraNode[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!record?.id) return
    setLoading(true)
    intESAVIClient
      .get(`/integrator/notificacion/${record.id}/dato-esavi`)
      .then(async (res) => {
        const items: any[] = Array.isArray(res.data) ? res.data : []
        setEsavis(items)

        const codes = Array.from(new Set(items.map((e) => e.codigoLLT).filter(Boolean)))
        if (codes.length === 0) return

        const results = await Promise.allSettled(
          codes.map((code) => intESAVIClient.get(`/meddra/llt/by-code?code=${encodeURIComponent(code)}`))
        )

        const map: Record<string, MeddraNode[]> = {}
        codes.forEach((code, i) => {
          const r = results[i]
          if (r.status !== "fulfilled" || !r.value?.data) return
          const llt = r.value.data
          const nodes: MeddraNode[] = []
          if (llt.name) nodes.push({ code: llt.code ?? code, name: llt.name, level: "LLT" })
          if (llt.pt?.name) nodes.push({ code: llt.pt.code ?? "", name: llt.pt.name, level: "PT" })
          if (llt.pt?.soc?.name) nodes.push({ code: llt.pt.soc.code ?? "", name: llt.pt.soc.name, level: "SOC" })
          map[code] = nodes
        })
        setMeddraMap(map)
      })
      .catch(() => setEsavis([]))
      .finally(() => setLoading(false))
  }, [record?.id])

  const listContext = useList({ data: esavis, perPage: 10 })

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  if (esavis.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Sin eventos ESAVI registrados.
      </Typography>
    )
  }

  return (
    <ListContextProvider value={listContext}>
      <Datagrid bulkActionButtons={false} rowClick={false}>
        <FunctionField
          label="Evento adverso"
          // NOMBRE_ESAVI ya no se puebla desde VigiFlow: el término clínico está en
          // NOMBRE_ESAVI_REPORTADO (LLT MedDRA en español).
          render={(rec: any) => (
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {rec.nombreReportado ?? rec.nameLLT ?? rec.nombre ?? "—"}
              </Typography>
            </Box>
          )}
        />
        <FunctionField
          label="Fecha inicio"
          render={(rec: any) => formatDate(rec.fechaEsavi)}
        />
        <FunctionField
          label="CIE-10"
          render={(rec: any) => (
            <Typography variant="caption">{rec.codigoEsaviCie10 ?? "—"}</Typography>
          )}
        />
        <FunctionField
          label="Código caso"
          render={(rec: any) => (
            <Typography variant="caption" title={rec.codigoCaso}>{rec.codigoCaso ?? "—"}</Typography>
          )}
        />
        <FunctionField
          label="MedDRA"
          render={(rec: any) => {
            const nodes: MeddraNode[] = rec.codigoLLT ? (meddraMap[rec.codigoLLT] ?? []) : []
            if (nodes.length === 0) return null
            return (
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", py: 0.5 }}>
                {nodes.map((node) => (
                  <MeddraTreeChip key={node.level} node={node} />
                ))}
              </Box>
            )
          }}
        />
      </Datagrid>
      <Pagination rowsPerPageOptions={[10, 25, 50]} {...etiquetasPaginacion} />
    </ListContextProvider>
  )
}

// ─── Tab Desenlace ────────────────────────────────────────────────────────────

const TabDesenlace = () => {
  const { record } = useShowContext()
  const [desenlace, setDesenlace] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!record?.id) return
    setLoading(true)
    intESAVIClient
      .get(`/integrator/notificacion/${record.id}/desenlace-esavi`)
      // El endpoint devuelve el registro 1:1 o null; se normaliza por si llega envuelto en arreglo.
      .then((res) => setDesenlace(Array.isArray(res.data) ? (res.data[0] ?? null) : (res.data || null)))
      .catch(() => setDesenlace(null))
      .finally(() => setLoading(false))
  }, [record?.id])

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  if (!desenlace) {
    return (
      <Typography variant="body2" color="text.secondary">
        Sin desenlace registrado.
      </Typography>
    )
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4}>
        <FieldRow label="Resultado del evento" value={etiqueta(RESULTADO_EVENTO, desenlace.resultadoEvento)} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <FieldRow label="Autopsia" value={etiqueta(AUTOPSIA, desenlace.autopsia)} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <FieldRow label="Código de desenlace" value={desenlace.codigo} />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Fallecimiento
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <FieldRow label="Fecha de fallecimiento" value={formatDate(desenlace.fechaMuerte)} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <FieldRow label="Fecha notificación de muerte" value={formatDate(desenlace.fechaNotificacionMuerte)} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <FieldRow
          label="Fecha notificación de muerte fetal"
          value={formatDate(desenlace.fechaNotififacionMuerteFetal)}
        />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Clasificación final
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <FieldRow label="Clasificación final del caso" value={desenlace.clasificacionFinalCaso} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FieldRow label="Clasificación final — Opción A" value={desenlace.clasificacionFinalCasoA} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FieldRow label="Clasificación final — Opción B" value={desenlace.clasificacionFinalCasoB} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <FieldRow label="Causalidad del ESAVI" value={desenlace.causalidadEsavi} />
      </Grid>
    </Grid>
  )
}

// ─── Tab Gravedad ─────────────────────────────────────────────────────────────

const TabGravedad = () => {
  const { record } = useShowContext()
  const [gravedad, setGravedad] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!record?.id) return
    setLoading(true)
    intESAVIClient
      .get(`/integrator/notificacion/${record.id}/gravedad-esavi`)
      .then((res) => setGravedad(Array.isArray(res.data) ? (res.data[0] ?? null) : (res.data || null)))
      .catch(() => setGravedad(null))
      .finally(() => setLoading(false))
  }, [record?.id])

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  if (!gravedad) {
    return (
      <Typography variant="body2" color="text.secondary">
        Sin gravedad registrada.
      </Typography>
    )
  }

  const esGrave = String(gravedad.tipo) === "1"

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          Tipo de gravedad
        </Typography>
        <Chip
          label={esGrave ? "Grave" : "No grave"}
          color={esGrave ? "error" : "success"}
          size="small"
        />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Criterios de gravedad
        </Typography>
      </Grid>
      <Grid item xs={6} sm={4} md={3}>
        <SiNoChip label="Muerte" value={gravedad.muerte} />
      </Grid>
      <Grid item xs={6} sm={4} md={3}>
        <SiNoChip label="Riesgo de vida" value={gravedad.riesgoVida} />
      </Grid>
      <Grid item xs={6} sm={4} md={3}>
        <SiNoChip label="Hospitalización" value={gravedad.hospitalizacion} />
      </Grid>
      <Grid item xs={6} sm={4} md={3}>
        <SiNoChip label="Discapacidad" value={gravedad.discapacidad} />
      </Grid>
      <Grid item xs={6} sm={4} md={3}>
        <SiNoChip label="Anomalía congénita" value={gravedad.anomaliaCongenita} />
      </Grid>
      <Grid item xs={6} sm={4} md={3}>
        <SiNoChip label="Aborto" value={gravedad.aborto} />
      </Grid>
      <Grid item xs={6} sm={4} md={3}>
        <SiNoChip label="Muerte fetal" value={gravedad.muerteFetal} />
      </Grid>
      <Grid item xs={6} sm={4} md={3}>
        <SiNoChip label="Evento de especial preocupación" value={gravedad.parteEventosPreocupacion} />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Evento nuevo y egreso
        </Typography>
      </Grid>
      <Grid item xs={6} sm={4} md={3}>
        <SiNoChip label="¿Es un evento nuevo?" value={gravedad.sonEventosNuevos} />
      </Grid>
      <Grid item xs={12} sm={8} md={9}>
        <FieldRow label="Descripción del evento nuevo" value={gravedad.descripcionEventoNuevo} />
      </Grid>
      <Grid item xs={12}>
        <FieldRow label="Condición al egreso" value={gravedad.condicionEgreso} />
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
              label="Paciente"
              {...a11yProps(1)}
            />
            <Tab
              icon={<VaccinesIcon />}
              iconPosition="start"
              label="Vacunación"
              {...a11yProps(2)}
            />
            <Tab
              icon={<LocalHospitalIcon />}
              iconPosition="start"
              label="ESAVI"
              {...a11yProps(3)}
            />
            <Tab
              icon={<FactCheckIcon />}
              iconPosition="start"
              label="Desenlace"
              {...a11yProps(4)}
            />
            <Tab
              icon={<WarningAmberIcon />}
              iconPosition="start"
              label="Gravedad"
              {...a11yProps(5)}
            />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <TabNotificacion />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <TabPaciente />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <TabVacunacion />
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
          <TabEsavi />
        </TabPanel>
        <TabPanel value={currentTab} index={4}>
          <TabDesenlace />
        </TabPanel>
        <TabPanel value={currentTab} index={5}>
          <TabGravedad />
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
