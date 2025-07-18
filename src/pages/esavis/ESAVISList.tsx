import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Button, Card } from '@mui/material';
import { useState } from 'react';
import {
	Datagrid,
	DateField,
	ExportButton,
	FunctionField,
	List,
	TextField,
	TextInput,
	TopToolbar
} from 'react-admin';
import BulkDialog from './BulkDialog';

const postFilters = [
	<TextInput label="Origen" source="origen" alwaysOn />,
	<TextInput label="Identificación" source="identificacion" alwaysOn />
];

const ListActions = () => {
	const [open, setOpen] = useState(false);

	const handleClickOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	return (
		<TopToolbar>
			<ExportButton label="CSV" />
			<Button variant="contained" color="primary" onClick={handleClickOpen} style={{ marginLeft: '10px' }}>
				Importar datos
			</Button>
			<BulkDialog open={open} onClose={handleClose} />
		</TopToolbar>
	);
};

const ocultarInformacion = (texto: string) => {
	if (!texto) return '--';
	const longitud = texto.length;
	const mitad = Math.floor(longitud / 2);
	return texto.substring(0, mitad) + 'XXXXX';
};

export const ESAVISList = () => {
	const [isHover, setIsHover] = useState(false);

	const handleMouseEnter = () => {
		setIsHover(true);
	};

	const handleMouseLeave = () => {
		setIsHover(false);
	};
	const boxStyle = {
		width: '10px',
		pading: '5px 0px 0px 0px',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		maxWidth: '10%',
		cursor: isHover ? 'copy' : 'pointer',
		fontweight: !isHover ? 'bold' : 'normal'
	};
	return (
		<Card variant="outlined" style={{ padding: 10 }}>
			<List actions={<ListActions />} filters={postFilters}>
				<Datagrid bulkActionButtons={false}>
					<FunctionField
						label="Id"
						source="id"
						render={(record: any) => (
							<>
								{
									console.log("Record :::", record)

								}
								<table>
									<tbody>
										<tr>
											<td>
												<div onClick={() => { navigator.clipboard.writeText(record.id); }}>
													<ContentCopyIcon color="primary" sx={{ fontSize: 15 }} />
												</div>
											</td>
											<td>
												<label
													style={boxStyle}
													title={`${record.id}`}
													onMouseEnter={handleMouseEnter}
													onMouseLeave={handleMouseLeave}
												>
													{`${record.id.slice(0, 5)}...`}
												</label>
											</td>
										</tr>
									</tbody>
								</table>
							</>
						)}
					/>
					<FunctionField
						label="Origen"
						sortBy="origen"
						render={(record: any) => `${record.tipo}`}
					/>
					<FunctionField
						label="Código Origen"
						render={(record: any) => {
							// Si codigoVigiflow tiene un valor válido (no es null, undefined ni vacío), se muestra, si no se muestra codigoDhis2Evento
							return (record.codigoVigiflow && record.codigoVigiflow !== '')
								? record.codigoVigiflow
								: (record.codigoDhis2Evento ?? '--'); // Si codigoDhis2Evento no está disponible, muestra '--'
						}}
					/>

					{/* <TextField label="Fecha Notificación" source="fechaNotificacion" /> */}

					<FunctionField
						label="Fecha Notificación"
						render={(record: any) => {
							// Si fechaNotificacion tiene un valor, mostrarla, si no mostrar '--'
							const fechaNotificacion = record.fechaNotificacion
								? new Date(record.fechaNotificacion).toLocaleDateString('es-ES', {
									year: 'numeric',
									month: 'numeric',
									day: 'numeric'
								})
								: '--'; // Si no hay valor, mostrar '--'

							return fechaNotificacion;
						}}
					/>
					s
					<FunctionField
						label="Fecha Nacimiento"
						render={(record: any) => {
							// Si fechaNacimiento tiene un valor, mostrarlo, de lo contrario, mostrar '--'
							const fechaNacimiento = record.fechaNacimiento ? new Date(record.fechaNacimiento).toLocaleDateString('es-ES', {
								year: 'numeric',
								month: 'numeric',
								day: 'numeric'
							}) : '--';

							return fechaNacimiento;
						}}
					/>
					<FunctionField
						label="Identificación"
						render={(record: any) => ocultarInformacion(record.paciente?.identificacion)}
					/>
					<FunctionField
						label="Nombres"
						render={(record: any) => ocultarInformacion(record.paciente?.nombre)}
					/>
				</Datagrid>
			</List>
		</Card>
	);
};
