# ---------------------------------------------------------------------------- -
# Script: auth_config.R ----
# Descripción: Configuración de seguridad para iframe embebido
# ---------------------------------------------------------------------------- -

# IMPORTANTE: En producción, almacena estos tokens en variables de entorno
# o en una base de datos segura, NO en código versionado

# Lista de tokens válidos (generados por la aplicación contenedora)
# Ejemplo: Generar tokens seguros con: digest::digest(paste0("secret", Sys.time()), algo = "sha256")
VALID_TOKENS <- c(
 "ff077f9ffab37231143330481a589ec3b7f4de183a97cf149c93ebefc88adaeb"
)

# Obtener tokens desde variables de entorno (recomendado para producción)
env_tokens <- Sys.getenv("DASHBOARD_AUTH_TOKENS", "")
if (nchar(env_tokens) > 0) {
  VALID_TOKENS <- c(VALID_TOKENS, strsplit(env_tokens, ",")[[1]])
}

# Lista de dominios permitidos para embedding (opcional)
ALLOWED_DOMAINS <- c(
  "https://tu-dominio.com",
  "https://127.0.0.1:3838",
  "https://127.0.0.1:80",
  "http://127.0.0.1:5194",
  "http://0.0.0.0:80",
  "https://app.tu-dominio.com"
)

# Tiempo de expiración del token en segundos (opcional)
TOKEN_EXPIRATION <- 3600 # 1 hora

# Función para validar el token
validate_auth_token <- function(token) {
  if (is.null(token) || token == "" || !is.character(token)) {
    return(FALSE)
  }
  
  # Validar que el token esté en la lista de tokens válidos
  return(token %in% VALID_TOKENS)
}

# Función para validar el origen del iframe (Referer)
validate_referer <- function(referer) {
  if (is.null(referer) || referer == "") {
    return(FALSE)
  }
  
  # Verificar si el referer está en la lista de dominios permitidos
  return(any(sapply(ALLOWED_DOMAINS, function(domain) {
    grepl(domain, referer, fixed = TRUE)
  })))
}

# Función para generar un nuevo token (para uso administrativo)
generate_auth_token <- function(secret_key = "my_secret_key") {
  timestamp <- as.character(as.numeric(Sys.time()))
  raw_token <- paste0(secret_key, timestamp)
  token <- digest::digest(raw_token, algo = "sha256")
  return(token)
}

# Función para logging de intentos de acceso (opcional)
log_access_attempt <- function(token, referer, success) {
  log_entry <- paste0(
    "[", Sys.time(), "] ",
    "Token: ", ifelse(is.null(token), "NULL", substr(token, 1, 10)), "... | ",
    "Referer: ", ifelse(is.null(referer), "NULL", referer), " | ",
    "Success: ", success
  )
  
  # Escribir en archivo de log (opcional)
  # write(log_entry, file = "access_log.txt", append = TRUE)
  
  # Imprimir en consola (para desarrollo)
  cat(log_entry, "\n")
}
