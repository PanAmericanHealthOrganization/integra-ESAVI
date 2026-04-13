import { useState } from "react"
import {
  Datagrid,
  DateField,
  FilterButton,
  FunctionField,
  List,
  SearchInput,
  TextField,
  TopToolbar,
} from "react-admin"
import { GRUPO_ETARIO_OPTIONS } from "../../dataProviders/grupoEtario.provider"
import { SyncVacunometroDialog } from "./forms/sinc-vacunometro-dlg"

const VacunometroFilters = [
  <SearchInput source="unicodigo" alwaysOn placeholder="Unicodigo" />,
  <SearchInput source="fechaAplicacion" placeholder="Fecha de Aplicación" />,
  <SearchInput source="nombreVacuna" placeholder="Nombre de Vacuna" />,
  <SearchInput source="sexo" placeholder="Sexo" />,
]

const VacunometroList = () => {
  const [open, setOpen] = useState<boolean>(false)

  const ListActions = () => (
    <TopToolbar>
      <FilterButton />
      <SyncVacunometroDialog open={open} setOpen={setOpen} />
    </TopToolbar>
  )
  return (
    <>
      <List actions={<ListActions />} filters={VacunometroFilters} perPage={25}>
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
              const grupo = GRUPO_ETARIO_OPTIONS.find(
                (ge) => ge.id === record.grupoEtario
              )
              return grupo?.label.toUpperCase() || ""
            }}
          />
          <TextField source="totalHombres" label="Tot. Hombres" />
          <TextField source="totalMujeres" label="Tot. Mujeres" />
          <TextField source="total" label="Total" />
          <TextField source="nombreVacuna" label="Vacuna" />
        </Datagrid>
      </List>
    </>
  )
}

export default VacunometroList
