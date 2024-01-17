import { useEffect, useState } from 'react';
import { reporteDataProvider } from '../../dataProviders/reportes.dataprovider';

import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
// import { Document, Page } from 'react-pdf/dist/esm/entry.vite';
// import { triggerBase64Download } from 'react-base64-downloader';

import useStateRef from 'react-usestateref';

import './pdf.css';

import { Add, Search } from '@mui/icons-material';
import { Grid } from '@mui/joy';
import { Box, Button, Container, FormLabel, Input } from '@mui/material';

const ReportesList = () => {
	const [numPages, setNumPages] = useState(0);
	const [desde, setDesde] = useState();
	const [hasta, setHasta] = useState();

	const [source, setSource, sourceRef] = useStateRef<string>();

	const consultar = async () => {
		const respuesta = await reporteDataProvider.obtenerReporte();
		console.log('respuesta:: ', respuesta);
		if (respuesta.msg === 'OK') {
			setSource(respuesta.data);
		}
	};

	const filtrar = async () => {
		const respuesta = await reporteDataProvider.obtenerReporte();
		console.log('respuesta:: ', respuesta);
		if (respuesta.msg === 'OK') {
			setSource(respuesta.data);
		}
	};

	useEffect(() => {
		consultar();
	}, []);

	function onDocumentLoadSuccess({ numPages }: any) {
		setNumPages(numPages);
	}

	const descargarpdf = async () => {
		const link = document.createElement('a');
		link.href = `data:application/pdf;base64,${sourceRef.current}`;
		link.download = 'reporteEsavi.pdf';
		link.click();
	};

	return (
		<div className="RaDatagrid-tableWrapper">
			<Container>
				<Box sx={{ flexGrow: 1 }}>
					<Grid container border={1} borderColor={'divider'} margin={1}>
						<Grid
							container
							xs={12}
							sm={6}
							md={6}
							maxHeight={50}
							marginTop={3}
							alignSelf={'flex-start'}
							// bgcolor={'blue'}
						>
							<Grid
								xs={1}
								md={3}
								xl={3}
								// bgcolor={"red"}
							/>
							<Grid
								xs={2}
								md={2}
								xl={2}
								//  bgcolor={"green"}
								alignSelf={'center'}
								// minHeight={50}
							>
								<FormLabel>Desde: </FormLabel>
							</Grid>
							<Grid
								xs={1}
								md={1}
								xl={1}
								// bgcolor={"blue"}
							/>
							<Grid xs={6} md={6} xl={6} alignSelf={'center'}>
								<Input
									slotProps={{
										input: {
											type: 'date'
										}
									}}
									// value={establecimientoSeleccionado?.nombreEstablecimiento?.toString()}
								/>
							</Grid>
						</Grid>

						<Grid
							container
							xs={12}
							sm={6}
							md={6}
							maxHeight={50}
							marginTop={3}
							alignSelf={'flex-start'}
						>
							<Grid xs={1} md={1} xl={1} />
							<Grid
								xs={2}
								md={2}
								xl={2}
								display={'flex'}
								flexDirection={'column'}
								textAlign={'right'}
								alignItems={'flex-end'}
								alignSelf={'center'}
							>
								<FormLabel>Hasta:</FormLabel>
							</Grid>

							<Grid xs={1} md={1} xl={1} />

							<Grid xs={6} md={5} xl={5} alignSelf={'center'}>
								<Input
									slotProps={{
										input: {
											type: 'date'
										}
									}}
									// value={establecimientoSeleccionado?.nombreEstablecimiento?.toString()}
								/>
							</Grid>
						</Grid>

						{/* botones */}
						<Grid container xs={12} sm={12} md={12} maxHeight={50} marginTop={1}>
							<Grid container xs={12} sm={6} md={6} lg={6} maxHeight={50} marginTop={1}>
								<Grid
									xs={12}
									sm={4}
									md={4}
									lg={8}
									maxHeight={50}
									// bgcolor={"blue"}
								></Grid>
								<Grid
									xs={12}
									sm={4}
									md={4}
									lg={2}
									maxHeight={50}
									alignSelf={'center'}
									textAlign={'center'}
									// bgcolor={"green"}
								>
									<Button variant="contained">Buscar</Button>
								</Grid>
								<Grid
									xs={12}
									sm={4}
									md={4}
									lg={2}
									maxHeight={50}
									alignSelf={'center'}
									textAlign={'center'}
									// bgcolor={"green"}
								>
									<Button variant="contained">Limpiar</Button>
								</Grid>
							</Grid>

							<Grid
								container
								xs={12}
								sm={6}
								md={6}
								lg={6}
								maxHeight={50}
								marginTop={1}
								// bgcolor={"yellow"}
							>
								<Grid
									xs={12}
									sm={4}
									md={4}
									lg={3}
									maxHeight={50}
									alignSelf={'center'}
									textAlign={'center'}
									// bgcolor={"red"}
								>
									<Button
										variant="contained"
										// color="success"
										// startDecorator={<Add />}
										onClick={descargarpdf}
									>
										PDF
									</Button>
								</Grid>
								<Grid
									xs={12}
									sm={4}
									md={4}
									lg={3}
									maxHeight={50}
									// alignSelf={'center'}
									// textAlign={'center'}
									// bgcolor={"blue"}
								>
									<Button
										variant="contained"
										// color="success"
										// startDecorator={<Add />}
										onClick={filtrar}
									>
										CSV
									</Button>
								</Grid>
								<Grid
									xs={12}
									sm={4}
									md={4}
									lg={6}
									maxHeight={50}
									marginTop={2}
									// bgcolor={"green"}
								></Grid>
							</Grid>
						</Grid>
					</Grid>
				</Box>

				<Document
					file={`data:application/pdf;base64,${sourceRef.current}`}
					onLoadSuccess={onDocumentLoadSuccess}
				>
					{Array.from(new Array(numPages), (el, index) => (
						<Page
							key={`page_${index + 1}`}
							pageNumber={index + 1}
							renderTextLayer={false}
							renderAnnotationLayer={false}
						/>
					))}
				</Document>
			</Container>
		</div>
	);
};

export default ReportesList;
