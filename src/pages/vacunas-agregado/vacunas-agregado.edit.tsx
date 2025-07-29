import { Edit, SimpleForm, TextInput } from "react-admin"

export const VacunasAgregadoUpdate = () => {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="name" />
      </SimpleForm>
    </Edit>
  )
}
