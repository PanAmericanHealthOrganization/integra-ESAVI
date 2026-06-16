import App from './App'
import { AuthProvider } from './contexts/AuthContext '
import reportWebVitals from './reportWebVitals'
import { createRoot } from 'react-dom/client'
import { useHealthCheck } from './hooks/useHealthCheck'
import { MaintenancePage } from './pages/maintenance/MaintenancePage'

const AppWithHealthGuard = () => {
  const { status, lastChecked, retry } = useHealthCheck(30_000)

  if (status !== 'ok') {
    return (
      <MaintenancePage
        status={status}
        lastChecked={lastChecked}
        onRetry={retry}
      />
    )
  }

  return <App />
}

const container = document.getElementById('root')
const root = createRoot(container as Element)

root.render(
  <AuthProvider>
    <AppWithHealthGuard />
  </AuthProvider>
)

reportWebVitals()
