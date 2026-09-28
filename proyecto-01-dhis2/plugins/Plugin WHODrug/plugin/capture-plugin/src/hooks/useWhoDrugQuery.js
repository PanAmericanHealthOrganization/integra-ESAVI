import { useDataEngine } from '@dhis2/app-runtime'
import { useCallback, useEffect, useRef, useState } from 'react'

const ENDPOINT_BY_LEVEL = {
    abbreviations: 'abbreviations',
    drugNames: 'drug-name',
    maHolders: 'ma-holder',
    forms: 'forms',
    strengths: 'strength',
}

const buildParams = (params) => {
    const out = { country: params.country }
    if (params.abbreviation) out.abbreviation = params.abbreviation
    if (params.drugName) out.drugName = params.drugName
    if (params.maHolders) out.maHolders = params.maHolders
    if (params.forms) out.forms = params.forms
    return out
}

const buildResource = (config, level) => {    
    const path = ENDPOINT_BY_LEVEL[level]
    if (config.routeId) {
        return `routes/${config.routeId}/run/${path}`
    }
    if (config.routeCode) {
        return `routes/${config.routeCode}/run/${path}`
    }
    throw new Error(
        'WHODrug: no se configuro routeCode ni routeId en /dataStore/WHODrug/API-CONFIG. ' +
            'Crea una DHIS2 Route que apunte al backend WHODrug y registra su code/id en el dataStore.',
    )
}

const buildDirectUrl = (config, level, params) => {
    if (!config.backendUrl) {
        throw new Error(
            'WHODrug (modo dev directo): falta backendUrl. Define DHIS2_WHODRUG_DEFAULT_BACKEND_URL en .env o en el dataStore.',
        )
    }
    const base = config.backendUrl.replace(/\/+$/, '')    
    const path = ENDPOINT_BY_LEVEL[level]
    const qs = new URLSearchParams(params).toString()
    return `${base}/${path}${qs ? `?${qs}` : ''}`
}

const initialState = {
    data: undefined,
    loading: false,
    error: null,
}

export const useWhoDrugQuery = (config, level, params) => {
    const engine = useDataEngine()
    const [state, setState] = useState(initialState)
    const requestSeq = useRef(0)

    const fetchNow = useCallback(async () => {
        if (!params) {
            setState(initialState)
            return
        }
        const seq = ++requestSeq.current
        setState({ data: undefined, loading: true, error: null })
        try {
            const built = buildParams(params)
            let response
            if (config.devDirectBackend) {
                const url = buildDirectUrl(config, level, built)
                const res = await fetch(url, {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                })
                if (!res.ok) {
                    throw new Error(
                        `WHODrug (dev directo) ${res.status} ${res.statusText} en ${url}`,
                    )
                }
                response = await res.json()
            } else {
                const resource = buildResource(config, level)
                const result = await engine.query(
                    {
                        response: {
                            resource,
                            params: built,
                        },
                    },
                    { signal: undefined },
                )
                response = result.response
            }

            if (seq !== requestSeq.current) return
            setState({
                data: response,
                loading: false,
                error: null,
            })
        } catch (err) {
            if (seq !== requestSeq.current) return
            setState({
                data: undefined,
                loading: false,
                error:
                    err instanceof Error
                        ? err
                        : new Error('Error al consultar WHODrug'),
            })
        }
    }, [engine, config, level, params])

    useEffect(() => {
        fetchNow()
        return () => {
            requestSeq.current += 1
        }
    }, [fetchNow])

    const reset = useCallback(() => {
        requestSeq.current += 1
        setState(initialState)
    }, [])

    return { ...state, refetch: fetchNow, reset }
}
