import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        open: true,
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            external: ['xlsx', 'xlsx/dist/xlsx.mjs']
        }
    },
    resolve: {
        alias: [
            // @mui/icons-material v5 es CJS sin campo "exports"; ra-ui-materialui
            // (type: module) lo importa con interop estilo Node y los iconos llegan
            // como {default: Componente} => "Element type is invalid ... got: object".
            // Se fuerza la build ESM de los iconos para evitar la interop CJS.
            { find: /^@mui\/icons-material$/, replacement: '@mui/icons-material/esm/index.js' },
            { find: /^@mui\/icons-material\/(?!esm\/)(.+)$/, replacement: '@mui/icons-material/esm/$1.js' },
            { find: '@', replacement: '/src' },
        ],
    },
});
