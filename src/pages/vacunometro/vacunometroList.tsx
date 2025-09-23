import { endOfMonth, startOfDay } from "date-fns"
import { useState } from "react"
import {
  Datagrid,
  DateField,
  List,
  SearchInput,
  TextField,
  TopToolbar,
} from "react-admin"
import { SyncVacunometroDialog } from "./forms/sinc-vacunometro-dlg"
const defaultValues = {
  desde: startOfDay(new Date()),
  hasta: endOfMonth(new Date()),
}
export const VacunometroFilters = [
  <SearchInput source="unicode" alwaysOn />,
  <SearchInput source="nombreVacuna" />,
  <SearchInput source="sexo" />,
]

const VacunometroList = () => {
  const [open, setOpen] = useState<boolean>(false)

  const ListActions = () => (
    <TopToolbar>
      <SyncVacunometroDialog open={open} setOpen={setOpen} />
    </TopToolbar>
  )
  return (
    <>
      <List actions={<ListActions />} perPage={25} empty={false}>
        <Datagrid rowClick="edit" bulkActionButtons={false}>
          <TextField source="unicode" />
          <TextField source="nombreVacuna" />
          <DateField source="fechaAplicacion" />
          <TextField source="sexo" />
          <TextField source="total" />
        </Datagrid>
      </List>
    </>
  )
}

export default VacunometroList
