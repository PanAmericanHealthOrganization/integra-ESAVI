import { List, Datagrid, TextField } from "react-admin"

export const VacunasAgregadoList = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["vacunas-agregado"],
    queryFn: () => VacunasAgregadoList(),
  })

  return (
    <List>
      <Datagrid>
        <TextField source="id" />
        <TextField source="name" />
      </Datagrid>
    </List>
  )
}
