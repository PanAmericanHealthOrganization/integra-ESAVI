import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import VaccinesIcon from "@mui/icons-material/Vaccines"
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material"
import { alpha, useTheme } from "@mui/material/styles"
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
import { RegenerarDatamartButton } from "../../components/SyncActions"
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

// Cabecera al estilo de las tablas de catálogos: banda con avatar + título +
// conteo y acción a la derecha, luego una fila de filtros y un divisor.
const ESAVISListHeader = () => {
  const theme = useTheme()
  const { total, isLoading } = useListContext()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Box
        px={2.5}
        py={2}
        display="flex"
        alignItems="center"
        gap={2}
        flexWrap="wrap"
        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
        <Box display="flex" alignItems="center" gap={1.5} sx={{ flexShrink: 0 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 34, height: 34 }}>
            <VaccinesIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              ESAVIS
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isLoading
                ? "Cargando..."
                : `${total ?? 0} registro${total === 1 ? "" : "s"}`}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            "& .RaFilterForm-form": { flexWrap: "wrap", alignItems: "center", gap: 1, pt: 0 },
            "& .MuiFormHelperText-root": { display: "none" },
          }}>
          <FilterForm filters={postFilters} />
        </Box>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
          <RegenerarDatamartButton />
          <Button
            variant="contained"
            size="small"
            onClick={() => setOpen(true)}
            sx={{ borderRadius: 5, px: 2, boxShadow: "none", "&:hover": { boxShadow: "none" } }}>
            Importar datos
          </Button>
        </Stack>
      </Box>

      <Divider />
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

// Estilos de tabla alineados con las tablas de catálogos: contenedor con borde
// redondeado sin sombra y encabezados de columna en mayúsculas, pequeños y grises.
const listSx = {
  "& .RaList-content": {
    borderRadius: 2,
    border: "1px solid",
    borderColor: "divider",
    boxShadow: "none",
    overflow: "hidden",
  },
  "& .RaDatagrid-headerCell": {
    bgcolor: "background.paper",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "text.secondary",
  },
}

export const ESAVISList = () => {
  return (
    <Box p={2}>
      <List
        actions={false}
        empty={false}
        storeKey={false}
        sx={listSx}>
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
