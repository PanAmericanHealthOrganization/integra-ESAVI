import { Datagrid, List, TextField, TopToolbar } from "react-admin"

const ListActions = () => <TopToolbar></TopToolbar>

export const SyncsList = () => {
  return (
    <List>
      <Datagrid>
        <TextField source="name" />
        <TextField source="status" />
        <TextField source="startTime" />
        <TextField source="endTime" />
        <TextField source="errorMessage" />
        <TextField source="errorStack" />
        <TextField source="errorTrace" />
      </Datagrid>
    </List>
  )
}
