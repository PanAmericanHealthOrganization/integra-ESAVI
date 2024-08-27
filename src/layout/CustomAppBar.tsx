import {
	AppBar,
	LoadingIndicator,
} from 'react-admin';
import ImportButton from './ImportButton';

export const CustomAppBar = () => (
	<AppBar toolbar={
		<>
			<ImportButton />
			<LoadingIndicator />
		</>
	} />
);