import { useEffect, useRef, useState } from 'react'
import { useConfig } from '@dhis2/app-runtime'
import { searchMedDRA } from '../api/meddra.js'

const DEBOUNCE_MS = 400
const MIN_QUERY_LENGTH = 3

export function useMedDRASearch() {
    const { baseUrl } = useConfig()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const timerRef = useRef(null)
    
    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current)

        if (query.trim().length < MIN_QUERY_LENGTH) {
            setResults([])
            setError(null)
            return undefined
        }

        timerRef.current = setTimeout(async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await searchMedDRA(query, { dhis2BaseUrl: baseUrl })
                setResults(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error en la busqueda')
                setResults([])
            } finally {
                setLoading(false)
            }
        }, DEBOUNCE_MS)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [baseUrl, query])

    const clear = () => {
        setQuery('')
        setResults([])
        setError(null)
    }

    return { query, setQuery, results, loading, error, clear }
}
