import { endOfMonth, startOfDay } from "date-fns"
import { useState } from "react"
import { Datagrid, List, TextField, TextInput, TopToolbar } from "react-admin"
import { SyncVacunometroDialog } from "./forms/sinc-vacunometro-dlg"
const defaultValues = {
  desde: startOfDay(new Date()),
  hasta: endOfMonth(new Date()),
}
export const VacunometroFilters = [
  <TextInput label="Unicode" source="unicode" />,
  <TextInput label="Nombre Vacuna" source="nombreVacuna" />,
  <TextInput label="Dosis Aplicada" source="fechaAplicacion" />,
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
      <List
        filters={VacunometroFilters}
        actions={<ListActions />}
        empty={false}>
        <Datagrid rowClick="edit" bulkActionButtons={false} optimized>
          <TextField source="unicode" />
          <TextField source="nombreVacuna" />
          <TextField source="dosisAplicada" />
          <TextField source="diaAplicacion" />
          <TextField source="mesAplicacion" />
          <TextField source="anioAplicacion" />
          <TextField source="fechaAplicacion" />
          <TextField source="sexo" />
          <TextField source="cantidad" />
        </Datagrid>
      </List>
    </>
  )
}

export default VacunometroList
