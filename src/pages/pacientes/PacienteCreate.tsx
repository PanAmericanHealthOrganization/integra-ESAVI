import { Create, required, SimpleForm, TextInput } from 'react-admin';

export const PacienteCreate = () => (
	<Create>
		<SimpleForm>
			<TextInput source="casoesaviId" validate={[required()]} fullWidth />
			<TextInput source="casoesaviId" multiline={true} label="Caso esavi" />
			<TextInput source="edad" multiline={true} label="Edad" />
			{/* <RichTextInput source="body" /> */}
			{/* <DateInput label="Publication date" source="published_at" defaultValue={new Date()} /> */}
		</SimpleForm>
	</Create>
);
