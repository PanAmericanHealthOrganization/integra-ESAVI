import { useState } from "react"
import {
  CreateButton,
  Datagrid,
  FilterButton,
  List,
  TextField,
  TextInput,
  TopToolbar,
} from "react-admin"
import { SyncVacunometroDialog } from "./forms/sinc-vacunometro-dlg"

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
      <FilterButton />
      <CreateButton />
    </TopToolbar>
  )
  return (
    <List filters={VacunometroFilters} actions={<ListActions />}>
      <Datagrid>
        <TextField source="id" />
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
  )
}

export default VacunometroList
