const config = require('./config');
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2'); // Usaremos mysql2 para una mejor experiencia

let db;

/**
 * Sistema de conexión a la base de datos.
 * Soporta SQLite y MySQL según la configuración.
 */
function connectToDatabase() {
  if (config.db.type === 'sqlite') {    // En caso de ser SQLite
    console.log('Conectando a la base de datos SQLite...');
    db = new sqlite3.Database(config.db.sqlitePath, (err) => {
      if (err) {
        console.error('Error al conectar a SQLite:', err.message);
      } else {
        console.log('Conexión a SQLite exitosa.');
      }
    });
  } else if (config.db.type === 'mysql') {  // En caso de ser MySQL
    console.log('Conectando a la base de datos MySQL...');
    db = mysql.createConnection(config.db.mysql);
    db.connect(err => {
      if (err) {
        console.error('Error al conectar a MySQL:', err.stack);
        return;
      }
      console.log('Conexión a MySQL exitosa como id ' + db.threadId);
    });
  } else {
    console.error('Tipo de base de datos no válido en el archivo de configuración.');
    process.exit(1);
  }
}

function getDatabase() {
  if (!db) {
    connectToDatabase();
  }
  return db;
}

module.exports = {
  getDatabase
};