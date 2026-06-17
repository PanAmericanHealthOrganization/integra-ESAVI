import { Grid } from "@mui/material"
import { Edit, required, SimpleForm, TextInput, maxLength } from "react-admin"

export const GeneroEdit = () => (
  <Edit title="Editar Género" mutationMode="pessimistic" redirect="list">
    <SimpleForm>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <TextInput
            source="codigo"
            label="Código"
            validate={[required(), maxLength(10)]}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={5}>
          <TextInput
            source="nombre"
            label="Nombre"
            validate={[required(), maxLength(100)]}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextInput
            source="descripcion"
            label="Descripción"
            validate={[maxLength(255)]}
            fullWidth
            multiline
            rows={2}
          />
        </Grid>
      </Grid>
    </SimpleForm>
  </Edit>
)
