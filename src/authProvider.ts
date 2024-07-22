import axios, { AxiosDefaults, AxiosHeaders, AxiosRequestConfig, RawAxiosRequestHeaders } from "axios";
import { he } from "date-fns/locale";


const MyAuthProvider = {
    login: ({ username, password }: { username: string, password: string }) => {
        localStorage.setItem('username', username);
        // accept all username/password combinations

        if(username === 'krivadeneira') {
            return Promise.resolve();
        } else {
            return Promise.reject(new Error('Error usuario o contraseña'));
        }

    },
    logout: () => {
        localStorage.removeItem('username');
        return Promise.resolve();
    },
    checkAuth: () =>
        localStorage.getItem('username') ? Promise.resolve() : Promise.reject(),
    checkError: (error: any) => {
        const status = error.status;
        if (status === 401 || status === 403) {
            localStorage.removeItem('username');
            return Promise.reject();
        }
        // other error code (404, 500, etc): no need to log out
        return Promise.resolve();
    },
    getIdentity: () =>
        Promise.resolve({
            id: 'user',
            fullName: 'Karina Rivadeneira',
        }),
    getPermissions: () => Promise.resolve(''),
};



const generarSessionCookie = () => {
    // Generar session cookie   



}
export default MyAuthProvider;