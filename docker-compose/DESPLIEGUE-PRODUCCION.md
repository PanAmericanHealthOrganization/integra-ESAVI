# Guía de Despliegue a Producción — Integra ESAVI (Docker)

Guía paso a paso para desplegar el stack de **Integra ESAVI** en un servidor de
producción usando Docker Compose (`docker-compose.yaml`).

> El archivo `docker-compose.dev.yaml` es **solo para desarrollo local** (hot-reload,
> puertos publicados en `127.0.0.1`). En producción se usa **`docker-compose.yaml`**.

---

## 1. Arquitectura del stack

| Servicio        | Imagen / Build                    | Rol                                             | Puerto host |
|-----------------|-----------------------------------|-------------------------------------------------|-------------|
| `postgres`      | `postgres:15`                     | Base de datos (DHI_ESAVI + keycloak)            | 5433        |
| `db-init`       | `postgres:15` (job efímero)       | Crea esquemas y usuario/BD de Keycloak          | —           |
| `keycloak`      | `keycloak:26.6.3`                 | Identidad / OIDC                                 | 8080        |
| `api`           | build `api-integra-esavi`         | API NestJS                                       | 3000        |
| `app-web`       | build `app-integra-esavi`         | Frontend web                                     | 5173        |
| `dashboard`     | build `dash-integra-esavi`        | Dashboard Shiny                                  | interno     |
| `oauth2-proxy`  | `oauth2-proxy:v7.6.0`             | Autenticación Keycloak + control de roles        | interno     |
| `dash-nginx`    | `nginx:1.27-alpine`               | TLS + reverse proxy hacia oauth2-proxy           | 80 / 443    |

Redes:
- `esavi-internal` (`internal: true`) — sin salida a internet, dashboard ↔ oauth2-proxy.
- `esavi-public` (`bridge`) — nginx ↔ oauth2-proxy expuestos al exterior.

---

## 2. Prerrequisitos del servidor

- [ ] Docker Engine 24+ y Docker Compose v2 (`docker compose version`).
- [ ] Dominio(s) DNS apuntando al servidor (p. ej. `auth-kk.kuyacode.com` y el dominio del dashboard).
- [ ] Puertos **80** y **443** abiertos en el firewall.
- [ ] El repositorio clonado con la estructura hermana `../proyecto-02-integra-esavi/workspace/...`
      (la build de `api`, `app-web` y `dashboard` usa esas rutas relativas).
- [ ] Acceso para generar/instalar certificados TLS.

---

## 3. ⚠️ Cambios OBLIGATORIOS antes de producción

El `docker-compose.yaml` actual tiene valores de ejemplo/inseguros. **No desplegar sin corregir esto.**

### 3.1 Secretos y credenciales

Reemplazar todos los valores por defecto (idealmente con un archivo `.env` + variables):

| Ubicación en el compose                          | Valor actual (inseguro)              | Acción                                    |
|--------------------------------------------------|--------------------------------------|-------------------------------------------|
| `postgres.POSTGRES_PASSWORD`                     | `dhis`                               | Contraseña fuerte única                   |
| `keycloak.KC_BOOTSTRAP_ADMIN_PASSWORD`           | `admin_password`                     | Contraseña fuerte de admin                |
| `keycloak.KC_DB_PASSWORD` / `scripts/init-db.sh` | `password123`                        | Contraseña fuerte (cambiar en ambos)      |
| `api.*_DB_PASS`                                   | `dhis`                               | Sincronizar con la nueva de postgres      |
| `oauth2-proxy --client-secret`                   | `CAMBIAR_POR_SECRET_REAL`            | Secret real del cliente en Keycloak       |
| `oauth2-proxy --cookie-secret`                   | (valor de ejemplo)                   | Generar uno nuevo (ver abajo)             |

Generar un `cookie-secret` nuevo:
```bash
openssl rand -base64 32
```

> **Recomendado:** mover las credenciales a un `.env` y referenciarlas con `${VAR}` en el
> compose, en vez de dejarlas escritas en el YAML. Añadir `.env` al `.gitignore`.

### 3.2 URLs de oauth2-proxy

Ajustar en el servicio `oauth2-proxy`:
- `--oidc-issuer-url` → URL pública real de Keycloak (`https://.../realms/integra-esavi`).
- `--redirect-url` → `https://<dominio-dashboard>/oauth2/callback` (hoy dice `localhost`).
- `--cookie-secure=true` requiere HTTPS válido (ya está activado — mantenerlo).

### 3.3 Nginx: configuración y certificados TLS (faltan)

El servicio `dash-nginx` monta rutas que **actualmente no existen** y hay que crear:
```
../proyecto-02-integra-esavi/workspace/dash-integra-esavi/nginx/nginx.conf
../proyecto-02-integra-esavi/workspace/dash-integra-esavi/nginx/certs/   (fullchain + private key)
```
- Crear `nginx.conf` con TLS (443), redirección 80→443 y `proxy_pass` a `http://oauth2-proxy:4180`.
- Colocar los certificados (Let's Encrypt / CA corporativa) en `nginx/certs/`.

### 3.4 Exposición de puertos

Por seguridad, en producción **no publicar** puertos internos al exterior. Solo `dash-nginx`
(80/443) debe quedar público. Evaluar cerrar o restringir a `127.0.0.1`:
- `postgres` (5433), `keycloak` (8080), `api` (3000), `app-web` (5173).

Ejemplo (limitar a loopback):
```yaml
ports:
  - "127.0.0.1:3000:3000"
```

### 3.5 Configuración de Keycloak

- Cambiar `start-dev` por `start` (modo producción) e importar el realm con `KC_HOSTNAME`,
  `KC_PROXY`/`KC_PROXY_HEADERS` según corresponda tras el nginx.
- Verificar que el cliente `dash-integra-esavi-client` exista en el realm con el `client-secret`
  configurado y los roles `analitic`, `arcsa`, `dhis`, `paho`.

---

## 4. Pasos de despliegue

Desde el directorio `docker-compose/`:

```bash
# 1. Verificar que la configuración es válida y ver la config final resuelta
podman-compose config

# 2a. Imagen BASE del dashboard (dependencias de sistema + paquetes R). Solo se
#     construye la primera vez o cuando cambia renv.lock / Dockerfile.deps; el
#     script lo detecta por hash y si no hace falta, no hace nada.
#     Es la parte LENTA del build.
./scripts/build-dash-base.sh
#     equivalente sin script:  podman-compose --profile base build dash-base

# 2b. Construir las imágenes de aplicación (api, app-web, dashboard).
#     El dashboard parte de la base, así que aquí solo copia código: segundos.
podman-compose build

# 3. Levantar el stack en segundo plano
podman-compose up -d

# 4. Seguir el arranque (db-init debe completar antes que keycloak/api)
podman-compose logs -f
```

El orden de arranque lo gestionan las dependencias del compose:
`postgres` (healthy) → `db-init` (completa) → `keycloak` / `api` / `dashboard` →
`oauth2-proxy` → `dash-nginx`.

### Imagen base del dashboard y arquitectura

La base (`localhost/integra-esavi/dash-base:4.4.1`) instala ~147 paquetes R con
`renv::restore()`. El `Dockerfile` de la app solo hace `FROM` de esa base, por lo
que un cambio de código NO reinstala nada de R.

**El coste del build depende de la arquitectura del host:**

| Arquitectura del motor | Qué pasa con los paquetes R | Coste |
|------------------------|-----------------------------|-------|
| `linux/amd64` (x86_64) | Posit PPM sirve binarios jammy precompilados | minutos |
| `linux/arm64` (Apple Silicon, ARM) | PPM **no publica binarios arm64**: los 147 paquetes se compilan desde fuente | muy lento |

En un host arm64, para usar binarios a costa de correr emulado:

```bash
BUILD_PLATFORM=linux/amd64 ./scripts/build-dash-base.sh
```

El servidor de producción es x86_64, así que allí el build usa binarios.

---

## 5. Verificación post-despliegue

```bash
# Estado y salud de cada contenedor
docker compose ps
```

- [ ] Todos los servicios en estado `running` / `healthy`.
- [ ] `db_init_esavi` terminó con éxito (`Inicialización completada.` en logs).
- [ ] Keycloak responde: `GET /health/ready` → `UP`.
- [ ] API responde: `GET /health`.
- [ ] El dashboard es accesible **solo vía HTTPS a través de nginx**, y exige login en Keycloak.
- [ ] Un usuario sin rol permitido recibe acceso denegado (control de `--allowed-role`).

```bash
# Comandos útiles de verificación
docker compose logs api | tail -n 50
docker compose logs keycloak | tail -n 50
docker compose exec postgres pg_isready -U dhis -d DHI_ESAVI
```

---

## 6. Operación y mantenimiento

### Actualizar una nueva versión
```bash
git pull
./scripts/build-dash-base.sh                   # no-op si renv.lock no cambió
podman-compose build api app-web dashboard     # rebuild de lo que cambió
podman-compose up -d                           # recrea solo lo necesario
podman image prune -f                          # limpia imágenes viejas
```

### Backups de la base de datos
```bash
# Backup
docker compose exec postgres pg_dump -U dhis DHI_ESAVI > backup_$(date +%F).sql

# Restauración
cat backup_YYYY-MM-DD.sql | docker compose exec -T postgres psql -U dhis -d DHI_ESAVI
```
> El volumen `postgres_data` persiste los datos. **No** ejecutar `docker compose down -v`
> en producción salvo que quieras **borrar la base de datos**.

### Logs y reinicio
```bash
docker compose logs -f <servicio>
docker compose restart <servicio>
```

### Detener / arrancar
```bash
docker compose stop      # detiene sin borrar contenedores/volúmenes
docker compose up -d     # vuelve a arrancar
docker compose down      # elimina contenedores (conserva volúmenes)
```

---

## 7. Checklist final de Go-Live

- [ ] Todas las credenciales por defecto reemplazadas (sección 3.1).
- [ ] `cookie-secret` y `client-secret` reales configurados.
- [ ] URLs de oauth2-proxy apuntando al dominio de producción (no `localhost`).
- [ ] `nginx.conf` y certificados TLS creados y montados.
- [ ] Puertos internos no expuestos públicamente (solo 80/443).
- [ ] Keycloak en modo `start` (producción), realm y roles verificados.
- [ ] Backup inicial de la BD realizado.
- [ ] Healthchecks en verde y flujo de login probado de extremo a extremo.
