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

const GeneroFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="q" label="Buscar" alwaysOn />
  </Filter>
)

const GeneroListActions = () => (
  <TopToolbar>
    <CreateButton label="Nuevo Género" />
  </TopToolbar>
)

export const GeneroList = () => (
  <List
    title="Catálogo de Géneros"
    filters={<GeneroFilter />}
    actions={<GeneroListActions />}
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
