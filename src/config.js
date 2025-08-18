const path = require('path');
const fs = require('fs');

const configPath = path.join(__dirname, '..', 'config.json');

// Leer y parsear el archivo JSON
let config = {};
    try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
        console.error('Error al leer el archivo de configuración:', err);
        process.exit(1);
    }

module.exports = config;