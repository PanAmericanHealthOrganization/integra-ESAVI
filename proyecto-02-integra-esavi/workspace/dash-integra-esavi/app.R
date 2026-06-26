#!/usr/bin/env Rscript

# ---------------------------------------------------------------------------- -
# Script: app.R ----
# Descripción: Archivo principal de la aplicación Shiny CON autenticación
# Uso: Para ejecutar con sistema de autenticación para iframe embebido
#
# IMPORTANTE: Este archivo implementa autenticación basada en tokens.
# Para ejecutar SIN autenticación, usa run.R en su lugar.
# ---------------------------------------------------------------------------- -

# NOTA: Para desarrollo sin autenticación, usa: ./ejecutar_dashboard.sh o run.R

# Cargar solo auth_config para validación inicial
library(shiny)
library(digest)
source("auth_config.R")
source("auth_ui.R")

# Variable global para saber si está autenticado
AUTH_VALIDATED <- FALSE

# UI condicional basada en token
ui_with_auth <- function(req) {
  query <- parseQueryString(req$QUERY_STRING)
  auth_token <- query$token
  
  # Validar token
  is_valid <- validate_auth_token(auth_token)
  log_access_attempt(auth_token, req$HTTP_REFERER, is_valid)
  
  # Guardar estado para el servidor
  AUTH_VALIDATED <<- is_valid
  
  if (is_valid) {
    # Token válido - cargar UI del dashboard
    cat("✅ Token válido - cargando dashboard\n")
    # Cargar global y UI solo si el token es válido
    source("global.R", local = TRUE)
    source("ui.R", local = TRUE)
    return(ui)
  } else {
    # Token inválido - mostrar pantalla de error
    cat("⚠️  Acceso denegado - token inválido o ausente\n")
    return(access_denied_ui())
  }
}

# Servidor condicional
server_with_auth <- function(input, output, session) {
  if (AUTH_VALIDATED) {
    cat("✅ Inicializando servidor del dashboard\n")
    # Cargar servidor solo si el token es válido
    source("server.R", local = TRUE)
    server(input, output, session)
  } else {
    cat("⚠️  Servidor no inicializado - acceso denegado\n")
  }
}

runApp(
  list(ui = ui_with_auth, server = server_with_auth),
  host = "0.0.0.0",
  port = 80,
  launch.browser = FALSE
)