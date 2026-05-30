/**
 * Build script for Vite
 * This script handles the build process for the React application using Vite
 */

const { build } = require('vite');
const path = require('path');

async function buildApp() {
    try {
        console.log('🚀 Starting build process...');

        // Build the application
        await build({
            configFile: path.resolve(__dirname, 'vite.config.js'),
            mode: 'production',
        });

        console.log('✅ Build completed successfully!');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

buildApp();
