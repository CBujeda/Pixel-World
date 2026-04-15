
const encriptacion = require('../utils/crypt.js');

module.exports = function(app, user, settings) {
    console.log("Registrando sistema de auth")

    /**
     * Rutas de autenticación
     */
    // Panel auth login
    app.get("/login",(req,res)=>{
        res.render("auth/login",{ok:true, error: null});
    });

    app.get("/register", async (req,res)=>{
        const regEnabled = await settings.getSetting('registration_enabled');
        if (regEnabled === '0') {
            return res.render("auth/register", { error: "El registro de cuentas está deshabilitado temporalmente por el administrador." });
        }
        res.render("auth/register", { error: null });
    });

    app.post("/register_post", async (req,res)=>{
        const {username, email, password, confirm_password} = req.body;
        
        const regEnabled = await settings.getSetting('registration_enabled');
        if (regEnabled === '0') {
            return res.render("auth/register", { error: "El registro está deshabilitado." });
        }

        if(password !== confirm_password){
            return res.render("auth/register",{error:"Passwords do not match"});
        }
        const existingUser = await user.findUserByEmail(email)
        if(existingUser){
            return res.render("auth/register", { error: "A user with that email already exists." });
        }
        try {
            await user.createUser(username || email.split('@')[0], email, password);
            return res.redirect("/login");
        } catch (err) {
            return res.render("auth/register", { error: "Error interno, intenta de nuevo." });
        }
    });

    // Procesar login
    app.post('/login', async (req,res) =>{
        const {email,password} = req.body;
        try {
            const existingUser = await user.verifyUser(email,password);
            if(existingUser === null){
                return res.render("auth/login",{error: "The user you are trying to log in with does not exist or wrong password."});
            }

            const privData = {
                email:existingUser.email,
                user_token:existingUser.user_code,
                rol:existingUser.rol,
                loginAr:Date.now()
            }

            req.session.priv = encriptacion.encryptForUser(existingUser.id,privData);
            req.session.userId = existingUser.id; 
            req.session.user = existingUser; // Guardamos info básica en session
        
            return res.redirect("/map");
        } catch (err) {
            if (err.message === 'BANNED') {
                return res.render("auth/login",{error: "Tu cuenta ha sido bloqueada permanentemente por un administrador."});
            }
            return res.render("auth/login",{error: "Error del servidor."});
        }
    });

    // Ruta protegida
    app.get('/map',(req,res) =>{
        if(!req.session.userId){
            return res.redirect("/login");
        }
        
        let claims = null;
        if(req.session.priv){
            claims = encriptacion.decryptForUser(req.session.userId,req.session.priv);
        }

        return res.render("map");
        res.json({userId: req.session.userId,claims});
    });

    // Ruta protegida
    app.get('/me',(req,res) =>{
        if(!req.session.userId){
            return res.redirect("/login");
            //return res.status(401).json({error: "No autenticado"});
        }
        
        let claims = null;
        if(req.session.priv){
            claims = encriptacion.decryptForUser(req.session.userId,req.session.priv);
        }

        res.json({userId: req.session.userId,claims});
    });

    app.post('/logout',(req,res)=>{
        req.session.destroy(()=>{
            res.clearCookie("connect.sid");
            res.json({ok:true,msg:"Sesion Cerrada"})
        })
    })


}