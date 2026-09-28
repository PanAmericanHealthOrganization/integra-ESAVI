# WHODrug - DHIS2 Capture Field Form Plugin

DHIS2 Capture Field Form Plugin para asignar vacunas mediante dropdowns en cascada que consumen la API WHODrug.

## Features

- Consulta abreviaturas, nombres comerciales, titulares, formas y potencias via DHIS2 Routes.
- Escribe los valores seleccionados en campos de Capture usando aliases `IdFromPlugin`.
- Soporta un plugin unico con mapeos por contexto/etapa usando Data Elements tecnicos.
- Soporta configuracion por dataStore con fallback por variables de entorno.
- Incluye app standalone minima y entry point de plugin, como exige DHIS2 App Platform.

## Prerequisites

- Node.js v18+
- Yarn v1.22+
- DHIS2 v2.42+
- Una DHIS2 Route que proxee al backend WHODrug.

## Installation & Build

### 1. Install Dependencies

```bash
yarn install --frozen-lockfile
```

### 2. Build the Plugin

```bash
yarn build
```

The built plugin will be in `capture-plugin/build/bundle/`.

### 3. Upload to DHIS2

1. Go to App Management in DHIS2.
2. Click Upload App.
3. Select `capture-plugin/build/bundle/plugin.html`.
4. Click Install.

For local development:

```bash
yarn start
```

Then use `http://localhost:3000/plugin.html` in the Capture field configuration. `http://localhost:3000/plugin` redirects to the same plugin page for convenience. The default `start` script runs a small local proxy on port `3000` and the DHIS2 plugin dev server behind it on port `3001`, so stale `%PUBLIC_URL%` asset requests are normalized instead of crashing Express. Use `yarn workspace capture-plugin start:all` only when you need both the standalone app and the plugin; in that mode the app uses port `3000` and the plugin normally uses port `3001`.

## Configuration

### 1. Create the DHIS2 Route

```bash
curl -X POST "$DHIS2/api/routes" \
  -H "Content-Type: application/json" \
  -u admin:district \
  -d '{
    "name": "WHODrug Vaccines API",
    "code": "whodrug-api",
    "url": "http://localhost:4059/api/vaccines-whodrug/**",
    "auth": { "type": "http-basic", "username": "...", "password": "..." }
  }'
```

The backend URL must end in `/**` so DHIS2 forwards subpaths such as `/abbreviations` and `/drug-name`.

### 2. Create the DataStore Entry

```bash
curl -X POST "$DHIS2/api/dataStore/WHODrug/API-CONFIG" \
  -H "Content-Type: application/json" \
  -u admin:district \
  -d '{
    "country": "ECU",
    "routeCode": "whodrug-api"
  }'
```

Supported fields:

| Field | Required | Description |
| --- | --- | --- |
| `country` | Yes | ISO3 country code, for example `ECU` or `PRY`. |
| `routeCode` | Yes, unless `routeId` is set | DHIS2 Route code. |
| `routeId` | Optional | DHIS2 Route UID. Takes priority over `routeCode`. |
| `backendUrl` | Optional | Used only when direct development mode is enabled. |

### 3. Configure Technical Context Fields

El plugin puede usar diferentes grupos de mapeos segun la etapa o contexto de Capture. El usuario no selecciona el contexto manualmente: DHIS2 debe asignarlo mediante reglas de programa en Data Elements tecnicos.

Configura estos Data Elements tecnicos en DHIS2 y asigna los valores indicados:

| Alias `IdFromPlugin` | Valor esperado | Contexto interno |
| --- | --- | --- |
| `pluginVacunasNotificacion` | `VACUNAS_NOTIFICACION` | `vacunasNotificacion` |
| `pluginVacunasInvestigacion` | `VACUNAS_INVESTIGACION` | `vacunasInvestigacion` |
| `pluginMediccamentosNotificacion` | `MEDICAMENTOS_NOTIFICACION` | `medicamentosNotificacion` |
| `pluginMedicamentoInvestigación` | `MEDICAMENTOS_INVESTIGACION` | `medicamentosInvestigacion` |

En Tracker Plugin Configurator, cada Data Element tecnico debe mapearse con su alias exacto. Ejemplo:

```json
{
  "fieldMap": [
    {
      "IdFromApp": "UID_DATA_ELEMENT_PLUGIN_VACUNAS_NOTIFICACION",
      "IdFromPlugin": "pluginVacunasNotificacion",
      "objectType": "DataElement"
    },
    {
      "IdFromApp": "UID_DATA_ELEMENT_PLUGIN_MEDICAMENTOS_NOTIFICACION",
      "IdFromPlugin": "pluginMediccamentosNotificacion",
      "objectType": "DataElement"
    }
  ]
}
```

Notas importantes:

- Los valores deben ser exactos. Por ejemplo, `VACUNAS_NOTIFICACION`, sin espacios.
- Los Data Elements tecnicos pueden no renderizarse visualmente, pero deben estar asociados a la etapa y disponibles para el plugin.
- Si mas de un contexto tiene valor al mismo tiempo, el plugin usa el primer alias que coincida segun el orden de `contextAliases` en `mappings.json`.
- Si no detecta ningun contexto, usa `defaultContext`, actualmente `vacunasNotificacion`.

### 4. Configure Field Mapping

Configure the field map in the Tracker Plugin Configurator app. The plugin reads and writes aliases from `capture-plugin/src/config/mappings.json`.

Example with technical context fields and destination fields:

```json
{
  "fieldMap": [
    {
      "IdFromApp": "UID_PLUGIN_VACUNAS_NOTIFICACION",
      "IdFromPlugin": "pluginVacunasNotificacion",
      "objectType": "DataElement"
    },
    {
      "IdFromApp": "ABC123xyz02",
      "IdFromPlugin": "abreviaturaCodigoUno",
      "objectType": "DataElement"
    },
    {
      "IdFromApp": "ABC123xyz03",
      "IdFromPlugin": "abreviaturaNombreUno",
      "objectType": "DataElement"
    },
    {
      "IdFromApp": "ABC123xyz04",
      "IdFromPlugin": "vacunaCodigoUno",
      "objectType": "DataElement"
    },
    {
      "IdFromApp": "ABC123xyz05",
      "IdFromPlugin": "vacunaNombreUno",
      "objectType": "DataElement"
    }
  ]
}
```

The current vaccine aliases are:

| Slot | Abbreviation code | Abbreviation text | Vaccine code | Vaccine text |
| --- | --- | --- | --- | --- |
| 1 | `abreviaturaCodigoUno` | `abreviaturaNombreUno` | `vacunaCodigoUno` | `vacunaNombreUno` |
| 2 | `abreviaturaCodigoDos` | `abreviaturaNombreDos` | `vacunaCodigoDos` | `vacunaNombreDos` |
| 3 | `abreviaturaCodigoTres` | `abreviaturaNombreTres` | `vacunaCodigoTres` | `vacunaNombreTres` |
| 4 | `abreviaturaCodigoCuatro` | `abreviaturaNombreCuatro` | `vacunaCodigoCuatro` | `vacunaNombreCuatro` |
| 5 | `abreviaturaCodigoCinco` | `abreviaturaNombreCinco` | `vacunaCodigoCinco` | `vacunaNombreCinco` |
| 6 | `abreviaturaCodigoSeis` | `abreviaturaNombreSeis` | `vacunaCodigoSeis` | `vacunaNombreSeis` |
| 7 | `abreviaturaCodigoSiete` | `abreviaturaNombreSiete` | `vacunaCodigoSiete` | `vacunaNombreSiete` |
| 8 | `abreviaturaCodigoOcho` | `abreviaturaNombreOcho` | `vacunaCodigoOcho` | `vacunaNombreOcho` |

The vaccine notification and vaccine investigation contexts currently reuse these existing slots through:

```json
{
  "slotSource": "slots"
}
```

Medication contexts have two example slots in `mappings.json`. Replace those example aliases with the real aliases configured in Tracker Plugin Configurator:

| Context | Slot | Abbreviation code | Abbreviation text | Medication code | Medication text |
| --- | --- | --- | --- | --- | --- |
| `medicamentosNotificacion` | 1 | `medicamentoNotificacionAbreviaturaCodigoUno` | `medicamentoNotificacionAbreviaturaNombreUno` | `medicamentoNotificacionCodigoUno` | `medicamentoNotificacionNombreUno` |
| `medicamentosNotificacion` | 2 | `medicamentoNotificacionAbreviaturaCodigoDos` | `medicamentoNotificacionAbreviaturaNombreDos` | `medicamentoNotificacionCodigoDos` | `medicamentoNotificacionNombreDos` |
| `medicamentosInvestigacion` | 1 | `medicamentoInvestigacionAbreviaturaCodigoUno` | `medicamentoInvestigacionAbreviaturaNombreUno` | `medicamentoInvestigacionCodigoUno` | `medicamentoInvestigacionNombreUno` |
| `medicamentosInvestigacion` | 2 | `medicamentoInvestigacionAbreviaturaCodigoDos` | `medicamentoInvestigacionAbreviaturaNombreDos` | `medicamentoInvestigacionCodigoDos` | `medicamentoInvestigacionNombreDos` |

### 5. Configure mappings.json contexts

`capture-plugin/src/config/mappings.json` controls which aliases are used for each context.

Key fields:

| Field | Description |
| --- | --- |
| `defaultContext` | Context used when no technical context value is detected. |
| `contextAliases` | Maps technical Data Element aliases and expected values to internal contexts. |
| `contexts` | Defines the slot group used by each context. |
| `slots` | Existing vaccine slots. Do not rename these aliases unless Tracker Plugin Configurator is updated too. |

Current context aliases:

```json
{
  "pluginVacunasNotificacion": {
    "value": "VACUNAS_NOTIFICACION",
    "context": "vacunasNotificacion"
  },
  "pluginVacunasInvestigacion": {
    "value": "VACUNAS_INVESTIGACION",
    "context": "vacunasInvestigacion"
  },
  "pluginMediccamentosNotificacion": {
    "value": "MEDICAMENTOS_NOTIFICACION",
    "context": "medicamentosNotificacion"
  },
  "pluginMedicamentoInvestigación": {
    "value": "MEDICAMENTOS_INVESTIGACION",
    "context": "medicamentosInvestigacion"
  }
}
```

To add another context:

1. Create and map a technical Data Element in DHIS2.
2. Assign its value with a program rule.
3. Add the alias/value/context entry in `contextAliases`.
4. Add a matching entry in `contexts`.
5. Add or reference the correct `slots`.

### 6. Environment Fallback

`d2-app-scripts` exposes variables prefixed with `DHIS2_`.

```env
DHIS2_WHODRUG_DEFAULT_COUNTRY=ECU
DHIS2_WHODRUG_DEFAULT_ROUTE_CODE=whodrug-api
DHIS2_WHODRUG_DEFAULT_BACKEND_URL=http://localhost:4059/api/vaccines-whodrug
DHIS2_WHODRUG_DEV_DIRECT_BACKEND=false
```

## Project Structure

```text
whodrug/
├── package.json
├── capture-plugin/
│   ├── package.json
│   ├── d2.config.js
│   └── src/
│       ├── App.js
│       ├── Plugin.js
│       ├── components/
│       ├── config/
│       ├── hooks/
│       └── utils/
└── README.md
```

## License

BSD-3-Clause
