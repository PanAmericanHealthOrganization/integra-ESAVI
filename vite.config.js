import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 8080,
        open: true,
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            external: ['xlsx', 'xlsx/dist/xlsx.mjs']
        }
    },
    resolve: {
        alias: {
            '@': '/src',
        },
    },
});
