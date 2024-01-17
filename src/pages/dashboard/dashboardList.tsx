import { useEffect, useState } from 'react';

import { dashboardDataProvider } from '../../dataProviders/dashboard.dataprovider';

ChartJS.register(ArcElement, Tooltip, Legend);

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	ArcElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';

// import { Document, Page } from 'react-pdf/dist/esm/entry.vite';

import useStateRef from 'react-usestateref';
import { Box, Grid } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const labels = [
	{ mes: 'Enero', graves: 10, noGraves: 25 },
	{ mes: 'Febrero', graves: 20, noGraves: 25 },
	{ mes: 'Marzo', graves: 30, noGraves: 25 },
	{ mes: 'Abril', graves: 50, noGraves: 25 },
	{ mes: 'Mayo', graves: 60, noGraves: 25 },
	{ mes: 'Junio', graves: 50, noGraves: 25 },
	{ mes: 'Julio', graves: 50, noGraves: 25 },
	{ mes: 'Agosto', graves: 80, noGraves: 25 },
	{ mes: 'Septiembre', graves: 70, noGraves: 25 },
	{ mes: 'Octubre', graves: 50, noGraves: 25 },
	{ mes: 'Noviembre', graves: 90, noGraves: 25 },
	{ mes: 'Diciembre', graves: 100, noGraves: 25 }
];



export const optionsGrave = {
	responsive: true,
	maintainAspectRatio: false,

	plugins: {
		legend: {
			position: 'top' as const
		},
		title: {
			display: true,
			text: 'Casos esavi por sexo grave'
		}
	}
};

export const optionsNoGrave = {
	responsive: true,
	maintainAspectRatio: false,

	plugins: {
		legend: {
			position: 'top' as const
		},
		title: {
			display: true,
			text: 'Casos esavi por sexo no grave'
		},
		
	}
};

export const optionsPorAnio = {
	responsive: true,
	maintainAspectRatio: false,

	plugins: {
		legend: {
			position: 'top' as const
		},
		title: {
			display: true,
			text: 'Casos esavi grave/ no grave 2021'
		}
	}
};
const DashBoardList = () => {
	const [dataCasosEsaviPorSexoGrave, setDataCasosEsaviPorSexoGrave] = useState({
		labels: ['NO REGISTRA', 'DESCONOCIDO', 'HOMBRE', 'MUJER'],
		datasets: [
			{
				label: 'CANTIDAD',
				data: [0, 0, 0, 0],
				backgroundColor: [
					'rgba(255, 99, 132, 0.2)',
					'rgba(54, 162, 235, 0.2)',
					'rgba(255, 206, 86, 0.2)',
					'rgba(75, 192, 192, 0.2)'
				],
				borderColor: [
					'rgba(255, 99, 132, 1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)'
				],
				borderWidth: 1
			}
		]
	});

	const [dataCasosEsaviPorSexoNoGrave, setDataCasosEsaviPorSexoNoGrave] = useState({
		labels: ['NO REGISTRA', 'DESCONOCIDO', 'HOMBRE', 'MUJER'],
		datasets: [
			{
				label: 'CANTIDAD',
				data: [0, 0, 0, 0],
				backgroundColor: [
					'rgba(255, 99, 132, 0.2)',
					'rgba(54, 162, 235, 0.2)',
					'rgba(255, 206, 86, 0.2)',
					'rgba(75, 192, 192, 0.2)'
				],
				borderColor: [
					'rgba(255, 99, 132, 1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)'
				],
				borderWidth: 1
			}
		]
	});

	const [datosCasosEsaviPorMes, setDatosCasosEsaviPorMes] = useState({
		labels:[
			'Enero',
			'Febrero',
			'Marzo', 
			'Abril',
			'Mayo',
			'Junio', 
			'Julio', 
			'Agosto', 
			'Septiembre',
			'Octubre', 
			'Noviembre', 
			'Diciembre' 
		],
		datasets: [
			{
				label: 'Graves',
				data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
				backgroundColor: 'rgba(255, 99, 132, 0.5)'
			},
			{
				label: 'No graves',
				data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
				backgroundColor: 'rgba(53, 162, 235, 0.5)'
			}
		]
	});

	const consultar = async () => {
		const respuesta = await dashboardDataProvider.casosEsaviPorSexoGrave();
		if (respuesta.msg === 'OK') {
			const cantidad = respuesta.data.map((d: any) => d.cantidad);
			const labels = respuesta.data.map((d: any) => d.sexo);
			console.log('cantidad::: ', cantidad);

			const data = {
				labels: labels,
				datasets: [
					{
						label: 'CANTIDAD',
						data: cantidad,
						backgroundColor: [
							'rgba(255, 99, 132, 0.2)',
							'rgba(54, 162, 235, 0.2)',
							'rgba(255, 206, 86, 0.2)',
							'rgba(75, 192, 192, 0.2)'
						],
						borderColor: [
							'rgba(255, 99, 132, 1)',
							'rgba(54, 162, 235, 1)',
							'rgba(255, 206, 86, 1)',
							'rgba(75, 192, 192, 1)'
						],
						borderWidth: 1
					}
				]
			};

			setDataCasosEsaviPorSexoGrave(data);
		}
	};

	const consultar2 = async () => {
		const respuesta = await dashboardDataProvider.casosEsaviPorSexoNoGrave();
		if (respuesta.msg === 'OK') {
			const cantidad = respuesta.data.map((d: any) => d.cantidad);
			const labels = respuesta.data.map((d: any) => d.sexo);
			console.log('cantidad::: ', cantidad);

			const data = {
				labels: labels,
				datasets: [
					{
						label: 'CANTIDAD',
						data: cantidad,
						backgroundColor: [
							'rgba(255, 99, 132, 0.2)',
							'rgba(54, 162, 235, 0.2)',
							'rgba(255, 206, 86, 0.2)',
							'rgba(75, 192, 192, 0.2)'
						],
						borderColor: [
							'rgba(255, 99, 132, 1)',
							'rgba(54, 162, 235, 1)',
							'rgba(255, 206, 86, 1)',
							'rgba(75, 192, 192, 1)'
						],
						borderWidth: 1
					}
				]
			};

			setDataCasosEsaviPorSexoNoGrave(data);
		}
	};


	const consultar3 = async () => {
		const respuesta = await dashboardDataProvider.casosEsaviPorMes();
		if (respuesta.msg === 'OK') {
			const labels = respuesta.data.map((d: any) => d.mes);
			const graves = respuesta.data.map((d: any) => d.grave );
			const noGraves = respuesta.data.map((d: any) => d.nograve);

			const data = {
				labels: labels,

				datasets: [
					{
						label: 'Graves',
						data: graves,
						backgroundColor: 'rgba(255, 99, 132, 0.5)'
					},
					{
						label: 'No graves',
						data: noGraves,
						backgroundColor: 'rgba(53, 162, 235, 0.5)'
					}
				]




			};

			setDatosCasosEsaviPorMes(data);
		}
	};

	useEffect(() => {
		consultar();
		consultar2();
		consultar3();
	}, []);

	return (
		<>
			<Box sx={{ flexGrow: 1 }}>
				<Grid container border={1} borderColor={'divider'} margin={1}>
					<Grid
						xs={6}
						md={6}
						xl={6}
						// bgcolor={'blue'}
						alignSelf={'center'}
						minHeight={300}
					>
						<Pie data={dataCasosEsaviPorSexoNoGrave as any} options={optionsNoGrave} />
					</Grid>

					<Grid
						xs={6}
						md={6}
						xl={6}
						// bgcolor={'blue'}
						alignSelf={'center'}
						minHeight={300}
					>
						<Pie data={dataCasosEsaviPorSexoGrave as any} options={optionsGrave} />
					</Grid>
				</Grid>

				<Grid
					xs={6}
					md={6}
					xl={6}
					// bgcolor={'green'}
					alignSelf={'center'}
					minHeight={300}
				>
					<Bar options={optionsPorAnio} data={datosCasosEsaviPorMes} />
				</Grid>
			</Box>
		</>
	);
};

export default DashBoardList;
