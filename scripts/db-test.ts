import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv(filePath: string) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    const env: Record<string, string> = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = (match[2] || '').trim();
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            env[match[1]] = value;
        }
    });
    return env;
}

const envLocal = loadEnv(path.resolve(process.cwd(), '.env.local'));
const envDefault = loadEnv(path.resolve(process.cwd(), '.env'));
const allEnv = { ...envDefault, ...envLocal };

const supabaseUrl = allEnv.SUPABASE_URL || allEnv.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = allEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { console.error('Missing creds'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase.from('content').select('count', { count: 'exact' });
    console.log('--- Content Check ---');
    console.log('Error:', error);
    console.log('Data:', data);

    const { data: tgUsers, error: tgError } = await supabase.from('telegram_users').select('count', { count: 'exact' });
    console.log('--- TG Users Check ---');
    console.log('Error:', tgError);
    console.log('Data:', tgUsers);
}

test().catch(console.error);
