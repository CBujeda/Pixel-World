
const encriptacion = require('../utils/crypt.js');


module.exports = function(db) {

    async function createUser(email, password) {
        const dbInstance = db.getDatabase();
        const hash = await encriptacion.hashPassword(password);
        return new Promise((resolve, reject) => {
            dbInstance.run(
                "INSERT INTO users (email, password) VALUES (?, ?)",
                [email, hash],
                function (err) {
                    if (err) return reject(err);
                    resolve({ id: this.lastID, email });
                }
            );
        });
    }

    return {
        createUser
    };

};