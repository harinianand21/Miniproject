import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { pathToFileURL } from 'url';
import path from 'path';

// Helper to load Tailwind plugin dynamically
async function getTailwindPlugin() {
    try {
        // Try root first
        const plugin = await import('@tailwindcss/vite');
        console.log('✅ Tailwind plugin loaded from root');
        return plugin.default;
    } catch (e) {
        try {
            // Try frontend fallback with absolute file URL
            const frontendPath = path.join(process.cwd(), 'frontend', 'node_modules', '@tailwindcss', 'vite', 'dist', 'index.mjs');
            const plugin = await import(pathToFileURL(frontendPath).href);
            console.log('✅ Tailwind plugin loaded from frontend folder');
            return plugin.default;
        } catch (e2) {
            try {
                // Try direct node_modules
                const directPath = path.join(process.cwd(), 'node_modules', '@tailwindcss', 'vite', 'dist', 'index.mjs');
                const plugin = await import(pathToFileURL(directPath).href);
                console.log('✅ Tailwind plugin loaded from local node_modules');
                return plugin.default;
            } catch (e3) {
                console.error('❌ CRITICAL: Tailwind plugin not found! Styles will be broken.');
                return null;
            }
        }
    }
}

const tailwindPlugin = await getTailwindPlugin();

export default defineConfig({
    plugins: [react(), tailwindPlugin && tailwindPlugin()].filter(Boolean),
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
