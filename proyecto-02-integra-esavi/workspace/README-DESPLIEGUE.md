# Despliegue — dónde están los compose

Los antiguos `docker-compose.yaml` / `docker-compose.dev.yaml` de esta carpeta
`workspace/` fueron **retirados** (archivados como `*.deprecated`) porque
chocaban con el stack oficial: usaban los mismos `container_name`
(`postgres_esavi`, `db_init_esavi`) y no podían coexistir.

## Compose oficial

- **`../../docker-compose/docker-compose.yaml`** — stack completo (prod local).
- **`../../docker-compose/docker-compose.dev.yaml`** — desarrollo con hot-reload
  (API en watch + app en vite dev). Contenedores con sufijo `_dev`.

```bash
cd ../../docker-compose
podman compose -f docker-compose.dev.yaml up -d      # desarrollo
podman compose up -d                                 # prod local
```

Los scripts de init (`init-db.sh`, `keycloak-realm.json`) viven en
`../../docker-compose/scripts/`.

## Dashboard (despliegue separado y manual)

El dashboard se despliega aparte, DESPUÉS de que la API haya generado el
datamart `api-integra-esavi/datos/esavi.duckdb`:

```bash
cd dash-integra-esavi
podman compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

El servicio `duckdb-check` aborta el despliegue si el archivo no existe.
