# 🎯 GUÍA RÁPIDA: Implementación Completada

## ✅ ¿Qué se ha implementado?

Se ha agregado un **sistema de autenticación basado en tokens** a tu dashboard ESAVI para que solo se muestre cuando la aplicación contenedora proporcione un token válido en la URL del iframe.

## 📦 Archivos Nuevos Creados

```
Tu proyecto/
├── auth_config.R              ← Configuración de tokens
├── auth_ui.R                  ← UI de acceso denegado  
├── app.R                      ← App CON autenticación
├── generar_tokens.R           ← Utilidad para generar tokens
├── test_auth.R                ← Script de pruebas
├── ejemplo_integracion.html   ← Ejemplo de uso en HTML
├── README_AUTENTICACION.md    ← Documentación completa
├── INICIO_RAPIDO.md           ← Guía rápida
└── .env.example               ← Plantilla de configuración
```

## 🚀 3 Pasos Para Comenzar

### 1️⃣ Genera tus tokens seguros
```bash
Rscript generar_tokens.R
```

Esto mostrará algo como:
```
Token #1 (Cliente_1):
  a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6...
```

### 2️⃣ Configura los tokens
Edita `auth_config.R` línea ~11:

```r
VALID_TOKENS <- c(
  "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",  # Cliente 1
  "otro_token_aqui"  # Cliente 2
)
```

### 3️⃣ Ejecuta la aplicación
```bash
# CON autenticación (recomendado para producción)
Rscript -e "shiny::runApp('app.R', port=3838)"

# SIN autenticación (para desarrollo local)
./ejecutar_dashboard.sh
```

## 🧪 Prueba que Funciona

### ✅ Con Token Válido (debe funcionar):
```
http://localhost:3838/?token=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```
**Resultado**: Dashboard se carga normalmente

### ❌ Sin Token (debe bloquearse):
```
http://localhost:3838/
```
**Resultado**: Pantalla roja de "Acceso Denegado"

## 🔗 Uso en tu Aplicación Contenedora

### HTML
```html
<iframe 
  src="https://tu-servidor.com/?token=tu_token_aqui"
  width="100%" 
  height="800px"
  frameborder="0">
</iframe>
```

### JavaScript
```javascript
// Obtén el token de tu sistema de autenticación
const token = "a1b2c3d4e5f6..."; // Tu token

// Crea el iframe
const iframe = document.createElement('iframe');
iframe.src = `https://tu-servidor.com/?token=${token}`;
iframe.width = '100%';
iframe.height = '800px';

// Agrega al DOM
document.getElementById('contenedor').appendChild(iframe);
```

### React
```jsx
function DashboardEmbed({ token }) {
  return (
    <iframe
      src={`https://tu-servidor.com/?token=${token}`}
      width="100%"
      height="800px"
      frameBorder="0"
    />
  );
}
```

## 🔄 Dos Modos de Ejecución

### Modo 1: CON Autenticación (app.R)
- ✅ Requiere token en URL
- ✅ Seguro para producción
- ✅ Para embeber en iframe

```bash
Rscript -e "shiny::runApp('app.R', port=3838)"
```

### Modo 2: SIN Autenticación (run.R / scripts originales)
- ✅ Sin restricciones
- ✅ Para desarrollo local
- ✅ Comportamiento original

```bash
./ejecutar_dashboard.sh
# o
Rscript run.R
```

## 🛡️ Seguridad

### ✅ HACER:
- Generar tokens con `generar_tokens.R`
- Usar tokens largos (64 caracteres)
- Configurar en variables de entorno en producción:
  ```bash
  export DASHBOARD_AUTH_TOKENS="token1,token2,token3"
  ```
- Usar HTTPS en producción
- Rotar tokens cada 3-6 meses

### ❌ NO HACER:
- Usar tokens simples como "123" o "password"
- Subir tokens a git (ya están en .gitignore)
- Compartir tokens públicamente
- Usar el mismo token para múltiples clientes

## 🐛 Solución de Problemas

### "Acceso Denegado" con token válido
1. Verifica que el token esté en `VALID_TOKENS` en `auth_config.R`
2. Ejecuta: `Rscript test_auth.R`
3. Revisa que la URL tenga `?token=tu_token`

### Error al cargar app.R
1. Verifica que existe `auth_config.R`
2. Verifica que existe `auth_ui.R`
3. Prueba sin autenticación primero: `Rscript run.R`

### Tokens no funcionan
```r
# En R, verifica la configuración
source("auth_config.R")
print(VALID_TOKENS)
validate_auth_token("tu_token")
```

## 📁 Estructura de Autenticación

```
┌─────────────────────┐
│  Aplicación         │
│  Contenedora        │
│  (tu sistema)       │
└──────────┬──────────┘
           │
           │ Genera iframe con token
           ▼
┌─────────────────────┐
│ <iframe             │
│  src="url?token=X"> │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  app.R              │
│  (con auth)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  auth_config.R      │
│  valida token       │
└──────────┬──────────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
┌─────────┐ ┌──────────┐
│ ✅      │ │ ❌       │
│ Válido  │ │ Inválido │
└────┬────┘ └────┬─────┘
     │           │
     ▼           ▼
┌─────────┐ ┌──────────┐
│ ui.R    │ │ auth_ui.R│
│ server.R│ │ (denegado)│
└─────────┘ └──────────┘
```

## 📚 Recursos

- **Documentación completa**: `README_AUTENTICACION.md`
- **Guía rápida**: `INICIO_RAPIDO.md`
- **Generar tokens**: `generar_tokens.R`
- **Probar sistema**: `test_auth.R`
- **Ejemplo HTML**: `ejemplo_integracion.html`

## ✨ Próximos Pasos

1. ✅ Ejecuta `Rscript generar_tokens.R`
2. ✅ Copia tokens a `auth_config.R`
3. ✅ Ejecuta `Rscript test_auth.R`
4. ✅ Prueba con `Rscript -e "shiny::runApp('app.R')"`
5. ✅ Integra en tu aplicación contenedora

---

## ❓ ¿Preguntas?

**P: ¿Afecta mi código existente?**  
R: No. Tus archivos `ui.R`, `server.R` y `run.R` originales no han sido modificados. Solo se agregaron nuevos archivos.

**P: ¿Puedo seguir usando sin autenticación?**  
R: Sí. Usa `run.R` o `ejecutar_dashboard.sh` como siempre.

**P: ¿Es seguro?**  
R: Sí, siempre que uses tokens generados criptográficamente, los mantengas secretos, y uses HTTPS en producción.

**P: ¿Funciona con Shiny Server?**  
R: Sí, completamente compatible con Shiny Server, ShinyProxy, y RStudio Connect.

---

**✅ Sistema listo para usar. ¡Éxito en tu implementación! 🎉**
