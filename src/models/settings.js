module.exports = function (db) {
    const dbInstance = db.getDatabase();

    return {
        /**
         * Get a global setting value
         */
        getSetting: (key) => {
            return new Promise((resolve, reject) => {
                dbInstance.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
                    if (err) return reject(err);
                    resolve(row ? row.value : null);
                });
            });
        },

        /**
         * Update a global setting
         */
        updateSetting: (key, value) => {
            return new Promise((resolve, reject) => {
                dbInstance.run(
                    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
                    [key, value],
                    function (err) {
                        if (err) return reject(err);
                        resolve(true);
                    }
                );
            });
        }
    };
};
