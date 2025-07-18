import { useEffect, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import { dashboardDataProvider } from '../../dataProviders/dashboard.dataprovider';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);


const AnalisisList = () => {
	



	return (
		<Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ width: '100%', height: '80vh', border: '1px solid #ccc' }}>
            <iframe
            //   src="https://42f63b806105.ngrok.app/"
              src="https://c53ef31e4190.ngrok.app"
              title="React Admin"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
	);
};

export default AnalisisList;
