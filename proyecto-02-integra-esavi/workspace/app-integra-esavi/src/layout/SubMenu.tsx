import { ReactElement, ReactNode } from 'react';
import { List, MenuItem, ListItemIcon, Typography, Collapse, Tooltip } from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useTranslate, useSidebarState } from 'react-admin';

interface Props {
	dense: boolean;
	handleToggle: () => void;
	icon: ReactElement;
	isOpen: boolean;
	name: string;
	children: ReactNode;
}

const SubMenu = (props: Props) => {
	const { handleToggle, isOpen, name, icon, children, dense } = props;
	const translate = useTranslate();

	const [sidebarIsOpen] = useSidebarState();

	/*
	 * La cabecera comparte forma con los ítems de primer nivel (pastilla de 8px, 40px de
	 * alto, icono a 34px): antes era un MenuItem crudo, medio centímetro más alto y sin
	 * redondeo, y rompía la columna del menú justo donde empieza un grupo.
	 */
	const header = (
		<MenuItem
			dense={dense}
			onClick={handleToggle}
			sx={{
				borderRadius: '8px',
				minHeight: 40,
				px: '11px',
				my: '2px',
				color: 'text.secondary',
				fontSize: '13.5px',
				fontWeight: 500,
				'&:hover': { backgroundColor: '#f0f5fc' }
			}}
		>
			<ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
				{isOpen ? <ExpandMore /> : icon}
			</ListItemIcon>
			<Typography variant="inherit">{translate(name)}</Typography>
		</MenuItem>
	);

	return (
		<div>
			{sidebarIsOpen || isOpen ? (
				header
			) : (
				<Tooltip title={translate(name)} placement="right">
					{header}
				</Tooltip>
			)}
			<Collapse in={isOpen} timeout="auto" unmountOnExit>
				<List
					dense={dense}
					component="div"
					disablePadding
					sx={{
						'& a': {
							transition: 'padding-left 195ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
							paddingLeft: sidebarIsOpen ? 4 : 2
						}
					}}
				>
					{children}
				</List>
			</Collapse>
		</div>
	);
};

export default SubMenu;
