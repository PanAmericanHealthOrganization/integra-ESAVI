import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import {Box,Button,Card,Chip,Typography} from "@mui/material"
import {useState} from "react"
import {
  Datagrid,
  ExportButton,
  FunctionField,
  List,
  SelectInput,
  TextInput,
  TopToolbar,
} from "react-admin"
import BulkDialog from "./BulkDialog"

const origenChoices = [
  { id: "VIGIFLOW", name: "VigiFlow" },
  { id: "DHIS2", name: "DHIS2" },
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
  <TextInput label="Identificación" source="identificacion" alwaysOn />,
  <TextInput label="Código Origen" source="codigoOrigenNotificacion" alwaysOn />,
]

const ListActions = () => {
  const [open, setOpen] = useState(false)
  return (
    <TopToolbar>
      <ExportButton label="CSV" />
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpen(true)}
        style={{ marginLeft: "10px" }}>
        Importar datos
      </Button>
      <BulkDialog open={open} onClose={() => setOpen(false)} />
    </TopToolbar>
  )
}

const ocultarInformacion = (texto: string) => {
  if (!texto) return "—"
  const mitad = Math.floor(texto.length / 2)
  return texto.substring(0, mitad) + "****"
}

const formatFecha = (valor?: string | null) => {
  if (!valor) return "—"
  return new Date(valor).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export const ESAVISList = () => {
  return (
    <Card variant="outlined" sx={{ padding: "10px" }}>
      <List actions={<ListActions />} filters={postFilters} empty={false}>
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
              const sexo =
                p.sexo?.vigiflow ?? p.sexo?.dhis2 ?? p.sexo?.homologada ?? "—"

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
    </Card>
  )
}
