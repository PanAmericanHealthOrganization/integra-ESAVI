import { Datagrid, List, TextField } from "react-admin"

export const CatalogosList = () => {
  return (
    <List title="Catálogos" exporter={false} actions={false} empty={false}>
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="nombre" label="Nombre" />
        <TextField source="descripcion" label="Descripción" />
      </Datagrid>
    </List>
  )
}
