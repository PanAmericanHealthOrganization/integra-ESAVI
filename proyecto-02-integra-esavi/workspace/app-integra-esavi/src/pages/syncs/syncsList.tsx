import SyncIcon from "@mui/icons-material/Sync"
import { Box } from "@mui/material"
import {
  Datagrid,
  DateField,
  FilterForm,
  List,
  SelectInput,
  TextField,
  TextInput,
  useListContext,
} from "react-admin"
import { PanelHeader } from "../../components/PanelTabla"
import { LAYOUT } from "../../theme"

// Deben coincidir con el enum SyncSource del API.
const sourceChoices = [
  { id: "MEDDRA", name: "MedDRA" },
  { id: "WHODRUG", name: "WHODrug" },
  { id: "DATAMART", name: "Datamart" },
  { id: "VACUNOMETRO", name: "Vacunómetro" },
  { id: "DHIS2", name: "DHIS2" },
  { id: "VIGIFLOW", name: "VigiFlow" },
  { id: "SEED", name: "Seed" },
]

const statusChoices = [
  { id: "RUNNING", name: "En proceso" },
  { id: "COMPLETED", name: "Completado" },
  { id: "FAILED", name: "Error" },
]

const syncFilters = [
  <SelectInput source="source" alwaysOn label="Fuente" choices={sourceChoices} />,
  <SelectInput source="status" alwaysOn label="Estado" choices={statusChoices} />,
  <TextInput source="startTime" alwaysOn label="Fecha de procesamiento" />,
  <TextInput source="errorMessage" label="Mensaje de error" />,
  <TextInput source="name" label="Nombre" />,
]

const SyncsListHeader = () => {
  const { total, isLoading } = useListContext()
  return (
    <PanelHeader
      icono={<SyncIcon fontSize="small" />}
      titulo="Sincronizaciones"
      subtitulo={isLoading ? "Cargando..." : `${total ?? 0} proceso${total === 1 ? "" : "s"}`}>
      <FilterForm filters={syncFilters} />
    </PanelHeader>
  )
}

export const SyncsList = () => {
  return (
    <Box p={LAYOUT.paddingPagina}>
    <List actions={false}>
      <SyncsListHeader />
      <Datagrid
        rowClick="show"
        bulkActionButtons={false}
        sx={{
          "& .RaDatagrid-table": {
            tableLayout: "fixed",
            width: "100%",
          },
          "& .MuiTableCell-root": {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
          "& .column-source": { width: "10%" },
          "& .column-name": { width: "16%" },
          "& .column-status": { width: "10%" },
          "& .column-startTime": { width: "13%" },
          "& .column-endTime": { width: "13%" },
          "& .column-message": { width: "22%" },
          "& .column-errorMessage": { width: "16%" },
        }}>
        <TextField source="source" label="Fuente" />
        <TextField source="name" />
        <TextField source="status" />
        <DateField
          source="startTime"
          options={{
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }}
          locales="sv-SE"
        />
        <DateField
          source="endTime"
          options={{
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }}
          locales="sv-SE"
        />
        <TextField source="message" label="Resultado" />
        <TextField source="errorMessage" label="Mensaje de error" />
      </Datagrid>
    </List>
    </Box>
  )
}
