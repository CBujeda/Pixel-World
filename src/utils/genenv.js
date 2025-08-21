console.log("MASTER_KEY="+ require('crypto').randomBytes(32).toString('hex'))
console.log("SESSION_SECRET="+ require('crypto').randomBytes(32).toString('hex'))
console.log("PORT=3000")