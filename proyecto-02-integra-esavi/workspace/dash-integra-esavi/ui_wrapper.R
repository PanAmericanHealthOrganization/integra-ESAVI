# ---------------------------------------------------------------------------- -
# Script: ui_wrapper.R ----
# Descripción: Wrapper de UI con sistema de autenticación
# ---------------------------------------------------------------------------- -

# Cargar la configuración global y de autenticación
source("global.R")

# UI con sistema de autenticación integrado
ui_with_auth <- fluidPage(
  # Usar shinyjs para manipulación dinámica
  useShinyjs(),

  # Contenedor para la UI dinámica
  uiOutput("main_ui")
)
