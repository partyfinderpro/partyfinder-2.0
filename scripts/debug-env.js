const fs = require('fs');
const dotenv = require('dotenv');

function checkEnvFile(filename) {
    if (!fs.existsSync(filename)) {
        console.log(`--- ${filename} no existe ---`);
        return;
    }
    console.log(`--- Leyendo ${filename} ---`);
    const content = fs.readFileSync(filename, 'utf8');
    const env = dotenv.parse(content);
    for (const key in env) {
        console.log(`${key}: ${env[key].substring(0, 10)}... (Length: ${env[key].length})`);
    }
}

checkEnvFile('.env');
checkEnvFile('.env.local');
checkEnvFile('.env.production');
checkEnvFile('.env.vercel');
