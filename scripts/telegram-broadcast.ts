import { Telegraf } from 'telegraf';
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
const botToken = allEnv.TELEGRAM_BOT_TOKEN;

if (!supabaseUrl || !supabaseKey || !botToken) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const bot = new Telegraf(botToken);

const announceText = `🔥 *NUEVOS LOCALES PREMIUM EN MIAMI – recién agregados hoy* 🔥

*Mode, Jolene, Brother's Keeper y Baia Beach Club* ya están en LabelBabel.

Estos son los spots que están rompiendo todo en South Beach y alrededores este 2026.  
Alta vibra, exclusividad y ese toque que buscas para esta semana.

→ Mira los detalles y guarda tus favoritos ahora:  
[https://labelbabel.com/en/miami-us?utm_source=telegram&utm_medium=announce&utm_campaign=miami_v1_launch](https://labelbabel.com/en/miami-us?utm_source=telegram&utm_medium=announce&utm_campaign=miami_v1_launch)

¿Cuál vas a probar primero? Comenta abajo 👇  
(Pro tip: activa las GeoAlerts para que te avise cuando estés cerca)

#MiamiNightlife #LabelBabel #SouthBeach`;

async function runBroadcast() {
    console.log('🚀 Checking users in telegram_users...');
    const { data: users, error } = await supabase.from('telegram_users').select('id');

    if (error) throw error;

    if (!users || users.length === 0) {
        console.log('⚠️ No users found in telegram_users.');
        // If no users, we might try the owner ID at least
        const ownerId = allEnv.TELEGRAM_OWNER_ID || allEnv.TELEGRAM_ADMIN_ID;
        if (ownerId) {
            console.log(`📡 Sending trial to owner: ${ownerId}`);
            await bot.telegram.sendMessage(ownerId, announceText, { parse_mode: 'Markdown' });
            console.log('✅ Trial Success.');
        }
    } else {
        console.log(`👥 Found ${users.length} users. Broadcasting...`);
        for (const user of users) {
            await bot.telegram.sendMessage(user.id, announceText, { parse_mode: 'Markdown' });
            console.log(`✅ Sent to ${user.id}`);
        }
    }
}

runBroadcast().catch(console.error);
