import Stack from '@mui/material/Stack';
import { useContext } from 'react';
import { Create, Form, NumberInput, SaveButton, TextInput, useCreate } from 'react-admin';

export const CatalogosCreate = () => {
	const [create] = useCreate();

	const postSave = (data: any) => {
		create('posts', { data });
	};
	return (
		<Create>
			<Form onSubmit={postSave}>
				<Stack>
					<TextInput source="title" />
					<NumberInput source="nb_views" />
					<NumberInput source="totales" />
					<SaveButton />
				</Stack>
			</Form>
		</Create>
	);
};
