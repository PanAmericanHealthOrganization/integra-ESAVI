# Feature: Contextos dinamicos para plugin unico WHODrug en DHIS2 Capture

## Objetivo

Implementar un unico plugin DHIS2 Capture capaz de escribir en distintos grupos de campos segun el contexto de la etapa/formulario. El contexto se determina mediante Data Elements tecnicos ya creados en DHIS2 y asignados por reglas de programa.

El plugin debe detectar si esta trabajando, por ejemplo, en contexto `VACUNAS` o `MEDICAMENTOS`, y con base en eso seleccionar el grupo correcto de aliases desde `capture-plugin/src/config/mappings.json`.

## Supuestos funcionales

- El usuario no elige manualmente el contexto.
- El contexto se asigna desde DHIS2 mediante reglas de programa.
- Existen Data Elements tecnicos por contexto, por ejemplo:
  - `plugin_vacunas` con valor `VACUNAS`
  - `plugin_medicamentos` con valor `MEDICAMENTOS`
- Estos Data Elements pueden no renderizarse visualmente en el formulario.
- Los Data Elements tecnicos deben estar mapeados en Tracker Plugin Configurator.
- El plugin debe seguir siendo uno solo.
- No crear varios plugins si la logica de busqueda/asignacion es la misma y solo cambian los aliases destino.

## Configuracion requerida en DHIS2

En Tracker Plugin Configurator, mapear los Data Elements tecnicos con aliases estables:

```json
{
  "IdFromApp": "UID_DEL_DATA_ELEMENT_PLUGIN_VACUNAS",
  "IdFromPlugin": "plugin_vacunas",
  "objectType": "DataElement"
}
```

```json
{
  "IdFromApp": "UID_DEL_DATA_ELEMENT_PLUGIN_MEDICAMENTOS",
  "IdFromPlugin": "plugin_medicamentos",
  "objectType": "DataElement"
}
```

Tambien deben mapearse todos los campos destino que el plugin escribira. Por ejemplo, para vacunas:

```text
abreviaturaCodigoUno
abreviaturaNombreUno
vacunaCodigoUno
vacunaNombreUno
```

Y para medicamentos, otros aliases equivalentes, por ejemplo:

```text
medicamentoAbreviaturaCodigoUno
medicamentoAbreviaturaNombreUno
medicamentoCodigoUno
medicamentoNombreUno
```

Los nombres exactos pueden variar, pero deben coincidir con los aliases definidos en `mappings.json`.

## Valores esperados

Las reglas de programa deben asignar valores exactos y consistentes:

```text
plugin_vacunas = VACUNAS
plugin_medicamentos = MEDICAMENTOS
```

Evitar variaciones como:

```text
Vacunas
vacuna
MEDICAMENTO
 medicamentos 
```

El plugin debe normalizar los valores recibidos usando `trim()` y mayusculas/minusculas para reducir errores.

## Estructura esperada de mappings.json

Convertir `capture-plugin/src/config/mappings.json` desde una estructura plana:

```json
{
  "slots": []
}
```

a una estructura por contexto:

```json
{
  "_comment": "Aliases IdFromPlugin configurados en Tracker Plugin Configurator. contexts define que grupo de campos debe usar el plugin segun el valor tecnico asignado por reglas de programa.",
  "defaultContext": "vacunas",
  "contextAliases": {
    "plugin_vacunas": "VACUNAS",
    "plugin_medicamentos": "MEDICAMENTOS"
  },
  "contexts": {
    "vacunas": {
      "label": "Vacunas",
      "slots": [
        {
          "id": 1,
          "abbreviationCode": "abreviaturaCodigoUno",
          "abbreviationText": "abreviaturaNombreUno",
          "drugCode": "vacunaCodigoUno",
          "drugName": "vacunaNombreUno"
        }
      ]
    },
    "medicamentos": {
      "label": "Medicamentos",
      "slots": [
        {
          "id": 1,
          "abbreviationCode": "medicamentoAbreviaturaCodigoUno",
          "abbreviationText": "medicamentoAbreviaturaNombreUno",
          "drugCode": "medicamentoCodigoUno",
          "drugName": "medicamentoNombreUno"
        }
      ]
    }
  }
}
```

Notas:

- `contexts.vacunas.slots` puede reutilizar los slots actuales.
- `contexts.medicamentos.slots` debe contener los aliases destino reales para medicamentos.
- Mantener los nombres internos `abbreviationCode`, `abbreviationText`, `drugCode`, `drugName` aunque el contexto no sea vacunas, para no reescribir toda la logica existente.
- Si se agrega otro contexto en el futuro, agregarlo a `contextAliases` y `contexts`.

## Resolucion de contexto

Crear una funcion pura para resolver el contexto desde `values`.

Ubicacion sugerida:

```text
capture-plugin/src/utils/resolvePluginContext.js
```

Implementacion esperada:

```js
export const normalizeContextValue = (value) => {
    if (value === null || value === undefined) return ''
    return String(value).trim().toUpperCase()
}

export const resolvePluginContext = (values = {}, mappings = {}) => {
    const contextAliases = mappings.contextAliases ?? {}

    for (const [alias, expectedValue] of Object.entries(contextAliases)) {
        const actual = normalizeContextValue(values[alias])
        const expected = normalizeContextValue(expectedValue)

        if (actual !== '' && actual === expected) {
            return expected.toLowerCase()
        }
    }

    return mappings.defaultContext ?? null
}
```

Comportamiento:

- Si `values.plugin_vacunas === "VACUNAS"`, retorna `vacunas`.
- Si `values.plugin_medicamentos === "MEDICAMENTOS"`, retorna `medicamentos`.
- Si no detecta contexto, retorna `mappings.defaultContext`.
- Si no existe `defaultContext`, retorna `null`.

## Cambios en Plugin.js

En `capture-plugin/src/Plugin.js`, reemplazar el uso directo de:

```js
const slots = mappings.slots ?? []
```

por una seleccion basada en contexto:

```js
import { resolvePluginContext } from './utils/resolvePluginContext.js'
```

Dentro del componente:

```js
const contextKey = resolvePluginContext(values, mappings)
const activeContext =
    contextKey && mappings.contexts
        ? mappings.contexts[contextKey]
        : null
const slots = activeContext?.slots ?? []
```

Para `viewMode`, contar usando los slots activos:

```js
const contextKey = resolvePluginContext(values, mappings)
const activeContext = mappings.contexts?.[contextKey]
const slots = activeContext?.slots ?? []
```

Actualizar textos de advertencia:

```js
if (!activeContext) {
    return (
        <NoticeBox warning title="Contexto de plugin no detectado">
            No se pudo detectar el contexto WHODrug. Verifica que los Data Elements
            tecnicos plugin_vacunas/plugin_medicamentos esten mapeados y tengan
            valor asignado por reglas de programa.
        </NoticeBox>
    )
}
```

Si `activeContext` existe pero no tiene slots:

```js
if (slots.length === 0) {
    return (
        <NoticeBox warning title="Sin mapeos configurados">
            El contexto detectado no tiene slots definidos en mappings.json.
        </NoticeBox>
    )
}
```

Pasar opcionalmente el nombre del contexto al componente:

```js
<WhoDrugCascade
    config={config}
    slots={slots}
    values={values}
    setFieldValue={updateFieldValue}
    contextLabel={activeContext.label ?? contextKey}
/>
```

Si `WhoDrugCascade` no usa `contextLabel`, no es obligatorio agregarlo.

## Compatibilidad con estructura anterior

Para permitir migracion gradual, se puede soportar tambien la estructura plana:

```js
const hasContextMappings = Boolean(mappings.contexts)
const contextKey = hasContextMappings
    ? resolvePluginContext(values, mappings)
    : null
const activeContext = hasContextMappings
    ? mappings.contexts?.[contextKey]
    : { label: 'Vacunas', slots: mappings.slots ?? [] }
const slots = activeContext?.slots ?? []
```

Esto permite que el plugin siga funcionando con el `mappings.json` actual mientras se migra a `contexts`.

## Prioridad si hay multiples contextos con valor

Si por error DHIS2 asigna ambos valores al mismo tiempo:

```text
plugin_vacunas = VACUNAS
plugin_medicamentos = MEDICAMENTOS
```

La prioridad sera el orden de `contextAliases` en `mappings.json`.

Ejemplo:

```json
"contextAliases": {
  "plugin_vacunas": "VACUNAS",
  "plugin_medicamentos": "MEDICAMENTOS"
}
```

En ese caso se resolvera primero `vacunas`.

Si se quiere evitar ambiguedad, agregar una advertencia opcional cuando mas de un contexto coincida.

## Validaciones necesarias

Despues de implementar:

1. Ejecutar desde la raiz del proyecto:

```powershell
yarn build
```

2. Levantar el servidor:

```powershell
yarn start
```

3. Probar etapa con contexto vacunas:

```text
plugin_vacunas = VACUNAS
```

Resultado esperado:

- El plugin usa `mappings.contexts.vacunas.slots`.
- Al asignar una vacuna, escribe en los aliases de vacunas.

4. Probar etapa con contexto medicamentos:

```text
plugin_medicamentos = MEDICAMENTOS
```

Resultado esperado:

- El plugin usa `mappings.contexts.medicamentos.slots`.
- Al asignar un elemento, escribe en los aliases de medicamentos.

5. Probar sin contexto:

Resultado esperado:

- Usa `defaultContext`, o muestra advertencia si no hay default.

## Criterios de aceptacion

- El proyecto sigue usando un solo plugin.
- El contexto se resuelve desde los valores de Data Elements tecnicos enviados por DHIS2.
- No se depende del nombre visual de la seccion del formulario.
- `mappings.json` permite definir multiples contextos.
- El plugin escribe en los aliases correctos segun el contexto.
- Si falta contexto o faltan slots, se muestra una advertencia clara.
- El build termina correctamente con `yarn build`.
- No introducir cambios visuales no solicitados en los selectores/listas.

## Restricciones importantes

- No usar `npm install`; este proyecto debe mantenerse con Yarn.
- No volver a agregar `package-lock.json`.
- No crear multiples plugins si la logica es compartida.
- No depender de nombres visuales de secciones DHIS2.
- No cambiar el comportamiento de busqueda/seleccion salvo que sea estrictamente necesario.
- No modificar aliases existentes sin actualizar tambien Tracker Plugin Configurator.

## Resumen de implementacion para una IA

1. Leer `capture-plugin/src/config/mappings.json`.
2. Migrarlo a estructura `contexts`, preservando los slots actuales bajo `contexts.vacunas.slots`.
3. Agregar `contextAliases` con `plugin_vacunas` y `plugin_medicamentos`.
4. Crear `capture-plugin/src/utils/resolvePluginContext.js`.
5. Modificar `capture-plugin/src/Plugin.js` para seleccionar `slots` desde el contexto activo.
6. Mantener compatibilidad con `mappings.slots` si se desea migracion gradual.
7. No modificar la UI de los selectores.
8. Ejecutar `yarn build`.
9. Reportar claramente los archivos modificados y cualquier supuesto.
