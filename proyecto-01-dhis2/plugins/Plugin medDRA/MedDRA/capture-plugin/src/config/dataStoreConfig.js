import { apiConfig } from './apiConfig.js'
import defaultSearchBody from './searchBody.json'

const MEDDRA_KEY = 'API-CONFIG'
const SEARCH_CONFIGURATION_KEY = 'SEARCH-CONFIG'

let cachedMedDRAConfig = null
let cachedSearchBody = null

function trimTrailingSlash(value) {
    return value.replace(/\/$/, '')
}

function normalizeDhis2BaseUrl(baseUrl) {
    if (!baseUrl) {
        return null
    }

    return trimTrailingSlash(new URL(baseUrl, window.location.href).toString())
}

function inferDhis2BaseUrl() {
    const { origin, pathname, href } = window.location
    const apiAppsIndex = href.indexOf('/api/apps/')

    if (apiAppsIndex !== -1) {
        return trimTrailingSlash(href.slice(0, apiAppsIndex))
    }

    const apiIndex = href.indexOf('/api/')

    if (apiIndex !== -1) {
        return trimTrailingSlash(href.slice(0, apiIndex))
    }

    const dhisWebIndex = pathname.indexOf('/dhis-web-')

    if (dhisWebIndex !== -1) {
        return trimTrailingSlash(`${origin}${pathname.slice(0, dhisWebIndex)}`)
    }

    return origin
}

function getDhis2BaseUrl(baseUrl) {
    return normalizeDhis2BaseUrl(baseUrl)
        || normalizeDhis2BaseUrl(apiConfig.dhis2BaseUrl)
        || inferDhis2BaseUrl()
}

function getDataStoreUrl(key, baseUrl) {
    const namespace = encodeURIComponent(apiConfig.dataStoreNamespace)
    const dataStoreKey = encodeURIComponent(key)

    return `${getDhis2BaseUrl(baseUrl)}/api/dataStore/${namespace}/${dataStoreKey}`
}

async function getDataStoreValue(key, baseUrl) {
    const url = getDataStoreUrl(key, baseUrl)
    const response = await fetch(url, { credentials: 'include' })

    if (response.status === 404) {
        return null
    }

    if (!response.ok) {
        throw new Error(`No se pudo leer la configuracion ${key} del datastore: HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
        throw new Error(
            `La configuracion ${key} del datastore no devolvio JSON. URL consultada: ${response.url || url}`
        )
    }

    return response.json()
}

export async function getMedDRAConfig(baseUrl) {
    if (cachedMedDRAConfig) {
        return cachedMedDRAConfig
    }

    const config = await getDataStoreValue(MEDDRA_KEY, baseUrl)

    if (!config || !config.code || !config.key) {
        throw new Error(
            'Configuracion de MedDRA no encontrada en el datastore. Crear la llave MedDRA con las variables code y key.'
        )
    }

    cachedMedDRAConfig = {
        username: config.code,
        password: config.key,
    }

    return cachedMedDRAConfig
}

export async function getSearchBodyConfig(baseUrl) {
    if (cachedSearchBody) {
        return cachedSearchBody
    }

    const config = await getDataStoreValue(SEARCH_CONFIGURATION_KEY, baseUrl)
    cachedSearchBody = config || defaultSearchBody

    return cachedSearchBody
}
