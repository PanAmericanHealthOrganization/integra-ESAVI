import React from "react"
import { Datagrid, List, TextField } from "react-admin"

export class SyncsList extends React.Component {
  render() {
    return (
      <List>
        <Datagrid>
          <TextField source="id" />
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
}
