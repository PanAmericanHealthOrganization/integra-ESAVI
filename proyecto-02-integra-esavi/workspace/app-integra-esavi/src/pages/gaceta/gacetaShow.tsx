import { DateField, Show, SimpleShowLayout, TextField } from "react-admin"

export const GacetaShow = () => {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="fechaPublicacion" label="Fecha de Publicación" />
        <TextField source="anio" label="Año" />
        <TextField source="mes" label="Mes" />
        <TextField source="estado" label="Estado" />
        <DateField source="urlGaceta" label="Descarga" />
      </SimpleShowLayout>
    </Show>
  )
}
