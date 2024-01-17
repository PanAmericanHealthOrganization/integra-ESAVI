import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PeopleIcon from '@mui/icons-material/People';
import Grading from '@mui/icons-material/Grading';
import PieChartIcon from '@mui/icons-material/PieChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import { Menu } from 'react-admin';

export const CustomMenu = () => (
	<Menu>
		<Menu.Item to="/dashboard" primaryText="Dasboard" leftIcon={<PieChartIcon />} />
		<Menu.Item to="/esavis" primaryText="ESAVIS" leftIcon={<VaccinesIcon />} />
		<Menu.Item to="/reportes" primaryText="Reportes" leftIcon={<TableChartIcon />} />
		<Menu.Item to="/catalogos" primaryText="Catálogos" leftIcon={<LibraryBooksIcon />} />
		<Menu.Item to="/diccionarios" primaryText="Diccionario" leftIcon={<Grading />} />
		<Menu.Item to="/historial" primaryText="Historial" leftIcon={<PendingActionsIcon />} />
	</Menu>
);
