import {
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function DiccionarioList() {
	return (
		<>
			<Typography variant="h4">Sistema IntegraEsavi</Typography>
			<p>
				Sistema de integración de la información de los casos de esavi grave registrados en el
				sistema Dhis2 del MSP y de los casos de esavi no grave registrados en el sistema Vigiflow de
				la Agencia Nacional de Regulación, Control y Vigilancia Sanitaria (ARCSA)
			</p>
			<p>
				A continuación, se muestra el diccionario de datos de las principales tablas del sistema:
			</p>
			<Accordion>
				<AccordionSummary
					expandIcon={<ExpandMoreIcon />}
					aria-controls="panel-content"
					id="pnlPaciente"
				>
					<Typography>PACIENTE</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<TableContainer component={Paper}>
						<Table aria-label="Información personal del paciente">
							<TableHead>
								<TableRow>
									<TableCell>Columna</TableCell>
									<TableCell>Descripción</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								<TableRow>
									<TableCell>PACIENTE_ID</TableCell>
									<TableCell>Clave primaria</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>NOMBRE</TableCell>
									<TableCell>Nombre y apellido del paciente</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>IDENTIFICACION</TableCell>
									<TableCell>N° de identificación del paciente</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>CODIGODHIS2ENTIDAD</TableCell>
									<TableCell>Código del registro en el sistema DHIS2</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>CODIGOVIGIFLOW</TableCell>
									<TableCell>Código del registro en el sistema Vigiflow</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>ORIGEN</TableCell>
									<TableCell>
										Sistema de origen desde el que se importo el registro (DHIS2, Vigiflow)
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>CTSEXO_ID</TableCell>
									<TableCell>Sexo del paciente</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>CTAUTOIDENTIFICACIONETNICA_ID</TableCell>
									<TableCell>Auto identificación étnica del paciente</TableCell>
								</TableRow>
								{/* Puedes agregar más filas según tus necesidades */}
							</TableBody>
						</Table>
					</TableContainer>
				</AccordionDetails>
			</Accordion>

			<Accordion>
				<AccordionSummary
					expandIcon={<ExpandMoreIcon />}
					aria-controls="panel-content"
					id="pnlNotificacion"
				>
					<Typography>NOTIFICACION</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<TableContainer component={Paper}>
						<Table aria-label="Información de la notificación">
							<TableHead>
								<TableRow>
									<TableCell>Columna</TableCell>
									<TableCell>Descripción</TableCell>
									<TableCell>Dhis2</TableCell>
									<TableCell>Vigiflow</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								<TableRow>
									{' '}
									<TableCell> NOTIFICACION_ID </TableCell> <TableCell> Clave primaria </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> PACIENTE_ID </TableCell> <TableCell> Id del paciente </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> ALTURA </TableCell> <TableCell> Altura del paciente </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> PESO </TableCell> <TableCell> Peso del paciente </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FECHANACIMIENTO </TableCell>{' '}
									<TableCell> Fecha de nacimiento </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> EDAD </TableCell> <TableCell> Edad </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTUNIDADEDAD_ID </TableCell>{' '}
									<TableCell> Unidad de medida de la edad (años, meses, días) </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTGRUPOETARIO_ID </TableCell> <TableCell> Grupo etario </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CASONARRATIVO </TableCell>{' '}
									<TableCell> Descripción del caso de esavi </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CODIGODHIS2EVENTO </TableCell>{' '}
									<TableCell> Código de la notificación en el sistema DHIS2 </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> No </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CODIGOVIGIFLOW </TableCell>{' '}
									<TableCell> Código del registro en el sistema Vigiflow </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTPROVINCIARESIDENCIA_ID </TableCell>{' '}
									<TableCell> Provincia de residencia del paciente </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTCANTORESIDENCIA_ID </TableCell>{' '}
									<TableCell> Cantón del residencia del paciente </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTPARROQUIARESIDENCIA_ID </TableCell>{' '}
									<TableCell> Parroquia de residencia del paciente </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> OTRAPARROQUIARESIDENCIA </TableCell>{' '}
									<TableCell> Otra parroquia de la residencia del paciente </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOMBRENOTIFICADOR </TableCell>{' '}
									<TableCell> Nombre del notificador </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> TITULONOTIFICADOR </TableCell>{' '}
									<TableCell> Titulo del notificador </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTPROFESIONNOTIFICADOR_ID </TableCell>{' '}
									<TableCell> Profesion del notificador </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> COMENTARIONOTIFICADOR </TableCell>{' '}
									<TableCell> Comentario del notificador </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTPROVINCIANOTIFICADOR_ID </TableCell>{' '}
									<TableCell> Provincia del notificador </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTCANTONNOTIFICADOR_ID </TableCell>{' '}
									<TableCell> Cantón del notificador </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTPARROQUIANOTIFICADOR_ID </TableCell>{' '}
									<TableCell> Parroquia del notificador </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> OTRAPARROQUIANOTIFICADOR </TableCell>{' '}
									<TableCell> Otra parroquia del notificador </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> ORGANIZACIONNOTIFICADOR </TableCell>{' '}
									<TableCell> Organización del notificador </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FECHALLENADOFICHA </TableCell>{' '}
									<TableCell> Fecha de llenado de la ficha </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FECHANOTIFICACION </TableCell>{' '}
									<TableCell> Fecha de notificación </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> MEDIONOTIFICACION </TableCell>{' '}
									<TableCell> Medio de notificación </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FECHAREPORTENACIONAL </TableCell>{' '}
									<TableCell> Fecha de reporte nacional </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOMBREEMISOR </TableCell>{' '}
									<TableCell> Nombre de la institución emisora de la notificación </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> ORGANIZACIONEMISOR </TableCell>{' '}
									<TableCell> Organización de la institución emisora </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> TIPOEMISOR </TableCell> <TableCell> Tipo de emisor </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> TIPOREPORTE </TableCell>{' '}
									<TableCell> Titulo del reporte en Vigiflow </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> TITULOREPORTE </TableCell> <TableCell> Titulo del reporte </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>
				</AccordionDetails>
			</Accordion>

			<Accordion>
				<AccordionSummary
					expandIcon={<ExpandMoreIcon />}
					aria-controls="panel-content"
					id="pnlDatosEsavi"
				>
					<Typography>DATOS ESAVI</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<TableContainer component={Paper}>
						<Table aria-label="Información del esavi">
							<TableHead>
								<TableRow>
									<TableCell>Columna</TableCell>
									<TableCell>Descripción</TableCell>
									<TableCell>Dhis2</TableCell>
									<TableCell>Vigiflow</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								<TableRow>
									{' '}
									<TableCell> DATOSESAVI_ID </TableCell> <TableCell> Clave primaria </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> SISTEMADECODIFICACION </TableCell>{' '}
									<TableCell> Sistema de codificación: CIE-10, MedDra </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOMBREESAVI </TableCell> <TableCell> Nombre del esavi </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTLLTMEDDRA_ID </TableCell> <TableCell> Código LLT MedDra </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTPTMEDDRA_ID </TableCell> <TableCell> Código PT MedDra </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTHLTMEDDRA_ID </TableCell> <TableCell> Código HLT MedDra </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTHLGTMEDDRA_ID </TableCell>{' '}
									<TableCell> Código HLGT MedDra </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTSOCMEDDRA_ID </TableCell> <TableCell> Código SOC MedDra </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CODIGOESAVICIE10 </TableCell> <TableCell> Código CIE-10 </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> No </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FECHAESAVI </TableCell> <TableCell> Fecha de inicio </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FECHAFINALIZACION </TableCell>{' '}
									<TableCell> Fecha de finalización </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> DURACION </TableCell> <TableCell> Duración </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> RESULTADO </TableCell> <TableCell> Resultado </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOTIFICACION_ID </TableCell>{' '}
									<TableCell> Clave de la notificación </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>
				</AccordionDetails>
			</Accordion>

			<Accordion>
				<AccordionSummary
					expandIcon={<ExpandMoreIcon />}
					aria-controls="panel-content"
					id="pnlDatosVacuna"
				>
					<Typography>DATOS VACUNA</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<TableContainer component={Paper}>
						<Table aria-label="Información de la vacuna">
							<TableHead>
								<TableRow>
									<TableCell>Columna</TableCell>
									<TableCell>Descripción</TableCell>
									<TableCell>Dhis2</TableCell>
									<TableCell>Vigiflow</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								<TableRow>
									{' '}
									<TableCell> DATOVACUNA_ID </TableCell> <TableCell> Clave primaria </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOTIFICACION_ID </TableCell>{' '}
									<TableCell> Clave de la notificación </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOMBREVACUNA </TableCell> <TableCell> Nombre de la vacuna </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOMBREFABRICANTE </TableCell>{' '}
									<TableCell> Nombre del fabricante </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOMBREFABRICANTEWHODRUG </TableCell>{' '}
									<TableCell> Nombre del fabricante - WhoDrug </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOMBRENORMALIZADOVACUNA </TableCell>{' '}
									<TableCell> Nombre normalizado de la vacuna </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NUMERODOSISVACUNA </TableCell>{' '}
									<TableCell> Número de dosis vacuna </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NUMEROLOTE </TableCell> <TableCell> Número de lote </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> PAISAUTORIZACION </TableCell>{' '}
									<TableCell> País autorización </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> PRINCIPIOACTIVOWHODRUG </TableCell>{' '}
									<TableCell> Principio activo - WhoDrug </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> ROLVACUNA </TableCell> <TableCell> Rol de la vacuna </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> SISTEMADECODIFICACION </TableCell>{' '}
									<TableCell> Sistema de codificación </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> VIAADMINISTRACION </TableCell>{' '}
									<TableCell> Vía de administración </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> VIAADMINISTRACIONEDQM </TableCell>{' '}
									<TableCell> Vía de administración - EDQM </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> ACCIONTOMADA </TableCell> <TableCell> Acción tomada </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CODIGOATC </TableCell>{' '}
									<TableCell> Sistema de Clasificación Anatómica, Terapéutica, Química </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CODIGOFABRICANTEWHODRUG </TableCell>{' '}
									<TableCell>
										{' '}
										Código de la clasificación internacional de medicamentos WhoDrug{' '}
									</TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CODIGOVACUNAOTRO </TableCell>{' '}
									<TableCell> Código de la vacuna de acuerdo a otra clasificación </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CONCENTRACION </TableCell>{' '}
									<TableCell> Concentración de la vacuna </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> IDENTIFICADORVACUNA </TableCell>{' '}
									<TableCell> Identificador de la vacuna </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> DOSIS </TableCell> <TableCell> Dosis de la vacuna </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> DOSIS1 </TableCell> <TableCell> Dosis de la vacuna </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> INTERVALODOSIFICACION </TableCell>{' '}
									<TableCell> Intervalo dosificación </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> DURACION </TableCell> <TableCell> Duración del esavi </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FECHAVENCIMIENTOVACUNA </TableCell>{' '}
									<TableCell> Fecha de vencimiento de la vacuna </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> INICIOADMINISTRACION </TableCell>{' '}
									<TableCell> Inicio de la administración </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FINADMINISTRACION </TableCell>{' '}
									<TableCell> Fin de la administración </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOMBREDILUYENTEVACUNA </TableCell>{' '}
									<TableCell> Nombre del diluyente de la vacuna </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FECHAVENCIMIENTODILUYENTE </TableCell>{' '}
									<TableCell> Fecha de vencimiento del diluyente </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FORMAFARMACEUTICA </TableCell>{' '}
									<TableCell> Forma farmacéutica </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FORMAFARMACEUTICAEDQM </TableCell>{' '}
									<TableCell>
										{' '}
										Forma farmacéutica según el estándar EDQM (European Directorate for the Quality
										of Medicines & HealthCare){' '}
									</TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> INDICACIONMEDDRA </TableCell>{' '}
									<TableCell> Indicación MedDra </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> INDICACIONNOTIFICADORPRIMARIO </TableCell>{' '}
									<TableCell> Indicación notificador primario </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> INFORMACIONADICIONALMEDICAMENTO </TableCell>{' '}
									<TableCell> Información adicional medicamento </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> INGREDIENTESOSPECHOSO </TableCell>{' '}
									<TableCell> Ingrediente sospechoso </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>
				</AccordionDetails>
			</Accordion>

			<Accordion>
				<AccordionSummary
					expandIcon={<ExpandMoreIcon />}
					aria-controls="panel-content"
					id="pnlDatosVacunacion"
				>
					<Typography>DATOS VACUNACIÓN</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<TableContainer component={Paper}>
						<Table aria-label="Información de la vacunación">
							<TableHead>
								<TableRow>
									<TableCell>Columna</TableCell>
									<TableCell>Descripción</TableCell>
									<TableCell>Dhis2</TableCell>
									<TableCell>Vigiflow</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								<TableRow>
									{' '}
									<TableCell> DATOVACUNACION_ID </TableCell> <TableCell> Clave primaria </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOTIFICACION_ID </TableCell>{' '}
									<TableCell> Clave de la notificación </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FECHAVACUNACION </TableCell>{' '}
									<TableCell> Fecha de la vacunación </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> HORAVACUNACION </TableCell>{' '}
									<TableCell> Hora de la vacunación </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FECHARECONSTITUCIONVACUNA </TableCell>{' '}
									<TableCell> Fecha de constitución de la vacuna </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> HORARECONSTITUCIONVACUNA </TableCell>{' '}
									<TableCell> Hora de constitución de la vacuna </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTPROVINCIAVACUNATORIO_ID </TableCell>{' '}
									<TableCell> Provincia del vacunatorio </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOMBREVACUNATORIO </TableCell>{' '}
									<TableCell> Nombre del vacunatorio </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> DIRECCIONVACUNATORIO </TableCell>{' '}
									<TableCell> Dirección del vacunatorio </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTCANTONNOTIFICADOR_ID </TableCell>{' '}
									<TableCell> Cantón del notificador </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CTPARROQUIANOTIFICADOR_ID </TableCell>{' '}
									<TableCell> Parroquia del notificador </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> OTRAPARROQUIANOTIFICADOR </TableCell>{' '}
									<TableCell> Otra parroquia del vacunatorio </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CODIGOMECANISMOVERIFICACION </TableCell>{' '}
									<TableCell> Codigo del mecanismo de verificación </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOMBREOTROMECANISMOVERIFICACION </TableCell>{' '}
									<TableCell> Otro mecanismo de verificación </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>
				</AccordionDetails>
			</Accordion>

			<Accordion>
				<AccordionSummary
					expandIcon={<ExpandMoreIcon />}
					aria-controls="panel-content"
					id="pnlDatosVacuna"
				>
					<Typography>MEDICAMENTOS</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<TableContainer component={Paper}>
						<Table aria-label="Información de los medicamentos">
							<TableHead>
								<TableRow>
									<TableCell>Columna</TableCell>
									<TableCell>Descripción</TableCell>
									<TableCell>Dhis2</TableCell>
									<TableCell>Vigiflow</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								<TableRow>
									{' '}
									<TableCell> MEDICAMENTO_ID </TableCell> <TableCell> Clave primaria </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOTIFICACION_ID </TableCell>{' '}
									<TableCell> Clave de la notificación </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> ROLMEDICAMENTO </TableCell>{' '}
									<TableCell> Rol del medicamento </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CODIGOATC </TableCell>{' '}
									<TableCell> Sistema de Clasificación Anatómica, Terapéutica, Química </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> SISTEMADECODIFICACION </TableCell>{' '}
									<TableCell> Sistema de codificación </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CODIGOMEDICAMENTO </TableCell>{' '}
									<TableCell> Código del medicamento </TableCell> <TableCell> No </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOMBREMEDICAMENTO </TableCell>{' '}
									<TableCell> Nombre del medicamento </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOMBRENORMALIZADOMEDICAMENTO </TableCell>{' '}
									<TableCell> Nombre normalizado del medicamento </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CODIGOFORMAFARMACEUTICA </TableCell>{' '}
									<TableCell> Código de la forma farmacéutica </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOMBREFORMAFARMACEUTICA </TableCell>{' '}
									<TableCell> Nombre de la forma farmacéutica </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CODIGOVIAADMINISTRACION </TableCell>{' '}
									<TableCell> Codigo de la vía de administración </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOMBREVIAADMINISTRACION </TableCell>{' '}
									<TableCell> Nombre de la vía de administración </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>
				</AccordionDetails>
			</Accordion>
			<Accordion>
				<AccordionSummary
					expandIcon={<ExpandMoreIcon />}
					aria-controls="panel-content"
					id="pnlDatosVacuna"
				>
					<Typography>GRAVEDAD ESAVI</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<TableContainer component={Paper}>
						<Table aria-label="Información de la gravedad del esavi">
							<TableHead>
								<TableRow>
									<TableCell>Columna</TableCell>
									<TableCell>Descripción</TableCell>
									<TableCell>Dhis2</TableCell>
									<TableCell>Vigiflow</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								<TableRow>
									{' '}
									<TableCell> GRAVEDADESAVI_ID </TableCell> <TableCell> Clave primaria </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOTIFICACION_ID </TableCell>{' '}
									<TableCell> Clave de la notificación </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> TIPOGRAVEDAD </TableCell>{' '}
									<TableCell> Tipo de gravedad (Grave, No grave) </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> GRAVMUERTE </TableCell> <TableCell> Muerte </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> GRAVRIESGOVIDA </TableCell>{' '}
									<TableCell> Amenaza la vida al momento de la detección del ESAVI </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> GRAVDISCAPACIDAD </TableCell>{' '}
									<TableCell>
										{' '}
										Genera discapacidad severa o permanente al momento de la detección{' '}
									</TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> GRAVHOSPITALIZACION </TableCell>{' '}
									<TableCell> Hospitalización o prolongación de la misma </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> GRAVANOMALIACONGENITA </TableCell>{' '}
									<TableCell> Anomalía congénita </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> GRAVABORTO </TableCell> <TableCell> Aborto </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> GRAVMUERTEFETAL </TableCell> <TableCell> Muerte fetal </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> OTROSEVENTOSIMPORTANTES </TableCell>{' '}
									<TableCell> Otros eventos considerados médicamente Importantes </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> OTROSEVENTOSIMPORTANTESTX </TableCell>{' '}
									<TableCell> Descripción de otros eventos medicamente importantes </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>
				</AccordionDetails>
			</Accordion>
			<Accordion>
				<AccordionSummary
					expandIcon={<ExpandMoreIcon />}
					aria-controls="panel-content"
					id="pnlDesenlaceEsavi"
				>
					<Typography>DESENLACE ESAVI</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<TableContainer component={Paper}>
						<Table aria-label="Información del desenlace del esavi">
							<TableHead>
								<TableRow>
									<TableCell>Columna</TableCell>
									<TableCell>Descripción</TableCell>
									<TableCell>Dhis2</TableCell>
									<TableCell>Vigiflow</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								<TableRow>
									{' '}
									<TableCell> DESENLACEESAVI_ID </TableCell> <TableCell> Clave primaria </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> NOTIFICACION_ID </TableCell>{' '}
									<TableCell> Clave de la notificación </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> CODDESENLACEESAVI </TableCell>{' '}
									<TableCell> Código desenlace ESAVI </TableCell> <TableCell> Si </TableCell>{' '}
									<TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FECHAMUERTE </TableCell>{' '}
									<TableCell> Fecha de muerte producida por posible ESAVI </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> AUTOPSIA </TableCell>{' '}
									<TableCell> Determinación si hubo o no autopsia </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FECHANOTIFICAMUERTE </TableCell>{' '}
									<TableCell>
										{' '}
										Fecha en la cual se notificó la muerte del paciente al Registro Civil{' '}
									</TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> No </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> AUTOPSIAFETAL </TableCell>{' '}
									<TableCell> Determinación si hubo o no autopsia fetal </TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> No </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FECHANOTIFICAMUERTEFETAL </TableCell>{' '}
									<TableCell>
										{' '}
										Fecha en la cual se notificó la muerte del feto de paciente al Registro Civil{' '}
									</TableCell>{' '}
									<TableCell> No </TableCell> <TableCell> No </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> COMENTARIOS </TableCell>{' '}
									<TableCell> Comentarios adicionales en cuanto al cuadro ESAVI </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
								<TableRow>
									{' '}
									<TableCell> FECHAINICIOINVESTIGACION </TableCell>{' '}
									<TableCell> Fecha en la cual se inicia investigación </TableCell>{' '}
									<TableCell> Si </TableCell> <TableCell> Si </TableCell>{' '}
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>
				</AccordionDetails>
			</Accordion>
		</>
	);
}

export default DiccionarioList;
