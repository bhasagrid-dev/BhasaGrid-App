/**
 * Smart Port Checker for Download Portal
 * Ensures only ONE instance runs on port 5679
 * Integrates with manager.py workflow
 */

const net = require('net');
const { spawn } = require('child_process');
const path = require('path');

const DEFAULT_PORT = 5679;
const HOST = 'localhost';

function parseArgs() {
    const args = process.argv.slice(2);
    const result = { port: DEFAULT_PORT };
    args.forEach((arg, index) => {
        if (arg.startsWith('--port=')) {
            result.port = parseInt(arg.split('=')[1], 10) || DEFAULT_PORT;
        } else if (arg === '--port') {
            const next = args[index + 1];
            result.port = parseInt(next, 10) || DEFAULT_PORT;
        }
    });
    return result;
}

function checkPort(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(true); // Port in use
            } else {
                resolve(false);
            }
        });
        server.once('listening', () => {
            server.close();
            resolve(false); // Port available
        });
        server.listen(port, HOST);
    });
}

async function main() {
    const { port } = parseArgs();
    const portInUse = await checkPort(port);
    
    if (portInUse) {
        console.error(`\n❌ Port ${port} is already in use.\n`);
        process.exit(1);
    }
    
    console.log(`✅ Port ${port} is available. Starting server...\n`);
    
    const browserSyncCmd = `npx browser-sync start --config bs-config.js --port ${port}`;
    const browserSync = spawn(browserSyncCmd, {
        stdio: 'inherit',
        cwd: __dirname,
        shell: true
    });

    browserSync.on('error', (err) => {
        console.error(`\n❌ Failed to start server: ${err.message}`);
        process.exit(1);
    });
    
    browserSync.on('exit', (code) => {
        console.log(`\n🛑 Server stopped (exit code: ${code})`);
    });
}

main();
