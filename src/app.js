/**
 *  PIXEL WORLD 
 * 
 */
console.log(
"  _                                  \n"+
" |_) o     _  |   \\    / _  ._ |  _| \n"+
" |   | >< (/_ |    \\/\\/ (_) |  | (_|  v1.0.0 Dev \n");
require("dotenv").config();
const express = require('express');
const session = require('express-session')
const path = require('path');
app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.set("view engine","ejs");
app.set("views", path.join(__dirname, "..", "views"));
/*========================== SESSION ========================== */

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) {
    throw new Error("SESSION_SECRET inválido: debe existir y tener al menos 16 caracteres");
}
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly:true,
        secure:false,
        maxAge: 1000 * 60 * 10
    }
}));

/*============================================================== */
/*=========================== ROUTES =========================== */

const auth = require('./routes/auth.js')(app);

app.listen(PORT,()=>
    console.log(`Server de PIXEL WORLD localhost:${PORT}`)
);