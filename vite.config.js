import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    root: './',
    publicDir: 'frontend/public',
    build: {
        outDir: 'dist'
    },
    resolve: {
        alias: {
            '@': '/frontend/src'
        }
    }
})
