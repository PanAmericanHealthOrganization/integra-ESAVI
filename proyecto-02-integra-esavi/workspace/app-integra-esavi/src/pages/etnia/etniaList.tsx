import {
  CreateButton,
  Datagrid,
  DeleteWithConfirmButton,
  EditButton,
  Filter,
  FunctionField,
  List,
  TextField,
  TextInput,
  TopToolbar,
} from "react-admin"

const EtniaFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="q" label="Buscar" alwaysOn />
  </Filter>
)

const EtniaListActions = () => (
  <TopToolbar>
    <CreateButton label="Nueva Etnia" />
  </TopToolbar>
)

export const EtniaList = () => (
  <List
    title="Catálogo de Etnias"
    filters={<EtniaFilter />}
    actions={<EtniaListActions />}
    sort={{ field: "nombre", order: "ASC" }}>
    <Datagrid bulkActionButtons={false} rowClick={false}>
      <TextField source="codigo" label="Código" />
      <TextField source="nombre" label="Nombre" />
      <TextField source="descripcion" label="Descripción" />
      <FunctionField
        label="Acciones"
        render={() => (
          <>
            <EditButton label="Editar" />
            <DeleteWithConfirmButton
              label="Eliminar"
              title="¿Está seguro de eliminar el registro?"
              confirmContent="Esta acción no se puede deshacer."
            />
          </>
        )}
      />
    </Datagrid>
  </List>
)
