# ---------------------------------------------------------------------------- -
# Script: auth_ui.R ----
# Descripción: UI para pantalla de acceso denegado
# ---------------------------------------------------------------------------- -

# Pantalla de acceso denegado
access_denied_ui <- function() {
  fluidPage(
    tags$head(
      tags$style(HTML("
        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Helvetica Neue', Arial, sans-serif;
          height: 100vh;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .access-denied-container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          padding: 60px 80px;
          text-align: center;
          max-width: 500px;
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lock-icon {
          font-size: 80px;
          color: #e74c3c;
          margin-bottom: 20px;
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .denied-title {
          font-size: 32px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 15px;
        }
        .denied-message {
          font-size: 16px;
          color: #7f8c8d;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .error-code {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #e74c3c;
          margin-top: 20px;
        }
        .contact-info {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ecf0f1;
          font-size: 14px;
          color: #95a5a6;
        }
      "))
    ),
    div(class = "access-denied-container",
      div(class = "lock-icon", "🔒"),
      div(class = "denied-title", "Acceso Denegado"),
      div(class = "denied-message",
        "Esta aplicación solo puede ser accedida a través de la plataforma autorizada.",
        br(),
        "Por favor, acceda desde el sistema principal con credenciales válidas."
      ),
      div(class = "error-code",
        "ERROR: INVALID_AUTH_TOKEN",
        br(),
        "Código: 403 - Forbidden"
      ),
      div(class = "contact-info",
        "Si cree que esto es un error, contacte al administrador del sistema."
      )
    )
  )
}

# Pantalla de carga mientras se valida
auth_loading_ui <- function() {
  fluidPage(
    tags$head(
      tags$style(HTML("
        body {
          background: #f5f7fa;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          height: 100vh;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .loading-container {
          text-align: center;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loading-text {
          font-size: 18px;
          color: #7f8c8d;
        }
      "))
    ),
    div(class = "loading-container",
      div(class = "spinner"),
      div(class = "loading-text", "Verificando autenticación...")
    )
  )
}
