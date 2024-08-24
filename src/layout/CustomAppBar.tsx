import { AppBar, AppBarProps } from 'react-admin';
import Typography from '@mui/material/Typography';

export const CustomAppBar = (props: AppBarProps) => (
	<AppBar
		sx={{
			'& .RaAppBar-title': {
				flex: 1,
				textOverflow: 'ellipsis',
				whiteSpace: 'nowrap',
				overflow: 'hidden'
			}
		}}
		{...props}
	>
		<Typography variant="h6" color="inherit" id="react-admin-title" />
		<span />
	</AppBar>
);
