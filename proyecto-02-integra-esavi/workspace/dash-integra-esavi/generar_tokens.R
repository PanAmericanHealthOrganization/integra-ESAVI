# ---------------------------------------------------------------------------- -
# Script: generar_tokens.R ----
# Descripción: Utilidad para generar tokens de autenticación seguros
# Uso: source("generar_tokens.R") y luego llamar generar_tokens()
# ---------------------------------------------------------------------------- -

# Cargar librería necesaria
if (!requireNamespace("digest", quietly = TRUE)) {
  install.packages("digest")
}
library(digest)

# Función para generar un token seguro
generar_token_seguro <- function(prefix = "dashboard", seed = NULL) {
  # Si se proporciona una semilla, usarla para reproducibilidad
  if (!is.null(seed)) {
    set.seed(seed)
  }
  
  # Generar un token usando timestamp + datos aleatorios
  timestamp <- as.character(as.numeric(Sys.time()))
  random_data <- paste(sample(c(letters, LETTERS, 0:9), 32, replace = TRUE), collapse = "")
  
  # Crear el hash
  raw_token <- paste0(prefix, "_", timestamp, "_", random_data)
  token <- digest(raw_token, algo = "sha256")
  
  return(token)
}

# Función para generar múltiples tokens
generar_tokens <- function(cantidad = 5, nombres = NULL) {
  cat("\n")
  cat("=================================================================\n")
  cat("  GENERADOR DE TOKENS DE AUTENTICACIÓN\n")
  cat("=================================================================\n\n")
  
  tokens <- list()
  
  for (i in 1:cantidad) {
    nombre <- if (!is.null(nombres) && i <= length(nombres)) {
      nombres[i]
    } else {
      paste0("Cliente_", i)
    }
    
    token <- generar_token_seguro(prefix = nombre)
    tokens[[nombre]] <- token
    
    cat(sprintf("Token #%d (%s):\n", i, nombre))
    cat(sprintf("  %s\n\n", token))
  }
  
  cat("-----------------------------------------------------------------\n")
  cat("CONFIGURACIÓN PARA auth_config.R:\n")
  cat("-----------------------------------------------------------------\n\n")
  cat("VALID_TOKENS <- c(\n")
  for (i in 1:length(tokens)) {
    nombre <- names(tokens)[i]
    token <- tokens[[i]]
    comma <- if (i < length(tokens)) "," else ""
    cat(sprintf('  "%s"%s  # %s\n', token, comma, nombre))
  }
  cat(")\n\n")
  
  cat("-----------------------------------------------------------------\n")
  cat("CONFIGURACIÓN PARA .env:\n")
  cat("-----------------------------------------------------------------\n\n")
  cat(sprintf("DASHBOARD_AUTH_TOKENS=%s\n\n", paste(tokens, collapse = ",")))
  
  cat("=================================================================\n")
  cat("  TOKENS GENERADOS EXITOSAMENTE\n")
  cat("  ⚠️  GUARDA ESTOS TOKENS EN UN LUGAR SEGURO\n")
  cat("  ⚠️  NO LOS COMPARTAS PÚBLICAMENTE\n")
  cat("=================================================================\n\n")
  
  return(invisible(tokens))
}

# Función para generar un solo token rápidamente
generar_un_token <- function(nombre = "nuevo_cliente") {
  token <- generar_token_seguro(prefix = nombre)
  cat("\nToken generado para", nombre, ":\n")
  cat(token, "\n\n")
  return(invisible(token))
}

# Función para validar un token (útil para pruebas)
validar_formato_token <- function(token) {
  # Verificar longitud (SHA256 produce 64 caracteres hex)
  longitud_valida <- nchar(token) == 64
  
  # Verificar que solo contenga caracteres hexadecimales
  patron_valido <- grepl("^[0-9a-f]+$", token)
  
  es_valido <- longitud_valida && patron_valido
  
  cat("\nValidación del token:\n")
  cat("  Longitud correcta (64 caracteres):", longitud_valida, "\n")
  cat("  Formato hexadecimal válido:", patron_valido, "\n")
  cat("  Resultado:", ifelse(es_valido, "✅ VÁLIDO", "❌ INVÁLIDO"), "\n\n")
  
  return(invisible(es_valido))
}

# Función para crear un archivo de configuración
crear_archivo_config <- function(tokens, archivo = "tokens_generados.txt") {
  conn <- file(archivo, "w")
  
  writeLines("# =================================================================", conn)
  writeLines("# TOKENS DE AUTENTICACIÓN GENERADOS", conn)
  writeLines(paste("# Fecha de generación:", Sys.time()), conn)
  writeLines("# =================================================================", conn)
  writeLines("", conn)
  
  writeLines("# Para auth_config.R:", conn)
  writeLines("VALID_TOKENS <- c(", conn)
  for (i in 1:length(tokens)) {
    nombre <- names(tokens)[i]
    token <- tokens[[i]]
    comma <- if (i < length(tokens)) "," else ""
    writeLines(sprintf('  "%s"%s  # %s', token, comma, nombre), conn)
  }
  writeLines(")", conn)
  writeLines("", conn)
  
  writeLines("# Para .env:", conn)
  writeLines(sprintf("DASHBOARD_AUTH_TOKENS=%s", paste(tokens, collapse = ",")), conn)
  writeLines("", conn)
  
  writeLines("# Tokens individuales:", conn)
  for (i in 1:length(tokens)) {
    nombre <- names(tokens)[i]
    token <- tokens[[i]]
    writeLines(sprintf("# %s: %s", nombre, token), conn)
  }
  
  close(conn)
  
  cat("\n✅ Tokens guardados en:", archivo, "\n")
  cat("⚠️  IMPORTANTE: Mantén este archivo seguro y no lo subas a control de versiones\n\n")
}

# Ejemplo de uso al cargar el script
cat("\n")
cat("╔═══════════════════════════════════════════════════════════════════╗\n")
cat("║         GENERADOR DE TOKENS DE AUTENTICACIÓN                     ║\n")
cat("╚═══════════════════════════════════════════════════════════════════╝\n")
cat("\n")
cat("Funciones disponibles:\n")
cat("  • generar_tokens(cantidad, nombres) - Genera múltiples tokens\n")
cat("  • generar_un_token(nombre)          - Genera un token individual\n")
cat("  • validar_formato_token(token)      - Valida el formato de un token\n")
cat("  • crear_archivo_config(tokens)      - Guarda tokens en archivo\n")
cat("\n")
cat("Ejemplos de uso:\n")
cat('  tokens <- generar_tokens(3, c("App1", "App2", "App3"))\n')
cat('  token <- generar_un_token("MiApp")\n')
cat('  validar_formato_token("abc123...")\n')
cat('  crear_archivo_config(tokens, "mis_tokens.txt")\n')
cat("\n")
