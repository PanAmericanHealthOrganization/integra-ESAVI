import App from './App';
import { AuthProvider } from './contexts/AuthContext ';
import reportWebVitals from './reportWebVitals';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container as Element);

root.render(<AuthProvider><App /></AuthProvider>);

reportWebVitals();
