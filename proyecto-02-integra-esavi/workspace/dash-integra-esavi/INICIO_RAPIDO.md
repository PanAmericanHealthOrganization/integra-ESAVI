# 🔐 Sistema de Seguridad para Dashboard ESAVI

## ✅ Instalación Completada

Se ha implementado un sistema completo de autenticación basado en tokens para proteger tu dashboard cuando se embeba en un iframe.

## 📁 Archivos Creados

### Archivos Principales de Autenticación
- ✅ `auth_config.R` - Configuración de tokens y validación
- ✅ `auth_ui.R` - Interfaz de acceso denegado
- ✅ `ui_wrapper.R` - Wrapper de UI con autenticación
- ✅ `app.R` - Punto de entrada con seguridad activada

### Archivos de Utilidad
- ✅ `generar_tokens.R` - Generador de tokens seguros
- ✅ `test_auth.R` - Script de pruebas
- ✅ `ejemplo_integracion.html` - Ejemplo de uso en HTML

### Documentación
- ✅ `README_AUTENTICACION.md` - Documentación completa
- ✅ `.env.example` - Plantilla de configuración
- ✅ `.gitignore` - Actualizado para proteger tokens

## 🚀 Inicio Rápido

### Paso 1: Generar Tokens
```r
# En R o RStudio
source("generar_tokens.R")
generar_tokens(3, c("App1", "App2", "App3"))
```

### Paso 2: Configurar Tokens
Edita `auth_config.R` y agrega tus tokens:
```r
VALID_TOKENS <- c(
  "tu_token_generado_1",
  "tu_token_generado_2"
)
```

### Paso 3: Probar Sistema
```bash
# Ejecutar pruebas
Rscript test_auth.R
```

### Paso 4: Ejecutar Dashboard
```bash
# Con autenticación (RECOMENDADO)
Rscript -e "shiny::runApp('app.R', port=3838)"

# Sin autenticación (modo desarrollo)
Rscript run.R
```

### Paso 5: Probar en Navegador
```
✅ CON TOKEN: http://localhost:3838/?token=tu_token_generado_1
❌ SIN TOKEN: http://localhost:3838/
```

## 🔗 Uso en Iframe

### HTML Simple
```html
<iframe 
  src="http://tu-servidor.com/?token=tu_token_aqui"
  width="100%" 
  height="800px">
</iframe>
```

### JavaScript Dinámico
```javascript
const token = obtenerTokenDeBackend(); // Tu función
const iframe = document.createElement('iframe');
iframe.src = `http://tu-servidor.com/?token=${token}`;
document.body.appendChild(iframe);
```

## ⚙️ Configuración Producción

### Variables de Entorno (Recomendado)
```bash
export DASHBOARD_AUTH_TOKENS="token1,token2,token3"
```

### Docker
```dockerfile
ENV DASHBOARD_AUTH_TOKENS="token1,token2,token3"
```

## 🛡️ Seguridad

### ✅ Buenas Prácticas
- ✅ Usa tokens largos generados con `generar_tokens.R`
- ✅ Nunca subas tokens a git (están en .gitignore)
- ✅ Usa variables de entorno en producción
- ✅ Rota tokens cada 3-6 meses
- ✅ Usa HTTPS siempre

### ❌ Evitar
- ❌ Tokens simples como "123" o "token"
- ❌ Compartir tokens entre múltiples aplicaciones
- ❌ Exponer tokens en código público
- ❌ Usar HTTP en producción

## 📊 Qué Hace el Sistema

1. **Usuario accede** → La aplicación contenedora genera URL con token
2. **Dashboard recibe** → Valida el token en `server.R`
3. **Token válido** → Muestra el dashboard completo
4. **Token inválido** → Muestra pantalla de acceso denegado

## 🧪 Comandos de Prueba

```bash
# Generar tokens
Rscript generar_tokens.R

# Probar autenticación
Rscript test_auth.R

# Ejecutar con autenticación
Rscript -e "shiny::runApp('app.R', port=3838)"

# Ver ejemplo de integración
open ejemplo_integracion.html
```

## 📞 Ayuda Rápida

### Problema: "Acceso Denegado"
1. Verifica que el token esté en `auth_config.R`
2. Revisa la URL: debe incluir `?token=tu_token`
3. Ejecuta `test_auth.R` para validar configuración

### Problema: Error al cargar
1. Verifica que todos los archivos existan
2. Ejecuta primero sin autenticación: `Rscript run.R`
3. Revisa errores en consola de R

## 📚 Más Información

Lee `README_AUTENTICACION.md` para documentación completa con:
- Configuración avanzada
- Ejemplos detallados
- Mejores prácticas de seguridad
- Solución de problemas
- Configuración Docker/Shiny Server

## 🎯 ¿Qué Sigue?

1. ✅ Genera tokens con `generar_tokens.R`
2. ✅ Configúralos en `auth_config.R`
3. ✅ Prueba con `test_auth.R`
4. ✅ Ejecuta con `app.R`
5. ✅ Integra en tu aplicación contenedora

---

**¡Sistema de autenticación listo para usar! 🎉**
