import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// --- AI CONFIGURATION ---
const SYSTEM_PROMPT = `Eres VENUZ Bot, el asistente de inteligencia artificial del evento VENUZ.
Tu objetivo es ayudar a Pablo (CEO) a gestionar la plataforma.
Eres operativo, conciso y directo.
Si te piden "resumen", da un resumen del estado del sistema.
Si te piden "crear tarea", confirma que la registrarás.
Usa emojis para dar formato.`;

async function askGroq(question: string, context: string): Promise<string | null> {
    if (!GROQ_API_KEY) return null;
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: `${SYSTEM_PROMPT}\n\nCONTEXTO:\n${context}` },
                    { role: 'user', content: question }
                ],
                model: 'llama3-70b-8192',
                temperature: 0.5,
                max_tokens: 1024
            })
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (e) {
        console.error('Groq Error:', e);
        return null;
    }
}

async function askGemini(question: string, context: string): Promise<string | null> {
    if (!GEMINI_API_KEY) return null;
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nCONTEXTO:\n${context}\n\nUSER: ${question}` }] }]
                })
            }
        );
        if (!response.ok) return null;
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) {
        console.error('Gemini Error:', e);
        return null;
    }
}

// --- WEBHOOK HANDLER ---
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const message = body?.message;
        if (!message?.text || !message?.chat?.id) {
            return NextResponse.json({ ok: true });
        }

        const chatId = message.chat.id;
        const text = message.text;

        // --- COMANDOS ---
        if (text.startsWith('/')) {
            let reply = '';
            if (text === '/start') {
                reply = '🎉 VENUZ Bot v3.2 (Groq+Gemini)\n\nComandos:\n/status - Estado del sistema\n/stats - Estadísticas\n/help - Ayuda';
            } else if (text === '/status') {
                reply = '✅ Sistema Operativo\n🟢 Feed: Activo\n🟢 Bot: Groq Llama3 Enabled';
            } else {
                reply = 'Comando no reconocido.';
            }

            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: reply })
            });
            return NextResponse.json({ ok: true });
        }

        // --- AI CHAT ---
        // 1. Send "typing" action
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, action: 'typing' })
        });

        // 2. Get AI Response
        const context = `URL: ${process.env.NEXT_PUBLIC_APP_URL || 'https://labelbabel.com'}`;

        let aiResponse = await askGroq(text, context);
        if (!aiResponse) aiResponse = await askGemini(text, context);
        if (!aiResponse) aiResponse = '⚠️ Mis cerebros de IA (Groq y Gemini) no responden. Intenta más tarde.';

        // 3. Send Reply
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: aiResponse,
                parse_mode: 'Markdown'
            })
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ ok: true });
    }
}
