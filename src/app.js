/**
 *  PIXEL WORLD 
 * 
 */
console.log(
"  _                                  \n"+
" |_) o     _  |   \\    / _  ._ |  _| \n"+
" |   | >< (/_ |    \\/\\/ (_) |  | (_|  v1.0.0 \n");
require("dotenv").config();
const express = require('express');
const session = require('express-session')
app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());

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

const auth = require('./routes/auth.js')(app);

app.listen(PORT,()=>
    console.log(`Server de PIXEL WORLD localhost:${PORT}`)
);