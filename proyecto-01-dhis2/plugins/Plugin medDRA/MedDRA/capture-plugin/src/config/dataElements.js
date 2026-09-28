
//Campos que se trabajara
export const MEDDRA_FIELD_SETS = [
    {
        id: 1,
        code: 'comorbilidadUnoCode',
        name: 'comorbilidadUno',
        codeCIE10: 'comorbilidadUnoCodeCIEX',
        termCIE10: 'comorbilidadUnoCIEX',
    },
    {
        id: 2,
        code: 'comorbilidadDosCode',
        name: 'comorbilidadDos',
        codeCIE10: 'comorbilidadDosCodeCIEX',
        termCIE10: 'comorbilidadDosCIEX',
    },
    {
        id: 3,
        code: 'comorbilidadTresCode',
        name: 'comorbilidadTres',
        codeCIE10: 'comorbilidadTresCodeCIEX',
        termCIE10: 'comorbilidadTresCIEX',
    },
    {
        id: 4,
        code: 'comorbilidadCuatroCode',
        name: 'comorbilidadCuatro',
        codeCIE10: 'comorbilidadCuatroCodeCIEX',
        termCIE10: 'comorbilidadCuatroCIEX',
    },
    {
        id: 5,
        code: 'comorbilidadCincoCode',
        name: 'comorbilidadCinco',
        codeCIE10: 'comorbilidadCincoCodeCIEX',
        termCIE10: 'comorbilidadCincoCIEX',
    },
    {
        id: 6,
        code: 'comorbilidadSeisCode',
        name: 'comorbilidadSeis',
        codeCIE10: 'comorbilidadSeisCodeCIEX',
        termCIE10: 'comorbilidadSeisCIEX',
    }
]

export const MEDDRA_CONTEXT_MAPPINGS = {
    defaultContext: 'comorbilidad',

    defaultContext: 'comorbilidad ',
    contextAliases: {
        // ***********************************ESAVI***********************************

        // STG Notificacion
        pluginCOMORBILIDAD: 'COMORBILIDAD',
        pluginDIAGNOSTICO: 'DIAGNOSTICO',

        // STG Investigacion
        pluginSINTOMATOLOGIA: 'SINTOMATOLOGIA',
        pluginOTROSSINTOMATOLOGIA: 'OTROS_SINTOMATOLOGIA',
        pluginComplicacionFetal: 'COMPLICACION_FETAL',
        pluginINMUNIZACION: 'INMUNIZACION_DIAGNOSTICO',
        pluginOTROINMUNIZACION: 'OTRO_INMUNIZACION',
        pluginANTECEDENTEPATOLOGICO: 'ANTECEDENTE_PATOLOGICO',
        pluginSINTOMATOLOGIAMEDICAMENTO: 'SINTOMATOLOGIA_MAS_RELEVANTE_MEDICAMENTO',
        pluginANTECEDENTEQUIRURGICO: 'ANTECEDENTE_QUIRURGICO',
        pluginANTECEDENTEPATOLOGICOPERSONAL: 'ANTECEDENTE_PATOLOGICO_PERSONAL',
        pluginANTECEDENTEPATOLOGICOFAMILIAR: 'ANTECEDENTE_PATOLOGICO_FAMILIAR',

        // STG clasificacion final
        pluginDIAGNOSTICOFINAL: 'DIAGNOSTICO_FINAL',

        // ***********************************EVADIE***********************************

        // STG Notificacion
        pluginCOMORBILIDADEVADIE: 'COMORBILIDAD_EVADIE',
        pluginDIAGNOSTICOINICIALEVADIE: 'DIAGNOSTICO_INICIAL_EVADIE',
        pluginOTROEVENTOSALUD: 'OTRO_EVENTO_SALUD',
        pluginOTROEVADIE: 'OTRO_EVADIE',
        pluginDIAGNOSTICOFINALEVADIE: 'DIAGNOSTICO_FINAL_EVADIE',


    },
    contexts: {
        // ***********************************ESAVI***********************************
        // STG Notificacion
        comorbilidad: {
            label: 'la comorbilidad',
            hiddenSections: false,
            fieldSets: MEDDRA_FIELD_SETS,
        },
        diagnostico: {
            label: 'el diagnóstico inicial',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'diagnosticoUnoCode',
                    name: 'diagnosticoUno',
                    codeCIE10: 'diagnosticoUnoCodeCIEX',
                    termCIE10: 'diagnosticoUnoCIEX',
                },
                {
                    id: 2,
                    code: 'diagnosticoDosCode',
                    name: 'diagnosticoDos',
                    codeCIE10: 'diagnosticoDosCodeCIEX',
                    termCIE10: 'diagnosticoDosCIEX',
                },
                {
                    id: 3,
                    code: 'diagnosticoTresCode',
                    name: 'diagnosticoTres',
                    codeCIE10: 'diagnosticoTresCodeCIEX',
                    termCIE10: 'diagnosticoTresCIEX',
                },
                {
                    id: 4,
                    code: 'diagnosticoCuatroCode',
                    name: 'diagnosticoCuatro',
                    codeCIE10: 'diagnosticoCuatroCodeCIEX',
                    termCIE10: 'diagnosticoCuatroCIEX',
                },
                {
                    id: 5,
                    code: 'diagnosticoCincoCode',
                    name: 'diagnosticoCinco',
                    codeCIE10: 'diagnosticoCincoCodeCIEX',
                    termCIE10: 'diagnosticoCincoCIEX',
                },
                {
                    id: 6,
                    code: 'diagnosticoSeisCode',
                    name: 'diagnosticoSeis',
                    codeCIE10: 'diagnosticoSeisCodeCIEX',
                    termCIE10: 'diagnosticoSeisCIEX',
                },
            ],
        },

        // STG Investigacion
        sintomatologia: {
            label: 'el signo y síntoma relevante',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'sintomatologiaUnoCode',
                    name: 'sintomatologiaUno',
                    codeCIE10: 'sintomatologiaUnoCodeCIEX',
                    termCIE10: 'sintomatologiaUnoCIEX',
                },
                {
                    id: 2,
                    code: 'sintomatologiaDosCode',
                    name: 'sintomatologiaDos',
                    codeCIE10: 'sintomatologiaDosCodeCIEX',
                    termCIE10: 'sintomatologiaDosCIEX',
                },
                {
                    id: 3,
                    code: 'sintomatologiaTresCode',
                    name: 'sintomatologiaTres',
                    codeCIE10: 'sintomatologiaTresCodeCIEX',
                    termCIE10: 'sintomatologiaTresCIEX',
                },
                {
                    id: 4,
                    code: 'sintomatologiaCuatroCode',
                    name: 'sintomatologiaCuatro',
                    codeCIE10: 'sintomatologiaCuatroCodeCIEX',
                    termCIE10: 'sintomatologiaCuatroCIEX',
                },
                {
                    id: 5,
                    code: 'sintomatologiaCincoCode',
                    name: 'sintomatologiaCinco',
                    codeCIE10: 'sintomatologiaCincoCodeCIEX',
                    termCIE10: 'sintomatologiaCincoCIEX',
                }
            ],
        },
        otros_sintomatologia: {
            label: 'otro signo y síntoma relevante',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'sintomatologiOtroCode',
                    name: 'sintomatologiOtro',
                    codeCIE10: 'sintomatologiOtroCodeCIEX',
                    termCIE10: 'sintomatologiOtroCIEX',
                }
            ],
        },
        complicacion_fetal: {
            label: 'la complicación durante el embarazo',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'diagnosticoComplicacionEmbarazoCodeUno',
                    name: 'diagnosticoComplicacionEmbarazoUno',
                    codeCIE10: 'diagnosticoComplicacionEmbarazoCIEXUno',
                    termCIE10: 'diagnosticoComplicacionEmbarazoCodeCIEXUno',
                },
                {
                    id: 2,
                    code: 'diagnosticoComplicacionEmbarazoCodeDos',
                    name: 'diagnosticoComplicacionEmbarazoDos',
                    codeCIE10: 'diagnosticoComplicacionEmbarazoCIEXDos',
                    termCIE10: 'diagnosticoComplicacionEmbarazoCodeCIEXDos',
                },
                {
                    id: 3,
                    code: 'diagnosticoComplicacionEmbarazoCodeTres',
                    name: 'diagnosticoComplicacionEmbarazoTres',
                    codeCIE10: 'diagnosticoComplicacionEmbarazoCIEXTres',
                    termCIE10: 'diagnosticoComplicacionEmbarazoCodeCIEXTres',
                }
            ],
        },
        inmunizacion_diagnostico: {
            label: 'el diagnóstico Inmunuzación',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'inmunizacionDiagnosticoUnoCode',
                    name: 'inmunizacionDiagnosticoUno',
                    codeCIE10: 'inmunizacionDiagnosticoUnoCodeCIEX',
                    termCIE10: 'inmunizacionDiagnosticoUnoCIEX',
                },
                {
                    id: 2,
                    code: 'inmunizacionDiagnosticoDosCode',
                    name: 'inmunizacionDiagnosticoDos',
                    codeCIE10: 'inmunizacionDiagnosticoDosCodeCIEX',
                    termCIE10: 'inmunizacionDiagnosticoDosCIEX',
                },
                {
                    id: 3,
                    code: 'inmunizacionDiagnosticoTresCode',
                    name: 'inmunizacionDiagnosticoTres',
                    codeCIE10: 'inmunizacionDiagnosticoTresCodeCIEX',
                    termCIE10: 'inmunizacionDiagnosticoTresCIEX',
                },
                {
                    id: 4,
                    code: 'inmunizacionDiagnosticoCuatroCode',
                    name: 'inmunizacionDiagnosticoCuatro',
                    codeCIE10: 'inmunizacionDiagnosticoCuatroCodeCIEX',
                    termCIE10: 'inmunizacionDiagnosticoCuatroCIEX',
                }
            ],
        },
        otro_inmunizacion: {
            label: 'otro diagnóstico de inmunización',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'otroInmunizacionUnoCode',
                    name: 'otroInmunizacionUno',
                    codeCIE10: 'otroInmunizacionUnoCodeCIEX',
                    termCIE10: 'otroInmunizacionUnoCIEX',
                }
            ],
        },
        antecedente_patologico: {
            label: 'el antecedente patológico agudo',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'AntecedentePatologicoUnoCode',
                    name: 'AntecedentePatologicoUno',
                    codeCIE10: 'AntecedentePatologicoUnoCodeCIEX',
                    termCIE10: 'AntecedentePatologicoUnoCIEX',
                },
                {
                    id: 2,
                    code: 'AntecedentePatologicoDosCode',
                    name: 'AntecedentePatologicoDos',
                    codeCIE10: 'AntecedentePatologicoDosCodeCIEX',
                    termCIE10: 'AntecedentePatologicoDosCIEX',
                },
                {
                    id: 3,
                    code: 'AntecedentePatologicoTresCode',
                    name: 'AntecedentePatologicoTres',
                    codeCIE10: 'AntecedentePatologicoTresCodeCIEX',
                    termCIE10: 'AntecedentePatologicoTresCIEX',
                }
            ],
        },
        sintomatologia_mas_relevante_medicamento: {
            label: 'el característica más relevante del evento adverso anterior',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'sintomaRelevanteUnoCode',
                    name: 'sintomaRelevanteUno',
                    codeCIE10: 'sintomaRelevanteUnoCodeCIEX',
                    termCIE10: 'sintomaRelevanteUnoCIEX',
                }
            ],
        },
        antecedente_quirurgico: {
            label: 'los antecedentes quirúrgico',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'antecedenteQuirurgicoUnoCode',
                    name: 'antecedenteQuirurgicoUno',
                    codeCIE10: 'antecedenteQuirurgicoUnoCodeCIEX',
                    termCIE10: 'antecedenteQuirurgicoUnoCIEX',
                },
                {
                    id: 2,
                    code: 'antecedenteQuirurgicoDosCode',
                    name: 'antecedenteQuirurgicoDos',
                    codeCIE10: 'antecedenteQuirurgicoDosCodeCIEX',
                    termCIE10: 'antecedenteQuirurgicoDosCIEX',

                },
                {
                    id: 3,
                    code: 'antecedenteQuirurgicoTresCode',
                    name: 'antecedenteQuirurgicoTres',
                    codeCIE10: 'antecedenteQuirurgicoTresCodeCIEX',
                    termCIE10: 'antecedenteQuirurgicoTresCIEX',
                }
            ],
        },
        antecedente_patologico_personal: {
            label: 'el antecedente patológico personal',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'antecedentePatologicoPersonalUnoCode',
                    name: 'antecedentePatologicoPersonalUno',
                    codeCIE10: 'antecedentePatologicoPersonalUnoCodeCIEX',
                    termCIE10: 'antecedentePatologicoPersonalUnoCIEX',
                },
                {
                    id: 2,
                    code: 'antecedentePatologicoPersonalDosCode',
                    name: 'antecedentePatologicoPersonalDos',
                    codeCIE10: 'antecedentePatologicoPersonalDosCodeCIEX',
                    termCIE10: 'antecedentePatologicoPersonalDosCIEX',
                },
                {
                    id: 3,
                    code: 'antecedentePatologicoPersonalTresCode',
                    name: 'antecedentePatologicoPersonalTres',
                    codeCIE10: 'antecedentePatologicoPersonalTresCodeCIEX',
                    termCIE10: 'antecedentePatologicoPersonalTresCIEX',
                }
            ],
        },
        antecedente_patologico_familiar: {
            label: 'el antecedente patológico familiar',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'antecedentePatologicoFamiliarUnoCode',
                    name: 'antecedentePatologicoFamiliarUno',
                    codeCIE10: 'antecedentePatologicoFamiliarUnoCodeCIEX',
                    termCIE10: 'antecedentePatologicoFamiliarUnoCIEX',
                },
                {
                    id: 2,
                    code: 'antecedentePatologicoFamiliarDosCode',
                    name: 'antecedentePatologicoFamiliarDos',
                    codeCIE10: 'antecedentePatologicoFamiliarDosCodeCIEX',
                    termCIE10: 'antecedentePatologicoFamiliarDosCIEX',
                },
                {
                    id: 3,
                    code: 'antecedentePatologicoFamiliarTresCode',
                    name: 'antecedentePatologicoFamiliarTres',
                    codeCIE10: 'antecedentePatologicoFamiliarTresCodeCIEX',
                    termCIE10: 'antecedentePatologicoFamiliarTresCIEX',
                }
            ],
        },
        // STG clasificación final
        diagnostico_final: {
            label: 'el diagnóstico final',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'diagnosticoFinalUnoCode',
                    name: 'diagnosticoFinalUno',
                    codeCIE10: 'diagnosticoFinalUnoCodeCIEX',
                    termCIE10: 'diagnosticoFinalUnoCIEX',
                },
                {
                    id: 2,
                    code: 'diagnosticoFinalDosCode',
                    name: 'diagnosticoFinalDos',
                    codeCIE10: 'diagnosticoFinalDosCodeCIEX',
                    termCIE10: 'diagnosticoFinalDosCIEX',
                },
                {
                    id: 3,
                    code: 'diagnosticoFinalTresCode',
                    name: 'diagnosticoFinalTres',
                    codeCIE10: 'diagnosticoFinalTresCodeCIEX',
                    termCIE10: 'diagnosticoFinalTresCIEX',
                }
            ],
        },
        // ***********************************EVADIE***********************************
        // Clasificación
        comorbilidad_evadie: {
            label: 'la comorbilidad',
            hiddenSections: false,
            fieldSets: MEDDRA_FIELD_SETS,
        },
        diagnostico_inicial_evadie: {
            label: 'el diagnóstico inicial',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'diagnosticoUnoCode',
                    name: 'diagnosticoUno',
                    codeCIE10: 'diagnosticoUnoCodeCIEX',
                    termCIE10: 'diagnosticoUnoCIEX',
                },
                {
                    id: 2,
                    code: 'diagnosticoDosCode',
                    name: 'diagnosticoDos',
                    codeCIE10: 'diagnosticoDosCodeCIEX',
                    termCIE10: 'diagnosticoDosCIEX',
                },
                {
                    id: 3,
                    code: 'diagnosticoTresCode',
                    name: 'diagnosticoTres',
                    codeCIE10: 'diagnosticoTresCodeCIEX',
                    termCIE10: 'diagnosticoTresCIEX',
                }
            ],
        },
        otro_evento_salud: {
            label: 'Otro evento importante de salud',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'otroEventoImportanteCode',
                    name: 'otroEventoImportante',
                    codeCIE10: 'otroEventoImportanteCodeCIEX',
                    termCIE10: 'otroEventoImportanteCIEX',
                }
            ],
        },
        otro_evadie: {
            label: 'Otro evento EVADIE',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'otroEventoEVADIECode',
                    name: 'otroEventoEVADIE',
                    codeCIE10: 'otroEventoEVADIECodeCIEX',
                    termCIE10: 'otroEventoEVADIECIEX',
                }
            ]
        },
        diagnostico_final_evadie: {
            label: 'el diagnóstico final',
            hiddenSections: false,
            fieldSets: [
                {
                    id: 1,
                    code: 'diagnosticoFinalUnoCode',
                    name: 'diagnosticoFinalUno',
                    codeCIE10: 'diagnosticoFinalUnoCodeCIEX',
                    termCIE10: 'diagnosticoFinalUnoCIEX',
                },
                {
                    id: 2,
                    code: 'diagnosticoFinalDosCode',
                    name: 'diagnosticoFinalDos',
                    codeCIE10: 'diagnosticoFinalDosCodeCIEX',
                    termCIE10: 'diagnosticoFinalDosCIEX',
                },
                {
                    id: 3,
                    code: 'diagnosticoFinalTresCode',
                    name: 'diagnosticoFinalTres',
                    codeCIE10: 'diagnosticoFinalTresCodeCIEX',
                    termCIE10: 'diagnosticoFinalTresCIEX',
                }
            ],
        },
    },
}

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== ''

export const getFirstAvailableFieldSet = (values = {}, fieldSets = MEDDRA_FIELD_SETS) => {
    return fieldSets.find((fieldSet) => (
        !hasValue(values[fieldSet.code]) && !hasValue(values[fieldSet.name])
    )) || null
}

export const getAssignedFieldSets = (values = {}, fieldSets = MEDDRA_FIELD_SETS) => {
    return fieldSets.filter((fieldSet) => (
        hasValue(values[fieldSet.code]) || hasValue(values[fieldSet.name])
    ))
}

export const getLastAssignedFieldSet = (values = {}, fieldSets = MEDDRA_FIELD_SETS) => {
    const assignedFieldSets = getAssignedFieldSets(values, fieldSets)
    return assignedFieldSets[assignedFieldSets.length - 1] || null
}

export const getAssignedCode = (values = {}, fieldSet) => (
    values[fieldSet.code] || ''
)

export const getAssignedName = (values = {}, fieldSet) => (
    values[fieldSet.name] || ''
)


