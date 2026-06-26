# ---------------------------------------------------------------------------- -
# Script: server_auth.R ----
# Descripción: Wrapper del servidor con autenticación integrada
# Este archivo reemplaza al server.R cuando se quiere usar autenticación
# ---------------------------------------------------------------------------- -

source("global.R")

# Cargar el servidor original
source("server.R")

# Crear servidor con autenticación
server_with_auth <- function(input, output, session) {
  
  # --------------------------------------------------------------------------
  # Sistema de autenticación para iframe embebido
  # --------------------------------------------------------------------------
  
  # Variable reactiva para controlar el estado de autenticación
  authenticated <- reactiveVal(FALSE)
  
  # Verificar autenticación al inicio
  observe({
    # Obtener los query parameters de la URL
    query <- parseQueryString(session$clientData$url_search)
    
    # Obtener el token de autenticación
    auth_token <- query$token
    
    # Obtener el referer (origen de la petición)
    referer <- if (!is.null(session$request)) {
      session$request$HTTP_REFERER
    } else {
      NULL
    }
    
    # Validar el token
    is_valid <- validate_auth_token(auth_token)
    
    # Opcional: También validar el referer
    # is_valid <- is_valid && validate_referer(referer)
    
    # Log del intento de acceso
    log_access_attempt(auth_token, referer, is_valid)
    
    # Actualizar estado de autenticación
    authenticated(is_valid)
    
    if (!is_valid) {
      cat("⚠️  Acceso denegado - Token inválido o ausente\n")
      if (!is.null(query) && length(query) > 0) {
        cat("   Parámetros recibidos:", paste(names(query), collapse=", "), "\n")
      }
    } else {
      cat("✅ Acceso autorizado exitosamente\n")
    }
  })
  
  # Mostrar/ocultar UI según autenticación
  output$auth_status <- renderUI({
    if (!authenticated()) {
      # Mostrar pantalla de acceso denegado
      access_denied_ui()
    } else {
      # No mostrar nada, dejar pasar la UI normal
      NULL
    }
  })
  
  # Controlar visibilidad con JavaScript
  observe({
    if (authenticated()) {
      shinyjs::show(id = "main-content", anim = TRUE, animType = "fade")
      shinyjs::hide(id = "auth-screen")
    } else {
      shinyjs::hide(id = "main-content")
      shinyjs::show(id = "auth-screen", anim = TRUE, animType = "fade")
    }
  })
  
  # Ejecutar el servidor original solo si está autenticado
  observeEvent(authenticated(), {
    if (authenticated()) {
      # Llamar a la función del servidor original
      server(input, output, session)
    }
  }, once = TRUE)
}
