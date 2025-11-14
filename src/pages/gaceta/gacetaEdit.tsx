import { Divider, Grid, Typography } from "@mui/material"
import { RichTextInput } from "ra-input-rich-text"
import {
  DateInput,
  Edit,
  SelectInput,
  SimpleForm,
  TextInput,
} from "react-admin"
import { ESTADO_GACETA } from "../../dataProviders/enums/estado_gaceta.enum"
import { ImageFieldWithZoom } from "../../components/ImageFieldWithZoom"

export const GacetaEdit = () => {
  return (
    <Edit
      mutationMode="undoable"
      redirect={false}
      resource="gaceta"
      delete={false}>
      <SimpleForm>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12}>
            <h3>Datos generales:</h3>
          </Grid>
          <Grid item xs={12} sm={3}>
            <DateInput
              source="fechaPublicacion"
              label="Fecha de Publicación"
              readOnly
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <SelectInput
              source="estado"
              label="Estado"
              choices={[
                { id: ESTADO_GACETA.BORRADOR, name: "Borrador" },
                { id: ESTADO_GACETA.PENDIENTE, name: "Pendiente" },
                { id: ESTADO_GACETA.PUBLICADO, name: "Publicado" },
                { id: ESTADO_GACETA.CANCELADO, name: "Cancelado" },
              ]}
            />
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
            <DateInput source="desde" label="desde" readOnly />
          </Grid>
          <Grid item xs={12} sm={2}>
            <DateInput source="hasta" label="hasta" readOnly />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextInput source="urlGaceta" label="URL de Gaceta" readOnly />
          </Grid>
          <Grid item xs={12} sm={12}>
            <h3>Autores:</h3>
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
            <Typography variant="h4" sx={{ textDecoration: "underline" }}>
              Introducción
            </Typography>
          </Grid>
          <Grid item xs={12} sm={12}>
            <h3>Resumen Ejecutivo</h3>
          </Grid>
          <Grid item xs={12} sm={12}>
            <RichTextInput fullWidth source="resumenContenido" label={false} />
          </Grid>

          <Grid item xs={12} sm={12}>
            <Typography variant="h4" sx={{ textDecoration: "underline" }}>
              Resultados
            </Typography>
          </Grid>
          <Grid item xs={12} sm={12}>
            <h3>Distribución por Edad y Sexo Gráficos</h3>
          </Grid>
          <Grid item xs={12} sm={3}>
            <ImageFieldWithZoom
              source="piramideEdadSexo"
              title="Piramide de Edad y Sexo"
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <RichTextInput
              source="analisisSexoEdad"
              label="Análisis de Sexo y Edad"
            />
          </Grid>
          <Grid item xs={12} sm={12}>
            <h3>Distribución Geográfica</h3>
          </Grid>
          <Grid item xs={12} sm={12}>
            <h3>Caracterización por Tipo de Vacuna</h3>
          </Grid>
          <Grid item xs={12} sm={12}>
            <h3>Análisis Temporal</h3>
          </Grid>
          <Grid item xs={12} sm={12}>
            <Typography variant="h4" sx={{ textDecoration: "underline" }}>
              Conclusiones y Recomendaciones
            </Typography>
          </Grid>
          <Grid item xs={12} sm={12}>
            <RichTextInput source="conclusiones" label="Conclusiones" />
          </Grid>
          <Grid item xs={12} sm={12}>
            <RichTextInput source="recomendaciones" label="Recomendaciones" />
          </Grid>
        </Grid>{" "}
      </SimpleForm>
    </Edit>
  )
}
