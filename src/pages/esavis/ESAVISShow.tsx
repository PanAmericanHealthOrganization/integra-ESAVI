import { useState } from 'react';
import { AppBar, Show, SimpleShowLayout, TextField } from 'react-admin';
import Tabs from '@mui/material/Tabs';
import { useTheme } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Grid } from '@mui/material';
interface TabPanelProps {
	children?: React.ReactNode;
	dir?: string;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;
	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`full-width-tabpanel-${index}`}
			aria-labelledby={`full-width-tab-${index}`}
			{...other}
		>
			{value === index && (
				<Box sx={{ p: 3 }}>
					<Typography>{children}</Typography>
				</Box>
			)}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `full-width-tab-${index}`,
		'aria-controls': `full-width-tabpanel-${index}`
	};
}

export const ESAVISShow = () => {
	const theme = useTheme();
	const [value, setValue] = useState(0);

	const handleChange = (event: React.SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	const handleChangeIndex = (index: number) => {
		setValue(index);
	};
	return (
		<Show>
			<SimpleShowLayout>
				<Box sx={{ bgcolor: 'background.paper', width: '100%' }}>
					<Tabs
						value={value}
						onChange={handleChange}
						indicatorColor="secondary"
						textColor="inherit"
						variant="fullWidth"
						aria-label="full width tabs example"
					>
						<Tab label="Evento" {...a11yProps(0)} />
						<Tab label="(1) Notificación 100%" {...a11yProps(1)} />
						<Tab label="(2) Investigación 30%" {...a11yProps(2)} />
						<Tab label="(3) Laboratorio 0%" {...a11yProps(3)} />
						<Tab label="(4) Clasificación final 0%" {...a11yProps(4)} />
					</Tabs>

					<TabPanel value={value} index={0} dir={theme.direction}>
						<Show>
							<SimpleShowLayout>
								<table style={{ width: '100%' }}>
									<tr>
										<td>
											<TextField source="id" />
										</td>
										<td></td>
										<td>
											<TextField source="origen" />
										</td>
									</tr>
									<tr>
										<td>
											<TextField source="establecimiento" />
										</td>
										<td>
											<TextField source="fechaEvento" />
										</td>
										<td>
											<TextField source="fechaRegistro" />
										</td>
									</tr>
									<tr>
										<td>
											<TextField source="tipoIdentificacion" />
										</td>
										<td>
											<TextField source="identificacion" />
										</td>
										<td>
											<TextField source="nombres" />
										</td>
									</tr>

									<tr>
										<td>
											<TextField source="apellidos" />
										</td>
										<td>
											<TextField source="fechaNacimiento" />
										</td>
										<td>
											<TextField source="sexo" />
										</td>
									</tr>
									<tr>
										<td>
											<TextField source="estadoCivi" />
										</td>
										<td>
											<TextField source="nacionalidad" />
										</td>
										<td>
											<TextField source="autoIdentificacion" />
										</td>
									</tr>
									<tr>
										<td>
											<TextField source="nacionalidadEtnica" />
										</td>
										<td>
											<TextField source="pueblo" />
										</td>
										<td></td>
									</tr>
								</table>
							</SimpleShowLayout>
						</Show>
					</TabPanel>
					<TabPanel value={value} index={1} dir={theme.direction}>
						<Show>
							<SimpleShowLayout>
								<TextField source="id" />
								<TextField source="establecimiento" />
								<TextField source="fechaEvento" />
								<TextField source="nacionalidad" />
								<TextField source="autoIdentificacion" />
								<TextField source="nacionalidadEtnica" />
								<TextField source="pueblo" />
							</SimpleShowLayout>
						</Show>
					</TabPanel>
					<TabPanel value={value} index={2} dir={theme.direction}>
						<Show>
							<SimpleShowLayout>
								<TextField source="sexo" />
								<TextField source="estadoCivi" />
								<TextField source="nacionalidad" />
								<TextField source="autoIdentificacion" />
								<TextField source="nacionalidadEtnica" />
								<TextField source="pueblo" />
							</SimpleShowLayout>
						</Show>
					</TabPanel>
				</Box>
			</SimpleShowLayout>
		</Show>
	);
};
