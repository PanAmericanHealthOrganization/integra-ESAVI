# Componentes compartidos

## Propósito

Toda la información compartida por todos los proyectos: documentación general, documentos de requerimientos, autenticación, manuales técnicos, banderas, logotipos, estándares terminológicos, entre otros. El objetivo es mantener esta carpeta como **fuente única de verdad** para los datos y recursos comunes a toda la plataforma ESAVI.

## Estructura

```
shared/
├── assets/               # Recursos gráficos y visuales
│   ├── diagramas/        # Diagramas de arquitectura y flujos
│   ├── imagenes/         # Imágenes generales del proyecto
│   └── logos/            # Logotipos institucionales y de la plataforma
├── estandares/           # Estándares aplicados en la plataforma
│   ├── codigo-fuente/    # Guías de estilo y convenciones de código
│   ├── gobernanza/       # Lineamientos de gobernanza de datos
│   └── terminologicos/   # Diccionarios y clasificaciones médicas (MedDRA, WHODrug, CIE-10)
└── referencias/          # Documentos de referencia externos
    ├── PAHO/             # Documentos y guías de OPS/PAHO
    └── guias-pais/       # Guías nacionales de farmacovigilancia (Ecuador)
```

## Estándares terminológicos

La subcarpeta [`estandares/terminologicos/`](estandares/terminologicos/README.md) centraliza la documentación de los vocabularios controlados utilizados para la codificación de eventos adversos, medicamentos y diagnósticos. Consultar ese README para el detalle de cada estándar (MedDRA, WHODrug, CIE-10).
