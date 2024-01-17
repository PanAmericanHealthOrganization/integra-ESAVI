

export const FETCH_REQUEST_DEFAULT_OPTIONS: RequestInit = {
    headers: new Headers({
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "X-API-KEY": `${process.env.REACT_API_CIENTE_KEY || ''}`
    }),
    redirect: 'follow'
};

export const INT_ESAV_API = process.env.REACT_APP_INTEGRA_ESAVI_API_URL || 'http://localhost:3001';
