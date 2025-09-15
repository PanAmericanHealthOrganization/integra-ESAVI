import React from "react"
import {
  CreateButton,
  Datagrid,
  List,
  TextField,
  TopToolbar,
} from "react-admin"

const ListActions = () => (
  <TopToolbar>
    <CreateButton />
  </TopToolbar>
)

export class SyncsList extends React.Component {
  render() {
    return (
      <List actions={<ListActions />} {...this.props}>
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
