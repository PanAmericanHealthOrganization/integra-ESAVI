import App from './App';
import keycloak from './keycloak';
import reportWebVitals from './reportWebVitals';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container as Element);

keycloak
	.init({ onLoad: 'login-required' })
	.then((authenticated) => {
		if (authenticated) {
			root.render(<App />);
		} else {
			console.error('Authentication failed');
		}
	})
	.catch((error) => {
		console.error('Failed to initialize Keycloak', error);
	});
reportWebVitals();
