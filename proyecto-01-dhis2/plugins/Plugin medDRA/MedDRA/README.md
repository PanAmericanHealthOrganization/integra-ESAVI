# MedDRA Search Field Plugin - DHIS2 Capture

Plugin para DHIS2 Capture que permite buscar terminos LLT de MedDRA y asignar el codigo y el nombre seleccionados a Data Elements del formulario.

El plugin es unico, pero puede escribir en distintos grupos de campos segun el contexto de la etapa/formulario. El contexto se identifica mediante Data Elements tecnicos configurados en DHIS2 y mapeados en Tracker Plugin Configurator.

## Caracteristicas

- Busqueda de terminos LLT de MedDRA.
- Asignacion mediante `setFieldValue`, compatible con DHIS2 Capture field form plugins.
- Multiples contextos de asignacion usando el mismo plugin.
- Seleccion automatica del contexto desde Data Elements tecnicos.
- Modo de solo lectura para `viewMode`.
- Modo mock para desarrollo local sin credenciales de MedDRA.

## Prerequisitos

- Node.js v18 o superior.
- Yarn v1.22 o superior.
- DHIS2 v40.5 o superior.
- Tracker Plugin Configurator instalado y disponible en la instancia DHIS2.

No usar `npm install`. El proyecto esta configurado para Yarn.

## Instalacion local

Desde la raiz del repositorio:

```bash
yarn install --frozen-lockfile
```

## Ejecucion en desarrollo

Desde la raiz del repositorio:

```bash
yarn start
```

Tambien se puede ejecutar directamente el workspace:

```bash
yarn workspace capture-plugin start
```

## Empaquetado

Desde la raiz del repositorio:

```bash
yarn build
```

El paquete generado queda en:

```text
capture-plugin/build/bundle/
```

Si DHIS2 o el entorno local bloquea la verificacion del paquete, se puede construir desde el workspace:

```bash
cd capture-plugin
d2-app-scripts build --no-verify
```

## Instalacion en DHIS2

1. Ejecutar `yarn build`.
2. Ir al gestor de aplicaciones de DHIS2.
3. Cargar el archivo `.zip` generado en `capture-plugin/build/bundle/`.
4. Instalar la aplicacion.
5. Configurar el plugin en Tracker Plugin Configurator para el programa/etapa correspondiente.

## Configuracion del plugin en Tracker Plugin Configurator

El plugin necesita dos tipos de mapeo:

1. Data Elements tecnicos para detectar el contexto.
2. Data Elements destino donde se escriben el codigo y el nombre del termino MedDRA.

Todos los aliases usados en `IdFromPlugin` deben coincidir exactamente con los definidos en:

```text
capture-plugin/src/config/dataElements.js
```

## Contextos soportados

El archivo `dataElements.js` define estos contextos:

| Contexto | Alias tecnico | Valor esperado |
| --- | --- | --- |
| Antecedentes medicos | `pluginAntecedentesMedicos` | `ANTECEDENTES_MEDICOS` |
| Anomalias congenitas | `pluginAnomaliasCongenitas` | `ANOMALIAS_CONGENITAS` |
| Complicaciones embarazo | `pluginComplicacionesEmbarazo` | `COMPLICACIONES_EMBARAZO` |
| Complicacion fetal | `pluginCompliacionFetal` | `COMPLICACION_FETAL` |
| ESAVI diagnostico | `pluginEsaviDiagnostico` | `ESAVI_DIAGNOSTICO` |
| Otro ESAVI | `pluginOtroEsavi` | `OTRO_ESAVI` |
| Diagnostico final | `pluginDiagnosticoFinal` | `DIAGNOSTICO_FINAL` |
| Afeccion medica embarazo | `pluginAfeccionMedicaEmbarazo` | `AFECCION_MEDICA_EMBARAZO` |

El contexto por defecto es `antecedentes_medicos`. Si ningun Data Element tecnico tiene valor, el plugin usa los campos actuales de antecedentes medicos.

## Data Elements tecnicos de contexto

Para cada etapa/formulario donde se use el plugin, DHIS2 debe asignar por regla de programa uno de los valores tecnicos esperados.

Ejemplo para antecedentes medicos:

```text
pluginAntecedentesMedicos = ANTECEDENTES_MEDICOS
```

Ejemplo para anomalias congenitas:

```text
pluginAnomaliasCongenitas = ANOMALIAS_CONGENITAS
```

Estos Data Elements pueden estar ocultos o no renderizarse visualmente en el formulario, pero deben existir en la etapa y deben estar mapeados en Tracker Plugin Configurator.

El plugin normaliza los valores con `trim()` y mayusculas, pero se recomienda configurar valores exactos y sin espacios.

Evitar valores como:

```text
Anomalias
anomalias_congenitas
 ANOMALIAS_CONGENITAS 
COMPLICACION_FETALES
```

## Ejemplos de mapeo de contexto

En Tracker Plugin Configurator, cada Data Element tecnico debe mapearse con `objectType: "DataElement"`.

Ejemplo para antecedentes medicos:

```json
{
  "IdFromApp": "UID_DATA_ELEMENT_PLUGIN_ANTECEDENTES_MEDICOS",
  "IdFromPlugin": "pluginAntecedentesMedicos",
  "objectType": "DataElement"
}
```

Ejemplo para anomalias congenitas:

```json
{
  "IdFromApp": "UID_DATA_ELEMENT_PLUGIN_ANOMALIAS_CONGENITAS",
  "IdFromPlugin": "pluginAnomaliasCongenitas",
  "objectType": "DataElement"
}
```

Ejemplo para ESAVI diagnostico:

```json
{
  "IdFromApp": "UID_DATA_ELEMENT_PLUGIN_ESAVI_DIAGNOSTICO",
  "IdFromPlugin": "pluginEsaviDiagnostico",
  "objectType": "DataElement"
}
```

## Data Elements destino

Cada contexto define una lista de campos destino con este esquema interno:

```js
{
    id: 1,
    code: 'aliasDelDataElementCodigo',
    name: 'aliasDelDataElementNombre',
}
```

El plugin escribe:

- `term.code` en el alias definido en `code`.
- `term.name` en el alias definido en `name`.

Por cada slot se deben crear o seleccionar dos Data Elements en DHIS2:

- Un Data Element para codigo MedDRA.
- Un Data Element para nombre MedDRA.

Ambos deben estar mapeados en Tracker Plugin Configurator usando los aliases definidos en `dataElements.js`.

## Ejemplo de mapeo destino

Para antecedentes medicos, los aliases actuales son:

```js
{
    id: 1,
    code: 'antecedenteMedicoUnoCodigo',
    name: 'antecedenteMedicoUno',
}
```

En Tracker Plugin Configurator:

```json
{
  "IdFromApp": "UID_DATA_ELEMENT_ANTECEDENTE_MEDICO_UNO_CODIGO",
  "IdFromPlugin": "antecedenteMedicoUnoCodigo",
  "objectType": "DataElement"
}
```

```json
{
  "IdFromApp": "UID_DATA_ELEMENT_ANTECEDENTE_MEDICO_UNO_NOMBRE",
  "IdFromPlugin": "antecedenteMedicoUno",
  "objectType": "DataElement"
}
```

Para anomalias congenitas, el archivo trae estos ejemplos:

```js
{
    id: 1,
    code: 'anomaliaCongenitaUnoCodigo',
    name: 'anomaliaCongenitaUno',
}
```

En Tracker Plugin Configurator:

```json
{
  "IdFromApp": "UID_DATA_ELEMENT_ANOMALIA_CONGENITA_UNO_CODIGO",
  "IdFromPlugin": "anomaliaCongenitaUnoCodigo",
  "objectType": "DataElement"
}
```

```json
{
  "IdFromApp": "UID_DATA_ELEMENT_ANOMALIA_CONGENITA_UNO_NOMBRE",
  "IdFromPlugin": "anomaliaCongenitaUno",
  "objectType": "DataElement"
}
```

## Configuracion completa de ejemplo

Ejemplo simplificado para una etapa de anomalias congenitas:

```json
{
  "fieldMap": [
    {
      "IdFromApp": "UID_DATA_ELEMENT_PLUGIN_ANOMALIAS_CONGENITAS",
      "IdFromPlugin": "pluginAnomaliasCongenitas",
      "objectType": "DataElement"
    },
    {
      "IdFromApp": "UID_DATA_ELEMENT_ANOMALIA_CONGENITA_UNO_CODIGO",
      "IdFromPlugin": "anomaliaCongenitaUnoCodigo",
      "objectType": "DataElement"
    },
    {
      "IdFromApp": "UID_DATA_ELEMENT_ANOMALIA_CONGENITA_UNO_NOMBRE",
      "IdFromPlugin": "anomaliaCongenitaUno",
      "objectType": "DataElement"
    },
    {
      "IdFromApp": "UID_DATA_ELEMENT_ANOMALIA_CONGENITA_DOS_CODIGO",
      "IdFromPlugin": "anomaliaCongenitaDosCodigo",
      "objectType": "DataElement"
    },
    {
      "IdFromApp": "UID_DATA_ELEMENT_ANOMALIA_CONGENITA_DOS_NOMBRE",
      "IdFromPlugin": "anomaliaCongenitaDos",
      "objectType": "DataElement"
    }
  ]
}
```

La regla de programa de esa etapa debe asignar:

```text
pluginAnomaliasCongenitas = ANOMALIAS_CONGENITAS
```

## Agregar mas slots a un contexto

Para agregar mas campos a un contexto, editar `capture-plugin/src/config/dataElements.js`.

Ejemplo:

```js
anomalias_congenitas: {
    label: 'Anomalias congenitas',
    fieldSets: [
        {
            id: 1,
            code: 'anomaliaCongenitaUnoCodigo',
            name: 'anomaliaCongenitaUno',
        },
        {
            id: 2,
            code: 'anomaliaCongenitaDosCodigo',
            name: 'anomaliaCongenitaDos',
        },
        {
            id: 3,
            code: 'anomaliaCongenitaTresCodigo',
            name: 'anomaliaCongenitaTres',
        },
    ],
}
```

Despues de agregar el slot, mapear los nuevos aliases en Tracker Plugin Configurator.

## Prioridad si hay multiples contextos activos

Si por error DHIS2 asigna mas de un Data Element tecnico al mismo tiempo, el plugin usa el primer contexto que coincida segun el orden de `contextAliases` en `dataElements.js`.

Se recomienda que cada etapa asigne solo un contexto tecnico.

## Configuracion del API MedDRA

Para desarrollo local se puede usar el mock configurando `useMock: true` en:

```text
capture-plugin/src/config/apiConfig.js
```

Para usar el API real de MedDRA, configurar los endpoints y desactivar el mock:

```js
useMock: false
```

En produccion, las credenciales deben configurarse en el Datastore de DHIS2:

```text
Datastore/
  MedDRA/
    API-CONFIG/
      key: "API_KEY"
      code: "USER_ID"
    SEARCH-CONFIG/
      cuerpo de busqueda usado por la API
```

## Validacion despues de configurar

1. Ejecutar `yarn build`.
2. Instalar el paquete generado en DHIS2.
3. Configurar el plugin en Tracker Plugin Configurator.
4. Verificar que el Data Element tecnico de la etapa recibe el valor esperado.
5. Buscar y seleccionar un termino MedDRA.
6. Confirmar que el codigo y nombre se escriben en los Data Elements del contexto activo.

## Problemas comunes

### El plugin escribe en antecedentes medicos aunque esperaba otro contexto

Verificar que el Data Element tecnico del nuevo contexto:

- Existe en la etapa.
- Esta mapeado en Tracker Plugin Configurator.
- Tiene el alias correcto en `IdFromPlugin`.
- Recibe exactamente el valor esperado por regla de programa.

### El plugin no escribe valores

Verificar que los Data Elements destino estan mapeados con `objectType: "DataElement"` y que `IdFromPlugin` coincide con los aliases de `dataElements.js`.

### El build falla al borrar `build/app`

En Windows/OneDrive puede ocurrir un bloqueo de archivos con error `EPERM`. Cerrar procesos que esten usando la carpeta `capture-plugin/build`, cerrar editores o exploradores apuntando a esa ruta, y volver a ejecutar:

```bash
yarn build
```

## Autor

Diego Peralta Suing

diego.peralta.suing@gmail.com

## Licencia

MIT
