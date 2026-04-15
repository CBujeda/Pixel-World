const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const CHUNKS_DIR = path.join(__dirname, '..', '..', 'data', 'chunks');
const activeChunks = new Map();

/**
 * Ensures the chunk database file and table exists,
 * returning a promise with the DB instance.
 */
function getChunkDB(cx, cy) {
    const chunkId = `${cx}_${cy}`;
    if (activeChunks.has(chunkId)) {
        return Promise.resolve(activeChunks.get(chunkId));
    }

    return new Promise((resolve, reject) => {
        const dbPath = path.join(CHUNKS_DIR, `chunk_${chunkId}.sqlite`);
        
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) return reject(err);
            
            db.serialize(() => {
                db.run('PRAGMA journal_mode = WAL;');
                db.run('PRAGMA synchronous = NORMAL;');
                db.run(`
                    CREATE TABLE IF NOT EXISTS pixels (
                        x INTEGER,
                        y INTEGER,
                        color TEXT,
                        updated_by INTEGER,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (x, y)
                    )
                `, (err) => {
                    if (err) return reject(err);
                    activeChunks.set(chunkId, db);
                    resolve(db);
                });
            });
        });
    });
}

/**
 * Bulk saves an array of pixels to a specific chunk database
 */
async function saveChunkPixels(cx, cy, pixels) {
    if (!pixels || pixels.length === 0) return;
    const db = await getChunkDB(cx, cy);

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION;');
            const stmt = db.prepare("INSERT INTO pixels (x, y, color, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(x,y) DO UPDATE SET color=excluded.color, updated_by=excluded.updated_by, updated_at=CURRENT_TIMESTAMP");
            
            pixels.forEach(p => {
                stmt.run(p.x, p.y, p.color, p.uid);
            });
            stmt.finalize();
            db.run('COMMIT;', (err) => {
                if(err) return reject(err);
                resolve();
            });
        });
    });
}

/**
 * Loads all existing pixels by scanning the chunks folder.
 * Returns an array of pixel objects.
 */
function loadAllPixels() {
    return new Promise(async (resolve, reject) => {
        if (!fs.existsSync(CHUNKS_DIR)) {
            // Safety check
            try { fs.mkdirSync(CHUNKS_DIR, { recursive: true }); } catch(e){}
        }
        
        const files = fs.readdirSync(CHUNKS_DIR).filter(f => f.endsWith('.sqlite'));
        const allPixels = [];

        if (files.length === 0) return resolve(allPixels);

        let filesProcessed = 0;
        
        for (const file of files) {
            // parse chunk_X_Y.sqlite
            const match = file.match(/chunk_(-?\d+)_(-?\d+)\.sqlite/);
            if (!match) {
                filesProcessed++;
                if(filesProcessed === files.length) resolve(allPixels);
                continue;
            }
            
            const cx = parseInt(match[1]);
            const cy = parseInt(match[2]);
            const db = await getChunkDB(cx, cy);

            db.all("SELECT x, y, color FROM pixels", (err, rows) => {
                if (!err && rows) {
                    allPixels.push(...rows);
                }
                filesProcessed++;
                if (filesProcessed === files.length) {
                    resolve(allPixels);
                }
            });
        }
    });
}

/**
 * Calculates which chunk a pixel belongs to
 */
function getChunkIndices(x, y) {
    const CHUNK_SIZE = 4096;
    return {
        cx: Math.floor(x / CHUNK_SIZE),
        cy: Math.floor(y / CHUNK_SIZE)
    };
}

module.exports = {
    getChunkDB,
    saveChunkPixels,
    loadAllPixels,
    getChunkIndices
};
