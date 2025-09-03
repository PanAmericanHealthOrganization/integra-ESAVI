import { Show, TextField } from "react-admin"

const VacunometroShow = () => {
  return (
    <>
      <Show>
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
      </Show>
    </>
  )
}

export default VacunometroShow
