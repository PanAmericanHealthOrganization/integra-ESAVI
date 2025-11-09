import { Divider, Grid } from "@mui/material"
import { RichTextInput } from "ra-input-rich-text"
import { DateInput, Edit, ImageField, SimpleForm, TextInput } from "react-admin"

export const GacetaEdit = () => {
  return (
    <Edit mutationMode="undoable" redirect={false} resource="gaceta">
      <SimpleForm>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12}>
            <h3>Datos generales:</h3>
          </Grid>
          <Grid item xs={12} sm={3}>
            <DateInput source="fechaPublicacion" label="Fecha de Publicación" />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextInput source="estado" label="Estado" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextInput source="titulo" label="Título" />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextInput source="numeroGaceta" label="Número de Gaceta" />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextInput source="volumen" label="Volumen" />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextInput source="anio" label="Año" />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextInput source="mes" label="Mes" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextInput source="urlGaceta" label="URL de Gaceta" readOnly />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextInput source="autor" label="Autor" />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextInput source="cargo" label="Cargo" />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextInput source="autorSecundario" label="Autor Secundario" />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextInput source="cargoSecundario" label="Cargo Secundario" />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12} sm={12}>
            <h3>Resumen Ejecutivo</h3>
          </Grid>
          <Grid item xs={12} sm={12}>
            <RichTextInput fullWidth source="resumenContenido" label={false} />
          </Grid>

          <Grid item xs={12} sm={12}>
            <h3>Analisis Graficos</h3>
          </Grid>
          <Grid item xs={12} sm={3}>
            <ImageField
              source="graficoAnalisisGravedad"
              title="Análisis Gráfico"
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <RichTextInput
              source="analisisGravedad"
              label="Análisis de Gravedad"
            />
          </Grid>
          <Grid item xs={12} sm={12}>
            <RichTextInput
              source="analisisSexoEdad"
              label="Análisis de Sexo y Edad"
            />
          </Grid>
          <Grid item xs={12} sm={12}>
            <RichTextInput
              source="analisisTipoEvento"
              label="Análisis de Tipo de Evento"
            />
          </Grid>

          <Grid item xs={12} sm={12}>
            <RichTextInput
              source="analisisGeografico"
              label="Análisis Geográfico"
            />
          </Grid>
          <Grid item xs={12} sm={12}>
            <RichTextInput source="conclusiones" label="Conclusiones" />
          </Grid>
          <Grid item xs={12} sm={12}>
            <RichTextInput source="recomendaciones" label="Recomendaciones" />
          </Grid>
        </Grid>
      </SimpleForm>
    </Edit>
  )
}
