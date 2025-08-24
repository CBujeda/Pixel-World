
const encriptacion = require('../utils/crypt.js');

module.exports = function(app,user) {
    console.log("Registrando sistema de auth")

    /**
     * Rutas de autenticación
     */
    // Panel auth login
    app.get("/login",(req,res)=>{
        res.render("auth/login",{ok:true});
    });




    app.get("/register",(req,res)=>{
        res.render("auth/register");
    });

    app.post("/register_post", async (req,res)=>{
        const {email, password, confirm_password} = req.body;
        console.log("Se llamo a registro");
        if(password !== confirm_password){
            res.render("auth/register",{error:"Passwords do not match"});
            console.log("error")
        }
        const existingUser = await user.findUserByEmail(email)
        if(existingUser){
            return res.render("auth/register", { error: "A user with that email already exists." });
        }
        await user.createUser(email,password);
        return res.redirect("/login");
    });

    // Procesar login
    app.post('/login', async (req,res) =>{
        const {email,password} = req.body;
        const existingUser = await user.verifyUser(email,password);
        if(existingUser === null){
            return res.render("auth/login",{error: "The user you are trying to log in with does not exist."});
        }

        const privData = {
            email:existingUser.email,
            user_token:existingUser.user_code,
            rol:existingUser.rol,
            loginAr:Date.now()
            
        }

        req.session.priv = encriptacion.encryptForUser(existingUser.id,privData);
        req.session.userId = existingUser.id; 
       
        return res.redirect("/map");

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