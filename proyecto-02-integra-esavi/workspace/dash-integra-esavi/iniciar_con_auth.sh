#!/usr/bin/env Rscript

cat("\n")
cat("════════════════════════════════════════════════════════\n")
cat("  PRUEBA RÁPIDA - Dashboard con Autenticación\n")
cat("════════════════════════════════════════════════════════\n")
cat("\n")
cat("📋 Instrucciones:\n")
cat("   1. La aplicación se iniciará en el puerto 3939\n")
cat("   2. Abre MANUALMENTE una de estas URLs:\n")
cat("\n")
cat("   ✅ CON TOKEN (debe funcionar):\n")
cat("      http://127.0.0.1:3939/?token=token_ejemplo_1\n")
cat("\n")
cat("   ❌ SIN TOKEN (debe mostrar acceso denegado):\n")
cat("      http://127.0.0.1:3939/\n")
cat("\n")
cat("🛑 Presiona Ctrl+C para detener el servidor\n")
cat("════════════════════════════════════════════════════════\n")
cat("\n")

# Pequeña pausa para que puedas leer
Sys.sleep(3)

# Ejecutar la aplicación
cat("🚀 Iniciando servidor...\n\n")

library(shiny)
runApp(
  appDir = "app.R",
  host = "127.0.0.1",
  port = 3939,
  launch.browser = FALSE
)
