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
          <TextField source="errorMessage" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} />
          <TextField source="errorStack" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} />
          <TextField source="errorTrace" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} />
        </SimpleShowLayout>
      </Show>
    </>
  )
}
