# Guía de Despliegue — dash-integra-esavi

**Última actualización:** 2026-06-26

---

## Requisitos del sistema

| Componente | Versión mínima | Notas |
|---|---|---|
| R | 4.4.1 | Usar exactamente esta versión para compatibilidad con renv.lock |
| PostgreSQL | 12+ | Base de datos fuente (`dhi_esavi`) |
| Sistema operativo | Ubuntu 22.04 / macOS 13+ | |
| RAM | 4 GB mínimo | 8 GB recomendado por la carga de datos en memoria |
| Disco | 2 GB libres | Para paquetes R y archivos RDS |

---

## 1. Preparación del entorno

### 1.1 Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd dash-integra-esavi
```

### 1.2 Configurar variables de entorno

Copiar la plantilla y completar con los valores reales:

```bash
cp .env.example .env
```

Editar `.env`:

```bash
# Base de Datos PostgreSQL
DB_HOST=localhost          # Host del servidor PostgreSQL
DB_PORT=5432               # Puerto (por defecto 5432)
DB_NAME=dhi_esavi          # Nombre de la base de datos
DB_USER=dhis               # Usuario de PostgreSQL
DB_PASS=<contraseña_real>  # Contraseña — nunca subir al repositorio

# Tokens de autenticación (separados por coma, sin espacios)
DASHBOARD_AUTH_TOKENS=token_1_aqui,token_2_aqui

# Servidor Shiny
SHINY_PORT=3838
SHINY_HOST=0.0.0.0

# Logs
LOG_ACCESS_ATTEMPTS=true
LOG_FILE_PATH=./logs/access.log
```

> **Importante:** `.env` está en `.gitignore`. Nunca subir credenciales al repositorio.

### 1.3 Restaurar dependencias R con renv

```r
# Desde la consola de R, en el directorio del proyecto
install.packages("renv")
renv::restore()
```

Esto instala exactamente las versiones en `renv.lock` (~150 paquetes). Puede tomar 10-20 minutos la primera vez.

---

## 2. Generar tokens de autenticación

```r
# Desde la consola de R
source("generar_tokens.R")

# Generar tokens para las aplicaciones que consumirán el dashboard
generar_tokens(3, c("IntegrApp", "Portal_MSP", "Admin"))
```

Copiar los tokens generados en `.env` bajo `DASHBOARD_AUTH_TOKENS`.

> **Eliminar** el token hardcodeado en `auth_config.R` línea 12 y reemplazarlo con un comentario explicando que los tokens van en `.env`.

---

## 3. Preparar los datos

### 3.1 Ejecutar extracción desde PostgreSQL

Requiere conexión activa a la base de datos:

```bash
Rscript preparar_datos.R
```

Esto ejecuta 7 consultas SQL y guarda los resultados en `fuente_de_datos/`:
- `db_reg_patient.rds`
- `db_reg_report.rds`
- `db_reg_event.rds`
- `db_reg_vaccine.rds`
- `db_reg_seriousness_outcome.rds`
- `dosis_administradas.rds`
- `db_reg_pregnancy.rds`

### 3.2 Regenerar geo_datos.rds (PENDIENTE — actualmente vacío)

El archivo `datos/geo_datos.rds` está vacío y los mapas no funcionan. Debe generarse desde el shapefile oficial del Ecuador:

```r
library(sf)

# Opción A: desde shapefile local
geo <- st_read("ruta/al/shapefile_ecuador.shp")
saveRDS(geo, "datos/geo_datos.rds")

# Opción B: desde WFS del IGM / ESRI si hay acceso
# (consultar con el equipo GIS)
```

### 3.3 Ejecutar script de procesamiento

```bash
Rscript scripts/procesamiento_datos.R
```

Genera `datos/datos_procesados.rds` y `datos/dosis_admin.rds` que usa la app.

---

## 4. Ejecutar la aplicación

### 4.1 Desarrollo local

```bash
# Con autenticación (equivale a producción)
Rscript -e "shiny::runApp('app.R', port=3838, launch.browser=TRUE)"

# Sin autenticación (modo desarrollo rápido)
Rscript run.R
```

Acceder en: `http://localhost:3838/?token=<tu_token>`

### 4.2 Verificación rápida del sistema de autenticación

```bash
Rscript iniciar_con_auth.sh
```

Prueba manual:
- Con token válido: `http://127.0.0.1:3939/?token=token_ejemplo_1` → debe mostrar el dashboard
- Sin token: `http://127.0.0.1:3939/` → debe mostrar pantalla de acceso denegado

---

## 5. Despliegue en producción

### Opción A: Shiny Server Open Source (recomendado para servidores Linux)

**Instalación de Shiny Server:**

```bash
# Ubuntu/Debian
wget https://download3.rstudio.org/ubuntu-18.04/x86_64/shiny-server-1.5.22.1-amd64.deb
sudo dpkg -i shiny-server-1.5.22.1-amd64.deb
```

**Configuración `/etc/shiny-server/shiny-server.conf`:**

```
server {
  listen 3838;

  location /esavi {
    site_dir /srv/shiny-server/dash-integra-esavi;
    log_dir  /var/log/shiny-server/esavi;
    directory_index off;
  }
}
```

**Copiar el proyecto:**

```bash
sudo cp -r . /srv/shiny-server/dash-integra-esavi/
sudo chown -R shiny:shiny /srv/shiny-server/dash-integra-esavi/
```

**Iniciar el servicio:**

```bash
sudo systemctl enable shiny-server
sudo systemctl start shiny-server
sudo systemctl status shiny-server
```

**Configurar variables de entorno para shiny-server:**

Agregar al archivo `/etc/environment` o al perfil del usuario `shiny`:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dhi_esavi
DB_USER=dhis
DB_PASS=<contraseña>
DASHBOARD_AUTH_TOKENS=token1,token2
```

---

### Opción B: Docker

**Crear `Dockerfile`** en la raíz del proyecto:

```dockerfile
FROM rocker/shiny:4.4.1

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar proyecto
WORKDIR /srv/shiny-server/esavi
COPY . .

# Restaurar dependencias R con renv
RUN R -e "install.packages('renv'); renv::restore()"

# Exponer puerto
EXPOSE 3838

# Punto de entrada
CMD ["R", "-e", "shiny::runApp('app.R', host='0.0.0.0', port=3838)"]
```

**Construir y ejecutar:**

```bash
docker build -t dash-integra-esavi .

docker run -d \
  --name esavi \
  -p 3838:3838 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_NAME=dhi_esavi \
  -e DB_USER=dhis \
  -e DB_PASS=<contraseña> \
  -e DASHBOARD_AUTH_TOKENS=token1,token2 \
  dash-integra-esavi
```

**Con docker-compose** (si hay múltiples servicios):

```yaml
# docker-compose.yml
version: '3.8'

services:
  dashboard:
    build: .
    ports:
      - "3838:3838"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=dhi_esavi
      - DB_USER=dhis
      - DB_PASS=${DB_PASS}
      - DASHBOARD_AUTH_TOKENS=${DASHBOARD_AUTH_TOKENS}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: dhi_esavi
      POSTGRES_USER: dhis
      POSTGRES_PASSWORD: ${DB_PASS}
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  pgdata:
```

---

### Opción C: Reverse proxy con nginx + HTTPS (obligatorio en producción)

Siempre colocar un proxy nginx con TLS delante del servidor Shiny:

**`/etc/nginx/sites-available/esavi`:**

```nginx
server {
    listen 80;
    server_name tu-dominio.paho.org;
    return 301 https://$host$request_uri;  # Forzar HTTPS
}

server {
    listen 443 ssl;
    server_name tu-dominio.paho.org;

    ssl_certificate     /etc/letsencrypt/live/tu-dominio.paho.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.paho.org/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3838;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;    # Necesario para WebSockets de Shiny
        proxy_send_timeout 3600s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/esavi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Certificado SSL gratuito con Let's Encrypt:**

```bash
sudo certbot --nginx -d tu-dominio.paho.org
```

---

## 6. Actualización periódica de datos

El cron debe ejecutar `preparar_datos.R` + `scripts/procesamiento_datos.R` para actualizar los archivos RDS sin reiniciar la app.

**Configurar crontab** (`crontab -e`):

```cron
# Actualizar datos cada 4 horas (días laborables)
0 */4 * * 1-5 cd /ruta/al/proyecto && Rscript preparar_datos.R >> logs/cron_datos.log 2>&1
0 */4 * * 1-5 cd /ruta/al/proyecto && Rscript scripts/procesamiento_datos.R >> logs/cron_proc.log 2>&1
```

> **Nota:** La app carga datos al iniciar. Para que los nuevos datos sean visibles, es necesario reiniciar Shiny Server o recargar la sesión. Evaluar implementar recarga reactiva con `reactivePoll()` si se requiere actualización sin reinicio.

---

## 7. Checklist de despliegue

### Pre-despliegue
- [ ] `.env` configurado con credenciales reales (no los de ejemplo)
- [ ] Token hardcodeado eliminado de `auth_config.R`
- [ ] Tokens generados con `generar_tokens.R` y configurados en `.env`
- [ ] `renv::restore()` ejecutado sin errores
- [ ] Conexión a PostgreSQL verificada (`Rscript preparar_datos.R`)
- [ ] Todos los archivos RDS generados en `datos/` (especialmente `geo_datos.rds`)
- [ ] `.gitignore` incluye `.env`, `datos/`, `fuente_de_datos/`

### Post-despliegue
- [ ] Acceso con token válido funciona
- [ ] Acceso sin token muestra pantalla de denegado
- [ ] Todos los tabs del dashboard cargan sin errores
- [ ] Mapas geográficos muestran datos (valida que `geo_datos.rds` no esté vacío)
- [ ] HTTPS activo (verificar con `https://` en la URL)
- [ ] Cron de actualización de datos configurado
- [ ] Logs de acceso escribiéndose en `logs/access.log`

---

## 8. Solución de problemas comunes

| Error | Causa probable | Solución |
|---|---|---|
| "Acceso denegado" al cargar | Token no configurado en `.env` | Verificar `DASHBOARD_AUTH_TOKENS` en `.env` |
| Mapas no muestran datos | `geo_datos.rds` vacío | Regenerar desde shapefile (ver sección 3.2) |
| Error al conectar a BD | Credenciales incorrectas o BD inaccesible | Verificar `.env` y acceso de red al PostgreSQL |
| Paquete no encontrado | `renv::restore()` incompleto | Ejecutar `renv::restore()` nuevamente |
| Puerto 3838 ocupado | Proceso anterior sin cerrar | `lsof -i :3838` y matar el proceso |
| WebSocket cerrado en proxy | Timeout de nginx muy bajo | Aumentar `proxy_read_timeout` a 3600s |
| Datos desactualizados | Cron no configurado | Revisar crontab o ejecutar `preparar_datos.R` manualmente |
