
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

    async function createUser(email, password) {
        const dbInstance = db.getDatabase();
        const hash = await encriptacion.hashGen(password);
        const user_code = await encriptacion.hashGen(email);
        return new Promise((resolve, reject) => {
            dbInstance.run(
                "INSERT INTO users (email, user_code, password) VALUES (?, ?, ?)",
                [email,user_code, hash],
                function (err) {
                    if (err) return reject(err);
                    resolve({ id: this.lastID, email });
                }
            );
        });
    }

    async function verifyUser(email,password) {
        const user = await findUserByEmail(email);
        if(!user) return null;
        const match = await encriptacion.comparePassword(password,user.password);
        const { password: _, ...userWithoutPassword } = user;   // Eliminamos la contraseña de los datos del usuario
        return match ? userWithoutPassword : null; // Encaso de encontrlo devolvemos un usuario
    }


    return {
        createUser,
        findUserByEmail,
        verifyUser
    };

};