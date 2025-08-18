const express = require('express');
const path = require('path');
const config = require('./config');
const { getDatabase } = require('./db');
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, '../public')));

// Ruta principal para renderizar la vista de inicio
app.get('/', (req, res) => {
    res.render('index', { registrationMode: config.registrationMode });
});

// Iniciar la conexión a la base de datos y luego el servidor
getDatabase();

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`Modo de registro: ${config.registrationMode}`);
});