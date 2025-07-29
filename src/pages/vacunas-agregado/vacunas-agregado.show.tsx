import { Show, SimpleShowLayout, TextField } from "react-admin"

export const VacunasAgregadoShow = () => {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="id" />
        <TextField source="name" />
      </SimpleShowLayout>
    </Show>
  )
}
