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
								console.log("Record :::" , record)
								
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
						render={(record: any) =>
							`${record.codigoVigiflow !== '' ? (record.codigoDhis2Evento ?? '--') : '--'}`
						}
					/>
					{/* <TextField label="Fecha Notificación" source="fechaNotificacion" /> */}

					<DateField
						label="Fecha Notificación"
						source="fechaNotificacion"
						options={{
							year: 'numeric',
							month: 'numeric',
							day: 'numeric'
						}}
					/>

					<DateField
						label="Fecha Nacimiento"
						source="fechaNacimiento"
						options={{
							year: 'numeric',
							month: 'numeric',
							day: 'numeric'
						}}
					/>
					<FunctionField
						label="Identificación"
						render={(record: any) => `${record.paciente?.identificacion ?? '--'}`}
					/>
					<FunctionField label="Nombres" render={(record: any) => `${record.paciente?.nombre ?? '--'}`} />
				</Datagrid>
			</List>
		</Card>
	);
};
