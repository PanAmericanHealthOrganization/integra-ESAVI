import { Create, required, SimpleForm, TextInput } from 'react-admin';

export const ESAVISCreate = () => (
	<Create>
		<SimpleForm>
			<TextInput source="casoesaviId" validate={[required()]} fullWidth />
			<TextInput source="casoesaviId" multiline={true} label="Caso esavi" />
			<TextInput source="edad" multiline={true} label="Edad" />
		</SimpleForm>
	</Create>
);
