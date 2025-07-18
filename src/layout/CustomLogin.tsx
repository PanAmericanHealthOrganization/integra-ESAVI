import PasswordRecovery from './PasswordRecovery';
import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { Login } from 'react-admin';

export const CustomLoginPage = () => {
	const [showRecovery, setShowRecovery] = useState(false);

	return (
		<Box>
			{showRecovery ? (
				<>
					<PasswordRecovery />
					<Button onClick={() => setShowRecovery(false)} fullWidth sx={{ mt: 2 }}>
						Volver al inicio de sesión
					</Button>
				</>
			) : (
				<>
					<Login
						// A random image that changes everyday
						backgroundImage="https://www.paho.org/sites/default/files/styles/max_1500x1500/public/2020-10/covid-19-vaccine-production.jpg?itok=9SqELwYE"
					/>
					<Button onClick={() => setShowRecovery(true)} fullWidth sx={{ mt: 2 }}>
						¿Olvidaste tu contraseña?
					</Button>
				</>
			)}
		</Box>
	);
};
