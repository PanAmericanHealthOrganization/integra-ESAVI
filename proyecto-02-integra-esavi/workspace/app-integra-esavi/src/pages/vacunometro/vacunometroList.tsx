import VaccinesIcon from "@mui/icons-material/Vaccines"
import { Box } from "@mui/material"
import { useState } from "react"
import {
  Datagrid,
  DateField,
  FilterForm,
  FunctionField,
  List,
  SearchInput,
  TextField,
  useListContext,
} from "react-admin"
import { PanelHeader } from "../../components/PanelTabla"
import { GRUPO_ETARIO_OPTIONS } from "../../dataProviders/grupoEtario.provider"
import { LAYOUT } from "../../theme"
import { SyncVacunometroDialog } from "./forms/sinc-vacunometro-dlg"
import { SimularVacunacionDialog } from "./forms/simular-vacunacion-dlg"

// `alwaysOn` en todos: antes vivían detrás de un <FilterButton> del TopToolbar, que era
// justo lo que hacía que esta pantalla no se pareciera al resto.
const VacunometroFilters = [
  <SearchInput source="unicodigo" alwaysOn placeholder="Unicodigo" />,
  <SearchInput source="fechaAplicacion" alwaysOn placeholder="Fecha de Aplicación" />,
  <SearchInput source="nombreVacuna" alwaysOn placeholder="Nombre de Vacuna" />,
  <SearchInput source="sexo" alwaysOn placeholder="Sexo" />,
]

const VacunometroListHeader = () => {
  const { total, isLoading } = useListContext()
  const [open, setOpen] = useState(false)
  const [openSimular, setOpenSimular] = useState(false)

  return (
    <PanelHeader
      icono={<VaccinesIcon fontSize="small" />}
      titulo="Vacunómetro"
      subtitulo={isLoading ? "Cargando..." : `${total ?? 0} registro${total === 1 ? "" : "s"}`}
      acciones={
        <>
          <SimularVacunacionDialog open={openSimular} setOpen={setOpenSimular} />
          <SyncVacunometroDialog open={open} setOpen={setOpen} />
        </>
      }>
      <FilterForm filters={VacunometroFilters} />
    </PanelHeader>
  )
}

const VacunometroList = () => (
  <Box p={LAYOUT.paddingPagina}>
    <List actions={false} perPage={25} empty={false} storeKey={false}>
      <VacunometroListHeader />
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <DateField
          locales={"sv-SE"}
          source="fechaAplicacion"
          options={{ year: "numeric", month: "2-digit", day: "2-digit" }}
          label="Fecha de Aplicación"
        />
        <TextField source="unicodigo" label="Establecimiento" />
        <FunctionField
          label="Grupo Etario"
          render={(record) => {
            const grupo = GRUPO_ETARIO_OPTIONS.find((ge) => ge.id === record.grupoEtario)
            return grupo?.label.toUpperCase() || ""
          }}
        />
        <TextField source="totalHombres" label="Tot. Hombres" />
        <TextField source="totalMujeres" label="Tot. Mujeres" />
        <TextField source="total" label="Total" />
        <TextField source="nombreVacuna" label="Vacuna" />
      </Datagrid>
    </List>
  </Box>
)

export default VacunometroList
