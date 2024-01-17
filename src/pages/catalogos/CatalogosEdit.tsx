import { Update } from '@mui/icons-material';
import Stack from '@mui/material/Stack';
import { Form, NumberInput, SaveButton, TextInput, useUpdate } from 'react-admin';

export const CatalogosUpdate = () => {
	const [update] = useUpdate();
	const postSave = (data: any) => {
		update('put', { data });
	};
	return (
		<Update>
			<Form onSubmit={postSave}>
				<Stack>
					<TextInput source="title" />
					<NumberInput source="nb_views" />
					<SaveButton />
				</Stack>
			</Form>
		</Update>
	);
};
