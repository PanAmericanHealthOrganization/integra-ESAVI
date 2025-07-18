import PieChartIcon from '@mui/icons-material/PieChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import InsightsIcon from '@mui/icons-material/Insights';
import AppsIcon from '@mui/icons-material/Apps';

import { Menu } from 'react-admin';
import Authorize from '../authorization.utils';




export const CustomMenu = () => (
    <Menu>
        {/* Dashboard: visible para todos */}
        <Authorize allowedRoles={['Administrador' , 'Analista de Información', 'Visualizador' , 'Invitado']} deniedRoles={['']}>
            <Menu.Item to="/dashboard" primaryText="Dashboard" leftIcon={<PieChartIcon />} />
        </Authorize>

        <Authorize allowedRoles={['Administrador' , 'Analista de Información']} deniedRoles={['']}>
            <Menu.Item to="/analisis" primaryText="Analitica" leftIcon={<InsightsIcon />} />
        </Authorize>

        <Authorize allowedRoles={['Administrador']} deniedRoles={['']}>
            <Menu.Item to="/esavis" primaryText="ESAVIS" leftIcon={<VaccinesIcon />} />
        </Authorize>

        {/* Reportes: visible solo si el usuario tiene el rol "Administrador" */}
        <Authorize allowedRoles={['Administrador' , 'Analista de Información']} deniedRoles={[]}>
            <Menu.Item to="/reportes" primaryText="Reportes" leftIcon={<TableChartIcon />} />
        </Authorize>

        {/* Puedes agregar más elementos al menú aquí siguiendo el mismo patrón */}
    </Menu>

    // <Menu>
    //         <Menu.Item to="/dashboard" primaryText="Dashboard" leftIcon={<PieChartIcon />} />
    //         <Menu.Item to="/esavis" primaryText="ESAVIS" leftIcon={<VaccinesIcon />} />
    //         <Menu.Item to="/reportes" primaryText="Reportes" leftIcon={<TableChartIcon />} />
    // </Menu>
);