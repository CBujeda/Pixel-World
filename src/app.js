/**
 *  PIXEL WORLD 
 * 
 */
const express = require('express');
const session = require('express-session')
app = express();
const PORT = 3000;


app.use(express.json());

app.use(session({
    secret: "bc834b1c0618f8e7abf7c34978c94522",
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