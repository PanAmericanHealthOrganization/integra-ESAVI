import { Datagrid, DeleteButton, EditButton, List, TextField } from 'react-admin';

export const PacienteList = () => (
	<List>
		<Datagrid>
			<TextField source="casoesaviId" />
			<TextField source="edad" />
			<EditButton />
			<DeleteButton />
		</Datagrid>
	</List>
);
