import { Datagrid, DateField, List, SelectInput, TextField, TextInput } from "react-admin"

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

export const SyncsList = () => {
  return (
    <List filters={syncFilters}>
      <Datagrid
        rowClick="show"
        sx={{
          tableLayout: "fixed",
          width: "100%",
          "& .MuiTableCell-root": {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
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
        <TextField source="errorMessage" />
      </Datagrid>
    </List>
  )
}
