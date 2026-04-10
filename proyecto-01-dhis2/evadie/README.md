# EVADIE en DHIS2

## Propósito
Contiene los metadatos, formularios y scripts del programa Tracker de DHIS2 para el seguimiento de Eventos Adversos de Interés Especial (EVADIE) en Ecuador. EVADIE registra efectos secundarios asociados a vacunas o medicamentos que requieren evaluación y monitoreo diferenciado, con una estructura análoga al programa ESAVI.

## Estructura
```
evadie/
├── forms/
│   ├── custom/                # Formularios HTML personalizados para entrada de datos
│   └── section/               # Formularios por sección (layout estándar DHIS2)
├── metadata/
│   ├── dataElements/          # Definición de elementos de datos del programa
│   ├── optionSets/            # Conjuntos de opciones (catálogos y listas controladas)
│   ├── organisationUnits/     # Unidades organizativas (establecimientos de salud)
│   ├── programRules/          # Reglas de programa para validación y lógica de negocio
│   ├── programs/              # Definición del programa Tracker EVADIE
│   └── trackedEntityTypes/    # Tipo de entidad rastreada
└── scripts/                   # Scripts de mantenimiento y migración del programa EVADIE
```

## Resumen del directorio
El módulo EVADIE en DHIS2 complementa al módulo ESAVI con un enfoque en eventos adversos que requieren vigilancia activa pero tienen criterios de clasificación propios. La estructura de metadatos es análoga a la de ESAVI, lo que facilita el mantenimiento conjunto de ambos programas. Los datos de este programa también son consumidos por el proyecto Integra-ESAVI.

## Ejemplos de qué puede escribirse aquí
- Archivo JSON del programa Tracker EVADIE exportado desde DHIS2
- Elementos de datos específicos de EVADIE como "Medicamento o vacuna asociada", "Tipo de evento adverso de interés especial"
- Option sets para la clasificación de eventos adversos según criterios EVADIE
- Reglas de programa para derivación automática según criterios clínicos específicos
- Scripts para sincronizar elementos de configuración comunes entre EVADIE y ESAVI
