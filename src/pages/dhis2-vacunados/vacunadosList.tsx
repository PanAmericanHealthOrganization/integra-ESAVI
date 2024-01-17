import { BooleanField, Datagrid, DateField, List, TextField } from 'react-admin';

export const VacunadosList = () => (
	<List>
		<Datagrid>
			<TextField source="id" />
			<TextField source="title" />
			<DateField source="published_at" />
			<TextField source="category" />
			<BooleanField source="commentable" />
		</Datagrid>
	</List>
);
