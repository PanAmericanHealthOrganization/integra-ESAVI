import { getAuthToken } from './auth.js'
import { searchMedDRAMock } from './mockData.js'
import { apiConfig } from '../config/apiConfig.js'
import { getSearchBodyConfig } from '../config/dataStoreConfig.js'

const USE_MOCK = apiConfig.useMock

export async function searchMedDRA(term, { dhis2BaseUrl } = {}) {
    if (USE_MOCK) {
        return searchMedDRAMock(term)
    }

    const token = await getAuthToken({ dhis2BaseUrl })
    const searchBody = await getSearchBodyConfig(dhis2BaseUrl)

    const body = {
        ...searchBody,
        searchterms: [
            {
                ...searchBody.searchterms[0],
                searchterm: term,
            },
        ],
    }

    const response = await fetch(apiConfig.searchUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        throw new Error(`MedDRA search failed: HTTP ${response.status}`)
    }

    const data = await response.json()

    if (Array.isArray(data)) return data
    return data.results || data.data || []
}
