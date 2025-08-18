const users = [
    { id: 1, email: "clara@example.com", password: "1234" }
];

module.exports = function(app) {
    console.log("Registrando sistema de auth")

    app.post('/login',(req,res) =>{
        const {email,password} = req.body;
        const user = users.find(u => u.email === email && u.password === password);
        
        if(!user){
            return res.status(401).json({error: "Credenciales Invalidas"})
        }
        req.session.userId = user.id;

        res.json({ok:true, msg: "Sesion Iniciada"})

    })

    // Ruta protegida
    app.get('/me',(req,res) =>{
        if(!req.session.userId){
            return res.status(401).json({error: "No autenticado"});
        }

        res.json({msg: "Estas logueada",userId: req.session.userId});
    });

    app.post('/logout',(req,res)=>{
        req.session.destroy(()=>{
            res.clearCookie("connect.sid");
            res.json({ok:true,msg:"Sesion Cerrada"})
        })
    })
}