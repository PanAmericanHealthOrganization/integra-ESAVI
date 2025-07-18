import App from './App';
import { AuthProvider } from './contexts/AuthContext ';
import keycloak from './keycloak';
import reportWebVitals from './reportWebVitals';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container as Element);

keycloak
	.init({
		onLoad: 'login-required' ,
		checkLoginIframe: false
	})
	.then((authenticated) => {
		if (authenticated) {

			root.render(<AuthProvider><App /></AuthProvider>);
		} else {
			console.error('Authentication failed');
		}
	})
	.catch((error) => {
		console.error('Failed to initialize Keycloak', error);
	});
// root.render(<AuthProvider><App /></AuthProvider>);

reportWebVitals();
