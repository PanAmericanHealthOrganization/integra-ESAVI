import { Datagrid, List, TextField, TextInput } from "react-admin"

export const VacunometroFilters = [
  <TextInput label="Unicode" source="unicode" />,
  <TextInput label="Nombre Vacuna" source="nombreVacuna" />,
  <TextInput label="Dosis Aplicada" source="fechaAplicacion" />,
]

const VacunometroList = () => {
  return (
    <List filters={VacunometroFilters}>
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
