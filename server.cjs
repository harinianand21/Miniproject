const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Starting backend server from project root...');

// Absolute path to the backend server logic
const backendPath = path.join(__dirname, 'backend', 'server.js');

// Spawn the backend process
const server = spawn('node', [backendPath], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    shell: true
});

server.on('error', (err) => {
    console.error('❌ Failed to start server:', err);
});

server.on('exit', (code) => {
    if (code !== 0 && code !== null) {
        console.error(`⚠️ Server process exited with code ${code}`);
    }
});
