import React, { useEffect, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import { dashboardDataProvider } from '../../dataProviders/dashboard.dataprovider';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const optionsGrave = {
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

const optionsNoGrave = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'top' as const
		},
		title: {
			display: true,
			text: 'Casos esavi por sexo no grave'
		}
	}
};

const optionsPorAnio = {
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
		labels: [
			'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
			'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
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
		try {
			console.log('*** INICIO consultar', process.env.REACT_APP_ESAVI_GRAVE);
			const respuesta = await dashboardDataProvider.casosEsaviPorSexoGrave();
			console.log('*** casosEsaviPorSexoGrave', respuesta);
	
			// Verificar si la respuesta es válida antes de parsearla como JSON
			if (respuesta && respuesta.msg === 'OK' && respuesta.data) {
				const cantidad = respuesta.data.map((d: any) => parseInt(d.cantidad));
				const labels = respuesta.data.map((d: any) => d.sexo);
	
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
			} else {
				console.error('Error en la solicitud casosEsaviPorSexoGrave: Respuesta inválida', respuesta);
				// Manejar el error como consideres adecuado (ej. mostrar un mensaje al usuario)
			}
		} catch (error) {
			console.error('Error en la solicitud casosEsaviPorSexoGrave:', error);
			// Manejar error de red u otros errores
			// Ej. mostrar un mensaje de error al usuario
		}
	};

	const consultar2 = async () => {
		try {
			const respuesta = await dashboardDataProvider.casosEsaviPorSexoNoGrave();
			console.log('*** casosEsaviPorSexoNoGrave', respuesta);
	
			// Verificar si la respuesta es válida antes de parsearla como JSON
			if (respuesta && respuesta.msg === 'OK' && respuesta.data) {
				const cantidad = respuesta.data.map((d: any) => parseInt(d.cantidad));
				const labels = respuesta.data.map((d: any) => d.sexo);
	
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
			} else {
				console.error('Error en la solicitud casosEsaviPorSexoNoGrave: Respuesta inválida', respuesta);
				// Manejar el error como consideres adecuado (ej. mostrar un mensaje al usuario)
			}
		} catch (error) {
			console.error('Error en la solicitud casosEsaviPorSexoNoGrave:', error);
			// Manejar error de red u otros errores
			// Ej. mostrar un mensaje de error al usuario
		}
	};
	
	const consultar3 = async () => {
		try {
			const respuesta = await dashboardDataProvider.casosEsaviPorMes();
			console.log('*** casosEsaviPorMes', respuesta);
	
			// Verificar si la respuesta es válida antes de parsearla como JSON
			if (respuesta && respuesta.msg === 'OK' && respuesta.data) {
				const labels = respuesta.data.map((d: any) => d.mes);
				const graves = respuesta.data.map((d: any) => parseInt(d.grave));
				const noGraves = respuesta.data.map((d: any) => parseInt(d.nograve));
	
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
			} else {
				console.error('Error en la solicitud casosEsaviPorMes: Respuesta inválida', respuesta);
				// Manejar el error como consideres adecuado (ej. mostrar un mensaje al usuario)
			}
		} catch (error) {
			console.error('Error en la solicitud casosEsaviPorMes:', error);
			// Manejar error de red u otros errores
			// Ej. mostrar un mensaje de error al usuario
		}
	};
	
	useEffect(() => {
		consultar();
		consultar2();
		consultar3();
	}, []);

	return (
		<Box sx={{ flexGrow: 1 }}>
			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Pie data={dataCasosEsaviPorSexoNoGrave as any} options={optionsNoGrave} />
				</Grid>
				<Grid item xs={12} md={6}>
					<Pie data={dataCasosEsaviPorSexoGrave as any} options={optionsGrave} />
				</Grid>
				<Grid item xs={12}>
					<Bar data={datosCasosEsaviPorMes} options={optionsPorAnio} />
				</Grid>
			</Grid>
		</Box>
	);
};

export default DashBoardList;
