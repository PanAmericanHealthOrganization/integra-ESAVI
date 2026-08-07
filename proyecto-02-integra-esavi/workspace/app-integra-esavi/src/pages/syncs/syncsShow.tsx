import { FunctionField, Show, SimpleShowLayout, TextField } from "react-admin"

export const SyncsShow = () => {
  return (
    <>
      <Show>
        <SimpleShowLayout>
          <TextField source="id" />
          <TextField source="source" label="Fuente" />
          <TextField source="name" />
          <TextField source="status" />
          <TextField source="startTime" />
          <TextField source="endTime" />
          <TextField source="message" label="Resultado" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} />
          <TextField source="errorMessage" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} />
          <TextField source="errorStack" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} />
          <FunctionField
            label="Metadatos"
            render={(record: any) =>
              record.metadata ? (
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {JSON.stringify(record.metadata, null, 2)}
                </pre>
              ) : (
                "—"
              )
            }
          />
        </SimpleShowLayout>
      </Show>
    </>
  )
}
