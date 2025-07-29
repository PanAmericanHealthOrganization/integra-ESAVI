import { Create, SimpleForm, TextInput } from "react-admin"

export const VacunasAgregadoCreate = () => {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="name" />
      </SimpleForm>
    </Create>
  )
}
