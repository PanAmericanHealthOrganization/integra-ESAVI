# Vacunación en DHIS2

## Propósito
Contiene los metadatos, formularios y scripts del programa DHIS2 para el registro y seguimiento de vacunación en Ecuador. Actúa como fuente de datos de dosis aplicadas, lo que permite al proyecto Integra-ESAVI establecer la trazabilidad entre una vacuna administrada y un posible evento adverso (ESAVI o EVADIE) notificado posteriormente.

## Estructura
```
vacunacion/
├── forms/
│   ├── custom/                # Formularios HTML personalizados para registro de vacunación
│   └── section/               # Formularios por sección (layout estándar DHIS2)
├── metadata/
│   ├── dataElements/          # Elementos de datos del programa de vacunación
│   ├── optionSets/            # Catálogos (tipos de vacuna, fabricante, número de dosis)
│   ├── organisationUnits/     # Unidades organizativas (establecimientos vacunadores)
│   ├── programRules/          # Reglas de programa para esquemas y validaciones
│   ├── programs/              # Definición del programa de vacunación
│   └── trackedEntityTypes/    # Tipo de entidad rastreada (beneficiario/paciente)
└── scripts/                   # Scripts de mantenimiento del programa de vacunación
```

## Resumen del directorio
Este módulo gestiona la captura de datos de vacunación en DHIS2. Provee la información base de dosis administradas que es consumida por Integra-ESAVI para cruzar con los reportes de efectos adversos de ESAVI y EVADIE. La trazabilidad vacuna-evento es un componente central de la plataforma de vigilancia.

## Ejemplos de qué puede escribirse aquí
- Archivo JSON del programa Tracker de vacunación exportado desde DHIS2
- Elementos de datos como "Vacuna aplicada", "Número de lote", "Fecha de aplicación", "Número de dosis"
- Option sets para los tipos de vacuna del esquema nacional de inmunización de Ecuador
- Reglas de programa para alertas de esquema de vacunación incompleto
- Scripts para exportar registros de vacunación y cruzarlos con notificaciones ESAVI
