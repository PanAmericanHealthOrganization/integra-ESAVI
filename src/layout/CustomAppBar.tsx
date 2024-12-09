import {
	AppBar,
	LoadingIndicator,
} from 'react-admin';
import ImportButton from './ImportButton';
import Authorize from '../authorization.utils';

export const CustomAppBar = () => (
	<AppBar toolbar={
		<>
			{/* <Authorize allowedRoles={['Administrador']} deniedRoles={['']}>
				<ImportButton />
			</Authorize> */}

			<ImportButton />
			<LoadingIndicator />
		</>
	} />
);