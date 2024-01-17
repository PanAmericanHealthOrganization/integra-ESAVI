import { Datagrid, List, TextField } from 'react-admin';

export const CatalogosList = () => {
	return (
		<List>
			<Datagrid>
				<TextField source="dhis2EventId" />
				<TextField source="title" />
				<TextField source="author" />
				<TextField source="year" />
			</Datagrid>
		</List>
	);
};
