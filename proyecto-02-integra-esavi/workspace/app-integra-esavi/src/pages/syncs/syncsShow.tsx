import { Show, SimpleShowLayout, TextField } from "react-admin"

export const SyncsShow = () => {
  return (
    <>
      <Show>
        <SimpleShowLayout>
          <TextField source="id" />
          <TextField source="name" />
          <TextField source="status" />
          <TextField source="startTime" />
          <TextField source="endTime" />
          <TextField source="errorMessage" />
          <TextField source="errorStack" />
          <TextField source="errorTrace" />
        </SimpleShowLayout>
      </Show>
    </>
  )
}
