import { Datagrid, DateField, List, TextField, TextInput } from "react-admin"

const syncFilters = [
  <TextInput source="status" alwaysOn label="Estado" />,
  <TextInput source="startTime" alwaysOn label="Fecha de procesamiento" />,
  <TextInput source="errorMessage" label="Mensaje de error" />,
  <TextInput source="name" label="Nombre" />,
]

export const SyncsList = () => {
  return (
    <List filters={syncFilters}>
      <Datagrid>
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
        <TextField source="errorMessage" />
        <TextField source="errorStack" />
        <TextField source="errorTrace" />
      </Datagrid>
    </List>
  )
}
