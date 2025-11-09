import { useDataProvider, useNotify } from "ra-core"
import {
  Datagrid,
  DeleteWithConfirmButton,
  EditButton,
  Filter,
  FunctionField,
  List,
  SelectInput,
  TextField,
} from "react-admin"

import DownloadIcon from "@mui/icons-material/Download"
import { IconButton } from "@mui/material"

const DownloadFileButton = ({ record }: { record: any }) => {
  const dataProvider = useDataProvider()
  const notify = useNotify()

  const handleDownload = async () => {
    try {
      const response = await dataProvider.getGacetaFile("gaceta", {
        anio: record.anio,
        mes: record.mes,
      })

      // La respuesta debería ser un blob
      const blob = response.data
      const url = window.URL.createObjectURL(blob)

      // Crear un enlace temporal para descargar el archivo
      const link = document.createElement("a")
      link.href = url
      link.download = `gaceta_${record.anio}_${String(record.mes).padStart(2, "0")}.pdf`
      document.body.appendChild(link)
      link.click()

      // Limpiar el enlace temporal
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      notify("Archivo descargado exitosamente", { type: "success" })
    } catch (error) {
      console.error("Error al descargar archivo:", error)
      notify("Error al descargar el archivo", { type: "error" })
    }
  }

  return (
    <IconButton onClick={handleDownload} title="Descargar archivo">
      <DownloadIcon />
    </IconButton>
  )
}

const GacetaFilter = (props: any) => {
  const currentYear = new Date().getFullYear()
  const yearChoices = []

  // Generar opciones de años desde el año actual hacia atrás hasta 2020
  for (let year = currentYear; year >= 2020; year--) {
    yearChoices.push({ id: year, name: year.toString() })
  }

  return (
    <Filter {...props}>
      <SelectInput source="anio" label="Año" choices={yearChoices} alwaysOn />
      <SelectInput
        source="mes"
        label="Mes"
        choices={[
          { id: 1, name: "Enero" },
          { id: 2, name: "Febrero" },
          { id: 3, name: "Marzo" },
          { id: 4, name: "Abril" },
          { id: 5, name: "Mayo" },
          { id: 6, name: "Junio" },
          { id: 7, name: "Julio" },
          { id: 8, name: "Agosto" },
          { id: 9, name: "Septiembre" },
          { id: 10, name: "Octubre" },
          { id: 11, name: "Noviembre" },
          { id: 12, name: "Diciembre" },
        ]}
        alwaysOn
      />
    </Filter>
  )
}

export const GacetaList = () => {
  const currentYear = new Date().getFullYear()

  return (
    <List
      title="Gacetas ESAVI Oficiales"
      filters={<GacetaFilter />}
      filterDefaultValues={{ anio: currentYear }}>
      <Datagrid bulkActionButtons={false} rowClick={false}>
        <TextField source="fechaPublicacion" label="Fecha de Publicación" />
        <TextField source="titulo" label="Título" />
        <TextField source="anio" label="Año" />
        <TextField source="mes" label="Mes" />
        <TextField source="estado" label="Estado" />
        <FunctionField
          label="Archivo"
          render={(record) => <DownloadFileButton record={record} />}
        />
        <FunctionField
          label="Acciones"
          render={(record) => (
            <>
              <EditButton label="Editar" />
              <DeleteWithConfirmButton
                label="Eliminar"
                title="Está seguro de eliminar el registro?"
                confirmContent="Esta acción no se puede deshacer."
              />
            </>
          )}
        />
      </Datagrid>
    </List>
  )
}
