const WebSocket = require('ws');
const chunkManager = require('./models/chunkManager.js');

module.exports = function(server, db) {
    const wss = new WebSocket.Server({ server });

    // In-memory cache for ultra-fast broadcasting and batch saving
    const pixelCache = new Map();
    const BATCH_INTERVAL = 3000; // Save to DB every 3 seconds to avoid blocking Event Loop

    // Periodically flush cache to SQLite
    setInterval(async () => {
        if (pixelCache.size === 0) return;
        
        const pixelsToSave = Array.from(pixelCache.values());
        pixelCache.clear();

        // Agrupar píxeles correspondientes a cada región/chunk
        const chunksData = new Map();
        pixelsToSave.forEach(p => {
            const indices = chunkManager.getChunkIndices(p.x, p.y);
            const chunkId = `${indices.cx}_${indices.cy}`;
            if(!chunksData.has(chunkId)){
                chunksData.set(chunkId, { cx: indices.cx, cy: indices.cy, pixels: [] });
            }
            chunksData.get(chunkId).pixels.push(p);
        });

        // Guardar concurrentemente en los diferentes ficheros SQLite
        for (const [chunkId, data] of chunksData.entries()) {
            try {
                await chunkManager.saveChunkPixels(data.cx, data.cy, data.pixels);
            } catch (err) {
                console.error(`Error bulk saving pixels for chunk ${chunkId}:`, err);
            }
        }
    }, BATCH_INTERVAL);

    wss.on('connection', async (ws, req) => {
        console.log('Client connected to WebSocket.');
        
        // Scan /chunks/ and load all pixel disjoint databases
        try {
            const pixels = await chunkManager.loadAllPixels();
            // We send as a compact array to reduce payload
            const payload = pixels.map(p => [p.x, p.y, p.color]);
            ws.send(JSON.stringify({ type: 'INIT', data: payload }));
        } catch (e) {
            console.error("Error al cargar píxeles de los chunks:", e);
        }

        ws.on('message', (message) => {
            try {
                // Expected payload: [x, y, "color", userId]
                const data = JSON.parse(message);
                if (!Array.isArray(data) || data.length < 3) return;

                const [x, y, color, uid] = data;

                if (typeof x !== 'number' || typeof y !== 'number' || typeof color !== 'string') return;
                
                pixelCache.set(`${x},${y}`, { x, y, color, uid: uid || 0 });

                // Broadcast to all clients IMMEDIATELY
                const broadcastPayload = JSON.stringify({ type: 'UPDATE', data: [x, y, color] });
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(broadcastPayload);
                    }
                });

            } catch (err) {
                // Ignore malformed payloads
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });

    return wss;
};
