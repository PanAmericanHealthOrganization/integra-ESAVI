import { apiConfig } from '../config/apiConfig.js'
import { getMedDRAConfig } from '../config/dataStoreConfig.js'

let cachedToken = null
let tokenExpiry = 0

export async function getAuthToken({ dhis2BaseUrl } = {}) {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken
    }
    
    const { username, password } = await getMedDRAConfig(dhis2BaseUrl)
    const { tokenUrl } = apiConfig

    const response = await fetch(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({ 
            grant_type: 'password',
            username,
            password,
            scope: 'meddraapi',
            client_id: 'mspclient',
        }),
    })

    if (!response.ok) {
        throw new Error(`MedDRA auth failed: HTTP ${response.status}`)
    }

    const data = await response.json()
    cachedToken = data.access_token
    tokenExpiry = Date.now() + ((data.expires_in || 3600) - 60) * 1000

    return cachedToken
}

export function clearAuthToken() {
    cachedToken = null
    tokenExpiry = 0
}
