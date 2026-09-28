import React from 'react'
import PropTypes from 'prop-types'
import { CircularLoader, NoticeBox } from '@dhis2/ui'

import { WhoDrugCascade } from './components/WhoDrugCascade.js'
import { useApiConfig } from './hooks/useApiConfig.js'
import { getActiveMappingContext } from './utils/resolvePluginContext.js'
import mappings from './config/mappings.json'

import './plugin.css'

const Plugin = (props) => {
    const {
        values = {},
        setFieldValue,
        viewMode = false,
        onChange,
    } = props

    const { config, loading, error, isFallback } = useApiConfig()

    const activeMapping = getActiveMappingContext(values, mappings)
    const slots = activeMapping.slots ?? []
    console.log(slots);
    
    const updateFieldValue = (fieldId, value) => {
        if (typeof setFieldValue === 'function') {
            setFieldValue({
                fieldId,
                value,
                options: {
                    valid: true,
                    touched: true,
                },
            })

            return
        }

        if (typeof onChange === 'function') {
            onChange(value)
            return
        }

        console.warn(
            `WHODrug Plugin: setFieldValue no provisto por el host ` +
            `(intento de set en ${fieldId} = ${value}).`,
        )
    }

    /*
     * Modo consulta / solo lectura
     */
    if (viewMode) {
        return (
            <div className="whodrug-plugin whodrug-plugin--view">
                <div className="whodrug-plugin__view-title">
                    WHODrug Form Field Plugin
                </div>

                <p className="whodrug-plugin__view-info">
                    <strong>Vacunas registradas:</strong>{' '}
                    {countFilledSlots(slots, values)}
                </p>
            </div>
        )
    }

    /*
     * Cargando configuración
     */
    if (loading) {
        return (
            <div className="whodrug-plugin whodrug-plugin--loading">
                <CircularLoader small />

                <p className="whodrug-plugin__loading-text">
                    Cargando configuración del plugin...
                </p>
            </div>
        )
    }

    /*
     * Error de configuración
     */
    if (error && !isFallback) {
        return (
            <div className="whodrug-plugin__message">
                <NoticeBox
                    error
                    title="Error al cargar configuración"
                >
                    {error.message}
                </NoticeBox>
            </div>
        )
    }

    /*
     * No existen slots configurados
     */
    if (slots.length === 0) {
        return (
            <div className="whodrug-plugin__message">
                <NoticeBox
                    warning
                    title="Sin mapeos configurados"
                >
                    No hay slots definidos para el contexto activo del
                    plugin. Verifica{' '}
                    <code>
                        capture-plugin/src/config/mappings.json
                    </code>
                    .
                </NoticeBox>
            </div>
        )
    }

    /*
     * Plugin principal
     */
    return (
        <div className="whodrug-plugin">
            {/*
            {config.devDirectBackend ? (
                <div className="whodrug-plugin__notice">
                    <NoticeBox
                        warning
                        title="Modo desarrollo: backend directo"
                    >
                        El plugin está llamando directamente a{' '}
                        {config.backendUrl} sin pasar por la DHIS2 Route.
                        Desactiva DHIS2_WHODRUG_DEV_DIRECT_BACKEND en .env
                        antes de desplegar a producción.
                    </NoticeBox>
                </div>
            ) : null}
            */}

            {isFallback ? (
                <div className="whodrug-plugin__notice">
                    <NoticeBox
                        warning
                        title="Usando configuración por defecto"
                    >
                        No se encontró{' '}
                        <code>
                            /api/dataStore/WHODrug/API-CONFIG
                        </code>
                        . Se está usando la configuración de fallback
                        (país: <strong>{config.country}</strong>).
                        Crea el dataStore para personalizar por instancia.
                    </NoticeBox>
                </div>
            ) : null}

            <div className="whodrug-plugin__cascade">
                <WhoDrugCascade
                    config={config}
                    slots={slots}
                    values={values}
                    setFieldValue={updateFieldValue}
                />
            </div>
        </div>
    )
}

const hasValue = (raw) => {
    if (raw === null || raw === undefined) {
        return false
    }

    if (typeof raw === 'string') {
        return raw.trim() !== ''
    }

    return true
}

const countFilledSlots = (slots, values) =>
    slots.filter(
        (slot) =>
            hasValue(values[slot.abbreviationCode]) ||
            hasValue(values[slot.drugCode]),
    ).length

Plugin.propTypes = {
    values: PropTypes.object,
    errors: PropTypes.object,
    warnings: PropTypes.object,
    fieldsMetadata: PropTypes.object,
    setFieldValue: PropTypes.func,
    setContextFieldValue: PropTypes.func,
    viewMode: PropTypes.bool,
    formSubmitted: PropTypes.bool,
    onChange: PropTypes.func,
}

export default Plugin