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
      // Configuraciones de rendimiento para evitar bloquear el Event Loop (alta concurrencia)
      dbInstance.run('PRAGMA journal_mode = WAL;');
      dbInstance.run('PRAGMA synchronous = NORMAL;');

      /**
       * Creamos la tabla de usuarios Usuario:
       *  - is_banned: booleano para controles de admin.
       */
      dbInstance.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_code TEXT UNIQUE,
            user TEXT,
            email TEXT UNIQUE,
            rol TEXT DEFAULT 'user',
            password TEXT,
            is_banned BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      /**
       * Tabla para opciones globales del admin
       */
      dbInstance.run(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
          )
      `);
      dbInstance.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('registration_enabled', '1')`);

      console.log('Tablas de SQLite creadas (WAL activado). (Pixels ahora gestionados en chunks separados)');
    });
  } 
}

module.exports = {
  getDatabase,
  initTables
};