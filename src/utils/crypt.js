
const crypto = require('crypto');
const bcrypt = require('bcrypt')

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 12;

/**
 * Clave maestra del servidor, En futuro lo almacenaremos en un .ENV
 *  32 bytes (256 bits) de clave maestra, la cual se usará para derivar claves únicas por usuario
 */
let MASTER_KEY;
if(process.env.MASTER_KEY){
    MASTER_KEY = Buffer.from(process.env.MASTER_KEY, "hex"); 
} else {
    throw new Error("Falta variable de entorno MASTER_KEY");
}

if(MASTER_KEY.length !== 32){
    throw new Error("La clave maestra debe tener 32 bytes (256 bits) de longitud, " + "tiene" + MASTER_KEY.length);
}else{
    console.log("MASTER_KEY configurada correctamente")
}


/**
 * Funcion la cual deriv a una clave unica por usuario.
 * Usamos HKDF como algoritmo de derivación de claves
 * @param {*} userId 
 * @returns 
 */
function deriveUserKey(userId){
    return crypto.hkdfSync(
        'sha256',                       // Algoritmo base
        MASTER_KEY,                     // Clave maestra
        Buffer.from(String(userId)),    // salt -> (El añadido, lo que hace que cambie por usuario), creamos clave unica por usuario
        Buffer.from('session-v1'),      // info
        32                              // Tamaño final en bytes (256 bits)
    );
}

/**
 * Función la cual cifra datos privados del usuario
 * @param {*} userId 
 * @param {*} data 
 * @returns 
 */
function encryptForUser (userId, data){
    const key = deriveUserKey(userId);          // Clave unica de este usuario
    const iv = crypto.randomBytes(12);          // Vector de iniciación (aleatorio)
    const cipher = crypto.createCipheriv('aes-256-gcm',key,iv);

    const plaintext = Buffer.from(JSON.stringify(data),'utf8');                     // Convertimos el objeto JSON a texto y luego al buffer
    const ciphertext = Buffer.concat([cipher.update(plaintext),cipher.final()])     // Ejecutamos el cifrado

    // Devolvemos los elementos necesarios para descifrar
    return {
        iv: iv.toString('base64'),                      // El IV (Vector de inicialización)
        ct: ciphertext.toString('base64'),              // El texto cifrado
        tag: cipher.getAuthTag().toString('base64')     // Etiqueta de autenticidad
    };
}

/**
 * Función para decifrar los datos privados de un usuario
 * @param {*} userId 
 * @param {*} payload 
 * @returns 
 */
function decryptForUser (userId, payload){
    const key = deriveUserKey(userId);              // Derivamos la misma clave
    const iv = Buffer.from(payload.iv, 'base64');
    const ct = Buffer.from(payload.ct, 'base64');
    const tag = Buffer.from(payload.tag,'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm',key,iv)
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ct),decipher.final()]);    // Ejecutamos el descifrado
    return JSON.parse(plaintext.toString('utf8'))                               //Devolvemos el objeto JSON original
}

/**
 * Sistema el cual hashea la contraseña
 * @param {*} password 
 * @returns 
 */
async function hashPassword(password) {
    return await bcrypt.hash(password,SALT_ROUNDS)
}

/**
 * Sistema el cual compara la contraseña con una hasheada
 * @param {*} password 
 * @param {*} hash 
 * @returns 
 */
async function comparePassword(password,hash){
    return await bcrypt.compare(password,hash);
}


module.exports = {
    deriveUserKey,
    encryptForUser,
    decryptForUser,

    hashPassword,
    comparePassword
}