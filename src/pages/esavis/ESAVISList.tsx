import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Card } from '@mui/material';
import { useState } from 'react';
import { Datagrid, DateField, ExportButton, FunctionField, List, TextField, TextInput, TopToolbar } from 'react-admin';
const postFilters = [
	<TextInput label="Origen" source="origen" alwaysOn />,
	<TextInput label="Identificación" source="identificacion" alwaysOn />,
];

const ListActions = () => (
	<TopToolbar>
		<ExportButton label='CSV' />
	</TopToolbar>
);
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
		fontweight: !isHover ? 'bold' : 'normal',
	};
	return (
		<Card variant="outlined" style={{ padding: 10 }}>
			<List actions={<ListActions />} filters={postFilters}>
				<Datagrid bulkActionButtons={false}>
					<FunctionField label="Id" source="id" render={
						(record: any) =>
						(<>
							<table>
								<tr>
									<td>
										<div onClick={() => { navigator.clipboard.writeText(record.id); }}>
											<ContentCopyIcon color="primary" sx={{ fontSize: 15 }} />
										</div>
									</td>
									<td>
										<label style={boxStyle} title={`${record.id}`}
											onMouseEnter={handleMouseEnter}
											onMouseLeave={handleMouseLeave}
										>
											{`${record.id.slice(0, 5)}...`}
										</label>
									</td>
								</tr>
							</table>
						</>
						)
					} />
					<FunctionField label="Origen" sortBy="tipo" render={
						(record: any) => `${record.tipo !== "dhis2" ? "VIGI-FLOW" : "DHIS2"}`
					} />
					<FunctionField label="Código Origen" render={
						(record: any) => `${record.codigoVigiflow !== "" ? record.codigoDhis2Evento ?? '--' : "--"}`
					} />
					<TextField label='Fecha Notificación' source='fechaNotificacion' />
					<DateField label='Fecha Nacimiento' source='fechaNacimiento' options={{
						year: 'numeric',
						month: 'numeric',
						day: 'numeric'
					}} />
					<FunctionField
						label="Identificación"
						render={(record: any) => `${record.identificacion ?? "--"}`}
					/>
					<FunctionField
						label="Nombres"
						render={(record: any) => `${record.nombres ?? "--"}`}
					/>
				</Datagrid>
			</List >
		</Card>

	)
}
