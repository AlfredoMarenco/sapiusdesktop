const path = require('path');
const fs = require('fs');

const appData = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
const logPath = path.join(appData, 'sapiusmacdetecter', 'sapius-detector.log');

console.log('Buscando logs en:', logPath);

if (fs.existsSync(logPath)) {
    const logs = fs.readFileSync(logPath, 'utf8');
    const lines = logs.split('\n');
    console.log('--- ÚLTIMAS 150 LÍNEAS DE LOG ---');
    console.log(lines.slice(-150).join('\n'));
} else {
    console.log('No se encontró el archivo de log.');
}
