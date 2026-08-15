import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import VaccinesIcon from "@mui/icons-material/Vaccines"
import { Box, Button, Chip, Typography } from "@mui/material"
import { useState } from "react"
import {
  Datagrid,
  FilterForm,
  FunctionField,
  List,
  SelectInput,
  TextInput,
  useListContext,
} from "react-admin"
import { PanelHeader } from "../../components/PanelTabla"
import { RegenerarDatamartButton } from "../../components/SyncActions"
import { useEsAdmin } from "../../authorization.utils"
import { LAYOUT } from "../../theme"
import BulkDialog from "./BulkDialog"

const origenChoices = [
  { id: "VIGIFLOW", name: "VigiFlow" },
  { id: "DHIS2", name: "DHIS2" },
]

const gravedadChoices = [
  { id: "1", name: "Grave" },
  { id: "0", name: "No grave" },
]

const postFilters = [
  <SelectInput
    label="Origen"
    source="origen"
    choices={origenChoices}
    alwaysOn
    emptyText="Todos"
    emptyValue=""
  />,
  <SelectInput
    label="Gravedad"
    source="gravedad"
    choices={gravedadChoices}
    alwaysOn
    emptyText="Todas"
    emptyValue=""
  />,
  <TextInput label="Identificación" source="identificacion" alwaysOn />,
  <TextInput label="Código Origen" source="codigoOrigenNotificacion" alwaysOn />,
]

// La composición de la banda vive en <PanelHeader>; aquí sólo se elige qué va en cada
// ranura. El estilo (paddings, avatar, tipografía, botones) lo pone el tema.
const ESAVISListHeader = () => {
  const { total, isLoading } = useListContext()
  const [open, setOpen] = useState(false)
  const esAdmin = useEsAdmin()
  return (
    <>
      <PanelHeader
        icono={<VaccinesIcon fontSize="small" />}
        titulo="ESAVIS"
        subtitulo={
          isLoading ? "Cargando..." : `${total ?? 0} registro${total === 1 ? "" : "s"}`
        }
        acciones={
          <>
            <RegenerarDatamartButton />
            {/*
              Importar trae notificaciones desde VigiFlow o DHIS2 y las escribe en
              TR_NOTIFICACION; un perfil de sólo análisis no debe verlo. `false` esconde el
              botón mientras `usePermissions` resuelve, para que no asome y desaparezca.
            */}
            {esAdmin && (
              <Button variant="contained" onClick={() => setOpen(true)}>
                Importar datos
              </Button>
            )}
          </>
        }>
        <FilterForm filters={postFilters} />
      </PanelHeader>
      <BulkDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}

const ocultarInformacion = (texto: string) => {
  if (!texto) return "—"
  const mitad = Math.floor(texto.length / 2)
  return texto.substring(0, mitad) + "****"
}

const formatFecha = (valor?: string | null) => {
  if (!valor) return "—"
  // Estas fechas se guardan como "solo fecha" a medianoche UTC (ver formatoFecha en el
  // backend); forzar timeZone: "UTC" evita que se corran un día en husos negativos (ej. Ecuador).
  return new Date(valor).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  })
}

// El marco de la lista y la tipografía de los encabezados ahora salen del tema
// (RaList / MuiTableCell), así que aquí no queda ningún sx de estilo.
export const ESAVISList = () => {
  return (
    <Box p={LAYOUT.paddingPagina}>
      <List actions={false} empty={false} storeKey={false}>
        <ESAVISListHeader />
        <Datagrid bulkActionButtons={false} rowClick="show">
          {/* ── ID ── */}
          <FunctionField
            label="Id"
            render={(record: any) => (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <ContentCopyIcon
                  color="primary"
                  sx={{ fontSize: 14, cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(record.id)
                  }}
                />
                <Typography variant="caption" title={record.id}>
                  {record.id?.slice(0, 8)}…
                </Typography>
              </Box>
            )}
          />

          {/* ── Origen + Código ── */}
          <FunctionField
            label="Origen"
            render={(record: any) => record.origen ?? "—"}
          />
          <FunctionField
            label="Código Origen"
            render={(record: any) => record.codigoOrigenNotificacion ?? "—"}
          />

          {/* ── Fecha Notificación ── */}
          <FunctionField
            label="Fecha Notificación"
            render={(record: any) => formatFecha(record.fechaNotificacion)}
          />

          {/* ── Paciente (columna combinada) ── */}
          <FunctionField
            label="Paciente"
            render={(record: any) => {
              const p = record.paciente ?? {}
              const nombreCompleto =
                [p.nombre, p.apellidos].filter(Boolean).join(" ") ||
                p.inicialesNombre ||
                "—"
              const identificacion = ocultarInformacion(p.identificacion)
              const fechaNac = formatFecha(p.fechaNacimiento)
              const sexo = p.sexo?.nombre ?? "—"

              return (
                <Box sx={{ lineHeight: 1.6 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {nombreCompleto}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {identificacion} · {sexo}
                  </Typography>
                </Box>
              )
            }}
          />

          {/* ── Grave ── */}
          <FunctionField
            label="Grave"
            render={(record: any) => {
              const gravedad = record.gravedadEsavi?.[0]
              if (!gravedad) return <Typography variant="caption">—</Typography>
              const esGrave = gravedad.tipo === "1"
              return (
                <Chip
                  label={esGrave ? "Grave" : "No grave"}
                  size="small"
                  color={esGrave ? "error" : "default"}
                />
              )
            }}
          />
        </Datagrid>
      </List>
    </Box>
  )
}
