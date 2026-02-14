
import { llmRouter } from "@/lib/llm-router";
import { createClient } from "@supabase/supabase-js";
import { notifyCustom } from "@/lib/telegram-notify";

// Initialize Supabase Client manually as this might run in a context where cookies aren't available (webhook)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function handleTelegramMessage(text: string, chatId: number | string) {
    console.log(`[Telegram Agent] Recibido de ${chatId}: ${text}`);

    // 1. Guardar mensaje del usuario
    await supabase.from('brain_conversations').insert({
        message: text,
        type: 'user',
        user_id: String(chatId)
    });

    // 2. Recuperar contexto reciente (últimos 5 mensajes)
    const { data: history } = await supabase
        .from('brain_conversations')
        .select('message, type')
        .order('created_at', { ascending: false })
        .limit(5);

    const historyText = history?.reverse().map(h => `${h.type === 'user' ? 'Pablo' : 'VENUZ'}: ${h.message}`).join('\n') || '';

    // 3. Prompt inteligente para el cerebro
    const systemPrompt = `
    Eres VENUZ Core, el asistente personal inteligente y proactivo de Pablo para el proyecto VENUZ.love.
    Tu misión es gestionar el proyecto, recordar todo, clasificar información y ejecutar órdenes.
    
    CAPACIDADES:
    - Gestión de Tareas: Si Pablo dice "recuerda", "tarea", "pendiente", crea una tarea.
    - Clasificación: Si hay un link, analiza qué es (afiliado, herramienta, noticia) y guárdalo.
    - Memoria: Usa el contexto de la conversación.
    - Personalidad: Profesional, eficiente, "Grok-like", directo, usa emojis.
    
    HERRAMIENTAS DISPONIBLES (Simuladas en tu respuesta, yo las ejecutaré):
    Si detectas una acción, responde con un bloque JSON al final de tu respuesta de texto:
    
    Respuesta normal...
    
    \`\`\`json
    {
      "action": "create_task" | "save_link" | "none",
      "data": { ... }
    }
    \`\`\`

    Contexto reciente:
    ${historyText}

    Pablo dice: "${text}"
    `;

    // 4. Generar pensamiento comando
    const responseV1 = await llmRouter.generateContent(systemPrompt, { temperature: 0.7 });

    // 5. Procesar acciones (JSON parsing)
    let finalResponse = responseV1;

    // Extract JSON block if present
    const jsonMatch = responseV1.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
        try {
            const actionData = JSON.parse(jsonMatch[1]);
            finalResponse = responseV1.replace(jsonMatch[0], '').trim(); // Remove JSON from chat output

            if (actionData.action === 'create_task') {
                const { title, description, priority } = actionData.data;
                await supabase.from('tasks').insert({ title, description, priority });
                finalResponse += `\n✅ Tarea creada: ${title}`;
            } else if (actionData.action === 'save_link') {
                const { url, category, notes } = actionData.data;
                // Here we could save to a 'links' table or just tasks/memory
                await supabase.from('brain_conversations').insert({
                    message: `Link guardado: ${url}`,
                    type: 'system',
                    metadata: { url, category, notes }
                });
                finalResponse += `\n🔗 Link guardado en ${category}`;
            }
        } catch (e) {
            console.error("Error procesando acción del agente:", e);
        }
    }

    // 6. Guardar respuesta del bot
    await supabase.from('brain_conversations').insert({
        message: finalResponse,
        type: 'bot',
        user_id: String(chatId)
    });

    // 7. Enviar respuesta a Telegram
    // Usamos el ID del chat que nos habló, o el admin por defecto si es broadcast
    // notifyCustom usa una variable de entorno fija para OWNER_CHAT_ID, 
    // pero idealmente deberíamos responder dinámicamente.
    // Asumiremos que notifyCustom envía al dueño (Pablo).
    // Si queremos responder a un chat específico, necesitamos extender notifyCustom o usar fetch directo aquí.
    // Por simplicidad y seguridad, usamos la función existente que envía al dueño.

    await notifyCustom(finalResponse);

    return finalResponse;
}
