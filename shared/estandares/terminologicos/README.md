# Estándares terminológicos

Vocabularios controlados y clasificaciones internacionales utilizados en la plataforma ESAVI para la codificación estandarizada de eventos adversos, medicamentos y diagnósticos.

---

## MedDRA — Medical Dictionary for Regulatory Activities

**Organismo responsable:** ICH (International Council for Harmonisation of Technical Requirements for Pharmaceuticals for Human Use), mantenido por MSSO (MedDRA Maintenance and Support Services Organization).

**Propósito:** Terminología médica internacional para registrar, analizar y comunicar información sobre medicamentos y dispositivos médicos. Es el estándar regulatorio para la codificación de eventos adversos en reportes de seguridad (ICSR).

**Estructura jerárquica:**

| Nivel | Sigla | Descripción |
|-------|-------|-------------|
| 1 (superior) | SOC | System Organ Class — Clase de órgano o sistema |
| 2 | HLGT | High Level Group Term — Término de grupo de alto nivel |
| 3 | HLT | High Level Term — Término de alto nivel |
| 4 | PT | Preferred Term — Término preferido (unidad principal de análisis) |
| 5 (inferior) | LLT | Lowest Level Term — Término de nivel más bajo |

**Aplicación en ESAVI:**
- Codificación de signos, síntomas y diagnósticos de eventos adversos supuestamente atribuibles a la vacunación e inmunización.
- Generación de reportes E2B(R3) para envío a bases de datos internacionales (VigiBase, VAERS).
- Análisis de señales de seguridad mediante agrupaciones MedDRA.

**Versión:** Se actualiza dos veces al año (marzo y septiembre). Requiere licencia de usuario. Información en: [https://www.meddra.org](https://www.meddra.org)

---

## WHODrug — WHO Drug Dictionary

**Organismo responsable:** Uppsala Monitoring Centre (UMC), centro colaborador de la OMS para la vigilancia internacional de medicamentos.

**Propósito:** Diccionario de medicamentos de referencia mundial que permite la identificación y codificación estandarizada de fármacos, vacunas y productos biológicos, incluyendo sus nombres comerciales, principios activos, formas farmacéuticas y rutas de administración.

**Componentes principales:**

- **WHODrug Global:** Base de datos completa con nombres de marca y genéricos de más de 130 países.
- **ATC (Anatomical Therapeutic Chemical):** Sistema de clasificación de medicamentos por órgano/sistema, mecanismo de acción y principio activo (5 niveles).
- **Preferred Name (PN) / Substance:** Nombre preferido del principio activo para normalización.

**Aplicación en ESAVI:**
- Codificación de las vacunas y medicamentos concomitantes reportados en los ESAVI.
- Identificación del principio activo (INN — International Nonproprietary Name) a partir de nombres comerciales locales.
- Trazabilidad del producto biológico: fabricante, lote, vía de administración.

**Versión:** Actualización trimestral. Requiere suscripción al UMC. Información en: [https://www.who-umc.org/whodrug](https://www.who-umc.org/whodrug)

---

## CIE-10 — Clasificación Internacional de Enfermedades, 10.ª Revisión

**Organismo responsable:** Organización Mundial de la Salud (OMS / WHO). Versión en español publicada y distribuida por OPS/PAHO.

**Propósito:** Sistema de clasificación y codificación de enfermedades, trastornos, lesiones y causas de muerte. Es el estándar oficial para estadísticas de morbimortalidad y registros clínicos en la mayoría de los países de la Región de las Américas.

**Estructura:**

- Organizada en **21 capítulos** agrupados por sistemas orgánicos, etiología o condiciones especiales.
- Cada código tiene el formato `[Letra][2 dígitos].[dígito opcional]` (ej. `J11.1`, `T78.1`).
- Subcategorías de 4 caracteres para mayor especificidad clínica.

**Capítulos relevantes para farmacovigilancia:**

| Capítulo | Rango | Descripción |
|----------|-------|-------------|
| XIX | S00–T98 | Traumatismos, envenenamientos y otras consecuencias de causas externas |
| XX | V01–Y98 | Causas externas de morbilidad y mortalidad (incluye efectos adversos de medicamentos: Y40–Y59) |
| XVIII | R00–R99 | Síntomas, signos y hallazgos anormales no clasificados en otra parte |

**Aplicación en ESAVI:**
- Codificación del diagnóstico de ingreso y egreso del paciente con ESAVI.
- Clasificación de la condición de salud preexistente (comorbilidades).
- Registro de la causa de muerte en casos graves o fatales.

**Nota:** La OMS publicó CIE-11 en 2019 (vigente desde enero 2022), pero CIE-10 sigue siendo el estándar operativo en Ecuador y la mayoría de países de la región. La migración a CIE-11 deberá contemplarse en versiones futuras de la plataforma.

**Recurso oficial OPS:** [https://www.paho.org/es/clasificacion-internacional-enfermedades](https://www.paho.org/es/clasificacion-internacional-enfermedades)

---

## Relación entre estándares

```
Evento adverso (ESAVI)
│
├── Síntomas / Diagnóstico  →  MedDRA (PT/LLT)  +  CIE-10
│
├── Vacuna sospechosa       →  WHODrug (Preferred Name / ATC)
│
└── Medicamentos concomitantes  →  WHODrug (Preferred Name / ATC)
```

En el reporte E2B(R3) estas tres codificaciones coexisten y son complementarias: MedDRA para los términos del evento, WHODrug para los productos, y CIE-10 para el diagnóstico clínico del paciente.
