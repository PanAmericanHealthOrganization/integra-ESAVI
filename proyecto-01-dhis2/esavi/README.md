# ESAVI en DHIS2

## Propósito
Contiene los metadatos, formularios y scripts del programa Tracker de DHIS2 para la notificación y seguimiento de Eventos Supuestamente Atribuibles a la Vacunación e Inmunización (ESAVI) en Ecuador. Sigue los lineamientos técnicos de la OPS/PAHO para la vigilancia de efectos adversos post-vacunación.

## Estructura
```
esavi/
├── forms/
│   ├── custom/                # Formularios HTML personalizados para entrada de datos
│   └── section/               # Formularios por sección (layout estándar DHIS2)
├── metadata/
│   ├── dataElements/          # Definición de elementos de datos del programa
│   ├── optionSets/            # Conjuntos de opciones (catálogos y listas controladas)
│   ├── organisationUnits/     # Unidades organizativas (establecimientos de salud)
│   ├── programRules/          # Reglas de programa para validación y lógica de negocio
│   ├── programs/              # Definición del programa Tracker ESAVI
│   └── trackedEntityTypes/    # Tipo de entidad rastreada (caso/paciente)
└── scripts/                   # Scripts de mantenimiento y migración del programa ESAVI
```

## Resumen del directorio
Este módulo representa el programa oficial de vigilancia ESAVI en DHIS2. Los metadatos siguen los estándares de la OPS/PAHO para la notificación de efectos adversos post-vacunación. Los formularios definen la interfaz de captura de datos y las reglas de programa aseguran la calidad del dato en el punto de entrada. Los datos capturados aquí son consumidos por el proyecto Integra-ESAVI.

## Ejemplos de qué puede escribirse aquí
- Archivo JSON del programa Tracker ESAVI exportado desde DHIS2 (para versionar la configuración)
- Definición de elementos de datos como "Fecha de vacunación", "Tipo de vacuna", "Descripción del evento adverso"
- Option sets para clasificación de gravedad del evento (leve, moderado, grave, fatal)
- Reglas de programa que ocultan o muestran campos según el tipo de evento registrado
- Scripts para migrar la configuración del programa entre entornos DHIS2
