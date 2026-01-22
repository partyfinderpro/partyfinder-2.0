const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const keys = Object.keys(process.env);
const hasDbUrl = keys.includes('DATABASE_URL') || keys.includes('SUPABASE_DB_URL'); // Common names
console.log('Has DATABASE_URL:', hasDbUrl);
if (hasDbUrl) console.log('Key name:', keys.find(k => k.includes('DB') || k.includes('DATABASE')));
