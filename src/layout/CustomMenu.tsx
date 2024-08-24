import PieChartIcon from '@mui/icons-material/PieChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import { Menu } from 'react-admin';

export const CustomMenu = () => (
	<Menu>
		<Menu.Item to="/dashboard" primaryText="Dashboard" leftIcon={<PieChartIcon />} />
		<Menu.Item to="/esavis" primaryText="ESAVIS" leftIcon={<VaccinesIcon />} />
		<Menu.Item to="/reportes" primaryText="Reportes" leftIcon={<TableChartIcon />} />
	</Menu>
);
