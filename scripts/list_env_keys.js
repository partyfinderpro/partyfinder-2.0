const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const keys = Object.keys(process.env);
console.log('Keys:', keys.filter(k => !k.startsWith('npm_') && !k.startsWith('Program')));
