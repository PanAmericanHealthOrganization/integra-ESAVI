import { Edit, required, SimpleForm, TextInput } from "react-admin";

export const ESAVISEdit = () => (
	<Edit>
		<SimpleForm>
			<TextInput source="casoesaviId" validate={[required()]} fullWidth />
			<TextInput source="casoesaviId" multiline={true} label="Caso esavi" />
			<TextInput source="edad" multiline={true} label="edad" />
		</SimpleForm>
	</Edit>
);
