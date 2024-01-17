import Stack from '@mui/material/Stack';
import { Create, Form, NumberInput, SaveButton, TextInput, useCreate } from 'react-admin';

export const VacunadosCreate = () => {
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
					<SaveButton />
				</Stack>
			</Form>
		</Create>
	);
};
