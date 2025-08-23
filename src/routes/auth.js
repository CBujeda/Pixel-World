const users = [
    { id: 1, email: "clara@example.com", password: "1234" }
];

const encriptacion = require('../utils/crypt.js');

module.exports = function(app) {
    console.log("Registrando sistema de auth")

    /**
     * Rutas de autenticación
     */
    // Panel auth login
    app.get("/login",(req,res)=>{
        res.render("auth/login");
    });

    app.get("/register",(req,res)=>{
        res.render("auth/register");
    });

    // Procesar login
    app.post('/login',(req,res) =>{
        const {email,password} = req.body;
        const user = users.find(u => u.email === email && u.password === password);
        
        if(!user){
            return res.status(401).json({error: "Credenciales Invalidas"})
        }

        const privData = {
            email:user.email,
            roles:["user"],
            loginAt: Date.now()
        };
        req.session.priv = encriptacion.encryptForUser(user.id,privData);
        req.session.userId = user.id; 
        
        res.json({ok:true, msg: "Sesion Iniciada"})

    });

    // Ruta protegida
    app.get('/me',(req,res) =>{
        if(!req.session.userId){
            return res.status(401).json({error: "No autenticado"});
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