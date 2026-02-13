
const { execSync } = require('child_process');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function setEnv(name, value) {
    console.log(`Setting ${name}...`);
    // Usamos printf para evitar saltos de línea si estuviéramos en bash, 
    // pero en Windows usaremos un método que pase el valor directamente al stdin de vercel env add
    try {
        const cmd = `npx vercel env add ${name} production --force`;
        console.log(`Running: ${cmd}`);
        // Pasamos el valor sin saltos de linea via stdin
        execSync(cmd, { input: value, encoding: 'utf8' });

        // Repetimos para otros entornos
        execSync(`npx vercel env add ${name} preview --force`, { input: value, encoding: 'utf8' });
        execSync(`npx vercel env add ${name} development --force`, { input: value, encoding: 'utf8' });

        console.log(`  - ${name} set successfully.`);
    } catch (e) {
        console.error(`  - Error setting ${name}: ${e.message}`);
    }
}

setEnv("NEXT_PUBLIC_SUPABASE_URL", url);
setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", key);
