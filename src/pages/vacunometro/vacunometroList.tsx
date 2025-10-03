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
      <List actions={<ListActions />}>
        <Datagrid rowClick="edit" bulkActionButtons={false}>
          <DateField
            locales={"sv-SE"}
            source="fechaAplicacion"
            options={{ year: "numeric", month: "2-digit", day: "2-digit" }}
            label="Fecha de Aplicación"
          />
          <TextField source="unicode" />
          <TextField source="sexo" />
          <TextField source="nombreVacuna" />
          <TextField source="total" />
        </Datagrid>
      </List>
    </>
  )
}

export default VacunometroList
