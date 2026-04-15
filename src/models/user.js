
const encriptacion = require('../utils/crypt.js');


module.exports = function(db) {

    async function findUserByEmail(email){
        const dbInstance = db.getDatabase();
        return new Promise((resolve, reject) => {
            dbInstance.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
              if (err) return reject(err);
              resolve(row);
            });
          }); 
    }

    async function createUser(username, email, password) {
        const dbInstance = db.getDatabase();
        const hash = await encriptacion.hashGen(password);
        const user_code = await encriptacion.hashGen(email);
        return new Promise((resolve, reject) => {
            dbInstance.run(
                "INSERT INTO users (user, email, user_code, password) VALUES (?, ?, ?, ?)",
                [username, email, user_code, hash],
                function (err) {
                    if (err) return reject(err);
                    resolve({ id: this.lastID, user: username, email });
                }
            );
        });
    }

    async function verifyUser(email,password) {
        const user = await findUserByEmail(email);
        if(!user) return null;
        if(user.is_banned) throw new Error('BANNED'); // Control extra
        const match = await encriptacion.comparePassword(password,user.password);
        const { password: _, ...userWithoutPassword } = user;   // Eliminamos la contraseña de los datos del usuario
        return match ? userWithoutPassword : null; // Encaso de encontrlo devolvemos un usuario
    }

    async function banUser(userId, status) {
        const dbInstance = db.getDatabase();
        return new Promise((resolve, reject) => {
            dbInstance.run(
                "UPDATE users SET is_banned = ? WHERE id = ?",
                [status ? 1 : 0, userId],
                function (err) {
                    if (err) return reject(err);
                    resolve(this.changes > 0);
                }
            );
        });
    }

    return {
        createUser,
        findUserByEmail,
        verifyUser,
        banUser
    };

};