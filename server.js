import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting backend server from project root...');

// Absolute path to the backend server logic
const backendPath = path.join(__dirname, 'backend', 'server.js');

// Spawn the backend process
const server = spawn('node', [backendPath], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    shell: true // Helpful for Windows environment resolution
});

server.on('error', (err) => {
    console.error('❌ Failed to start server:', err);
});

server.on('exit', (code) => {
    if (code !== 0 && code !== null) {
        console.error(`⚠️ Server process exited with code ${code}`);
    }
});
