export const ESTRUCTURA_REGLAS_CALIDAD = [
  {
    dimension: "Exactitud",
    jsonDimensionQuality: [
      {
        codigo: "EXA_SEM_001",
        subDimension: "Dimensión de Exactitud Semántica",
        regla: "Edad al inicio del evento",
      },
      {
        codigo: "EXA_SEM_002",
        subDimension: "Dimensión de Exactitud Semántica",
        regla: "Nombre vacuna",
      },
    ],
  },
  {
    dimension: "Consistencia",
    calidadTotal: 72.09302325581395,
    deltaCalidadTotal: 0,
    jsonDimensionQuality: [
      {
        codigo: "CON_DOM_001_FECHA_ATENCION",
        subDimension: "Dominio",
        regla: "No fechas futuras en TR_NOTIFICACION.FECHA_ATENCION",
      },
      {
        codigo: "CON_DOM_001_FECHA_NOTIFICACION",
        subDimension: "Dominio",
        regla: "No fechas futuras en TR_NOTIFICACION.FECHA_NOTIFICACION",
      },
      {
        codigo: "CON_DOM_001_FECHA_REPORTE_NACIONAL",
        subDimension: "Dominio",
        regla: "No fechas futuras en TR_NOTIFICACION.FECHA_REPORTE_NACIONAL",
      },
      {
        codigo: "CON_DOM_001_FECHA_LLENADO_FICHA",
        subDimension: "Dominio",
        regla: "No fechas futuras en TR_NOTIFICACION.FECHA_LLENADO_FICHA",
      },
      {
        codigo: "CON_DOM_001_FECHA_NACIMIENTO",
        subDimension: "Dominio",
        regla: "No fechas futuras en TR_PACIENTE.FECHA_NACIMIENTO",
      },
      {
        codigo: "CON_DOM_001_FECHAULTIMAMENSTRUACIONESAVI",
        subDimension: "Dominio",
        regla:
          "No fechas futuras en TR_ESAVI_DURANTE_EMBARAZO.FECHAULTIMAMENSTRUACIONESAVI",
      },
      {
        codigo: "CON_DOM_001_FECHA_VACUNACION",
        subDimension: "Dominio",
        regla: "No fechas futuras en TR_DATO_VACUNACION.FECHA_VACUNACION",
      },
      {
        codigo: "CON_DOM_001_FECHAMUERTE",
        subDimension: "Dominio",
        regla: "No fechas futuras en TR_DESENLACE_ESAVI.FECHAMUERTE",
      },
      {
        codigo: "CON_DOM_001_FECHANOTIFICAMUERTE",
        subDimension: "Dominio",
        regla: "No fechas futuras en TR_DESENLACE_ESAVI.FECHANOTIFICAMUERTE",
      },
      {
        codigo: "CON_DOM_001_FECHA_NACIMIENTO",
        subDimension: "Dominio",
        regla: "No fechas futuras en TR_PACIENTE.FECHA_NACIMIENTO",
      },
      {
        codigo: "CON_DOM_02",
        subDimension: "Dominio",
        regla: "Fecha de nacimiento mínima posible",
      },
      {
        codigo: "CON_DOM_03",
        subDimension: "Dominio",
        regla: "Edad mínima posible",
      },
      {
        codigo: "CON_INTRA_OO1",
        subDimension: "Intrarelación",
        regla: "Notificación enviada",
        condicion: "La fecha de notificación debe estar registrada.",
      },
      {
        codigo: "CON_INTRA_OO2",
        subDimension: "Intrarelación",
        regla: "Integridad ESAVI",
      },
      {
        codigo: "CON_DOM_02",
        subDimension: "Interrelación",
        regla:
          "El registro de una vacuna debe ir asociado al registro de la fecha de administración de la vacuna",
      },
      {
        codigo: "CON_DOM_001",
        subDimension: "Dominio",
        regla:
          "Integridad FECHA_NACIMIENTO (solo para casos en los que FECHA_NACIMIENTO es distinto de null)",
      },
      {
        codigo: "CON_DOM_002",
        subDimension: "Dominio",
        regla:
          "Integridad FECHA_VACUNACION (solo para casos en los que FECHA_VACUNACION es distinto de null)",
      },
      {
        codigo: "CON_DOM_003",
        subDimension: "Dominio",
        regla:
          "Integridad FECHA_ESAVI (solo para casos en los que FECHA_ESAVI es distinto de null)",
      },
      {
        codigo: "CON_DOM_004",
        subDimension: "Interrelación",
        regla:
          "Integridad FECHA_NOTIFICACION\n(solo para casos en los que FECHA_NOTIFICACION es distinto de null)",
      },
      {
        codigo: "CON_DOM_005",
        subDimension: "Interrelación",
        regla: "Integridad Fecha de Muerte (casos fatales)",
      },
      {
        codigo: "CON_DOM_006",
        subDimension: "Interrelación",
        regla:
          "Los ESAVI graves deben tener al menos un motivo de gravedad registrado",
      },
      {
        codigo: "CON_DOM_007",
        subDimension: "Interrelación",
        regla: "Integridad Casos Fatales",
      },
      {
        codigo: "CON_DOM_008",
        subDimension: "Interrelación",
        regla: "Integridad Gestante",
      },
    ],
  },
  {
    dimension: "Completitud",
    calidadTotal: 0,
    deltaCalidadTotal: 0,
    jsonDimensionQuality: [
      {
        codigo: "CON_DOM_001_FECHA_ATENCION",
        subDimension: "Completitud",
        regla: "No fechas futuras en TR_NOTIFICACION.FECHA_ATENCION",
      },
      {
        codigo: "CON_DOM_001_FECHA_NOTIFICACION",
        subDimension: "Completitud",
        regla: "No fechas futuras en TR_NOTIFICACION.FECHA_NOTIFICACION",
      },
      {
        codigo: "CON_DOM_001_FECHA_REPORTE_NACIONAL",
        subDimension: "Completitud",
        regla: "No fechas futuras en TR_NOTIFICACION.FECHA_REPORTE_NACIONAL",
      },
      {
        codigo: "CON_DOM_001_FECHA_LLENADO_FICHA",
        subDimension: "Completitud",
        regla: "No fechas futuras en TR_NOTIFICACION.FECHA_LLENADO_FICHA",
      },
      {
        codigo: "CON_DOM_001_FECHA_NACIMIENTO",
        subDimension: "Completitud",
        regla: "No fechas futuras en TR_PACIENTE.FECHA_NACIMIENTO",
      },
      {
        codigo: "CON_DOM_001_FECHAULTIMAMENSTRUACIONESAVI",
        subDimension: "Completitud",
        regla:
          "No fechas futuras en TR_ESAVI_DURANTE_EMBARAZO.FECHAULTIMAMENSTRUACIONESAVI",
      },
      {
        codigo: "CON_DOM_001_FECHA_VACUNACION",
        subDimension: "Completitud",
        regla: "No fechas futuras en TR_DATO_VACUNACION.FECHA_VACUNACION",
      },
      {
        codigo: "CON_DOM_001_FECHAMUERTE",
        subDimension: "Completitud",
        regla: "No fechas futuras en TR_DESENLACE_ESAVI.FECHAMUERTE",
      },
      {
        codigo: "CON_DOM_001_FECHANOTIFICAMUERTE",
        subDimension: "Completitud",
        regla: "No fechas futuras en TR_DESENLACE_ESAVI.FECHANOTIFICAMUERTE",
      },
      {
        codigo: "CON_DOM_001_FECHA_NACIMIENTO",
        subDimension: "Completitud",
        regla: "No fechas futuras en TR_PACIENTE.FECHA_NACIMIENTO",
      },
    ],
  },
]
