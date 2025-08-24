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

/**
 * 
 * 
 */
function initTables() {
  const dbInstance = getDatabase();

  if (config.db.type === 'sqlite') {
    dbInstance.serialize(() => {
      /**
       * Creamos la tabla de usuarios Usuario:
       *  - id: Identificador único del usuario.
       *  - username: Nombre de usuario único.
       *  - password_hash: Contraseña del usuario en formato hash.
       *  - created_at: Fecha de creación del usuario.
       */
      dbInstance.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_code TEXT UNIQUE,
            user TEXT,
            email TEXT UNIQUE,
            rol TEXT DEFAULT 'user',
            password TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Tablas de SQLite creadas o ya existentes.');
    });
  } 
}

module.exports = {
  getDatabase,
  initTables
};