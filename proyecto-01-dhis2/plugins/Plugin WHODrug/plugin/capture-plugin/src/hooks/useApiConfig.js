import { useDataQuery } from '@dhis2/app-runtime'
import { useMemo } from 'react'

const DATASTORE_NAMESPACE = 'WHODrug'
const DATASTORE_KEY = 'API-CONFIG'

const readEnv = (suffix) =>
    process.env[`DHIS2_${suffix}`] ??
    process.env[`REACT_APP_DHIS2_${suffix}`]

const isTruthyEnvFlag = (raw) =>
    typeof raw === 'string' && /^(1|true|yes|on)$/i.test(raw.trim())

const DEV_DIRECT_BACKEND = isTruthyEnvFlag(
    readEnv('WHODRUG_DEV_DIRECT_BACKEND'),
)

const ENV_FALLBACK = {
    country: readEnv('WHODRUG_DEFAULT_COUNTRY') || 'PRY',
    routeCode: readEnv('WHODRUG_DEFAULT_ROUTE_CODE') || 'whodrug-api',
    backendUrl:
        readEnv('WHODRUG_DEFAULT_BACKEND_URL') ||
        'https://dev-dhis.implementacionypruebas.cloud/api-whodrug/vaccines-whodrug',
    devDirectBackend: DEV_DIRECT_BACKEND,
}

const dataStoreQuery = {
    apiConfig: {
        resource: `dataStore/${DATASTORE_NAMESPACE}/${DATASTORE_KEY}`,
    },
}

export const useApiConfig = () => {
    const { loading, error, data } = useDataQuery(dataStoreQuery, {
        onError: () => {
            // A missing dataStore entry is expected during first installation.
        },
    })

    return useMemo(() => {
        if (loading) {
            return {
                config: ENV_FALLBACK,
                loading: true,
                error: null,
                isFallback: true,
            }
        }

        const stored = data?.apiConfig

        if (!stored || !stored.country) {
            return {
                config: ENV_FALLBACK,
                loading: false,
                error: error ?? null,
                isFallback: true,
            }
        }

        return {
            config: {
                country: stored.country,
                routeCode: stored.routeCode ?? ENV_FALLBACK.routeCode,
                routeId: stored.routeId,
                backendUrl: stored.backendUrl ?? ENV_FALLBACK.backendUrl,
                devDirectBackend: DEV_DIRECT_BACKEND,
            },
            loading: false,
            error: null,
            isFallback: false,
        }
    }, [data, loading, error])
}
