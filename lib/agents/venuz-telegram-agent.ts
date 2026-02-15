
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

    // 2.1 Recuperar tareas pendientes para contexto
    // Fetch pending tasks to give LLM full context
    const { data: pendingTasks } = await supabase
        .from('tasks')
        .select('id, title, priority, status')
        .in('status', ['pending', 'in_progress'])
        .order('priority', { ascending: false });

    // Format tasks for the prompt
    const tasksList = pendingTasks?.map(t => `- [${t.title}] (ID: ${t.id.slice(0, 4)}, P${t.priority}, ${t.status})`).join('\n') || 'No hay tareas pendientes.';

    // 2.5 Auto-Clasificación de Links y APIs
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const linksFound = text.match(linkRegex) || [];
    let linksSummary = "";

    if (linksFound.length > 0) {
        console.log(`[Telegram Agent] Detectados ${linksFound.length} links. Clasificando...`);
        const classificationPrompt = `
        Clasifica estos links para el proyecto VENUZ:
        - Tipo: api, affiliate_link, scraper_source, tool, reference, other
        - Categoría: free_llm, event_scraper, adult_affiliate, nightlife_source, etc.
        - Prioridad: 1-5 (5 = urgente)
        - Título y descripción breve

        Links: ${linksFound.join('\n')}

        Devuelve JSON array puro:
        [
            { "url": "...", "type": "...", "category": "...", "priority": 1, "title": "...", "description": "..." }
        ]
        `;

        try {
            const classificationRaw = await llmRouter.generateContent(classificationPrompt, { temperature: 0.1 });
            // Cleanup JSON
            const jsonStr = classificationRaw.replace(/```json/g, '').replace(/```/g, '').trim();
            const resources = JSON.parse(jsonStr);

            if (Array.isArray(resources)) {
                for (const res of resources) {
                    await supabase.from('project_resources').insert({
                        ...res,
                        status: 'pending'
                    });
                }
                linksSummary = `\n✅ SISTEMA: Se guardaron ${resources.length} nuevos recursos: ` + resources.map((r: any) => `${r.title} (${r.category})`).join(', ');
                await notifyCustom(`💾 Guardados automáticamente: \n${resources.map((r: any) => `- ${r.title} (${r.type})`).join('\n')}`);
            }
        } catch (e) {
            console.error("Error clasificando links:", e);
        }
    }

    // 3. Prompt inteligente para el cerebro
    const systemPrompt = `
    Eres VENUZ Core, el asistente personal inteligente y proactivo de Pablo para el proyecto VENUZ.love.
    Tu misión es gestionar el proyecto, recordar todo, clasificar información y ejecutar órdenes.
    
    ESTADO ACTUAL DE TAREAS:
    ${tasksList}

    ${linksSummary ? `\nEVENTO RECIENTE:\n${linksSummary}` : ''}

    CAPACIDADES:
    - Gestión de Tareas: 
      - "Crea tarea...": crea nueva.
      - "Actualiza tarea [ID corto o nombre] a ...": cambia estado (pending, in_progress, done).
      - "Qué tareas tengo": Responde basándote en la lista de arriba.
      - "Qué APIs tengo": Si te preguntan por recursos, diles que revisen la tabla project_resources (o resume si las ves).
    - Memoria: Usa el contexto de la conversación.
    - Personalidad: Profesional, eficiente, "Grok-like", directo, usa emojis.
    
    HERRAMIENTAS DISPONIBLES (Responde con JSON al final si hay acciones):
    
    Respuesta de texto normal explicando lo que hiciste...
    
    \`\`\`json
    {
      "actions": [
        { "type": "create_task", "data": { "title": "...", "description": "...", "priority": 1 } },
        { "type": "update_task", "data": { "id_fragment": "...", "status": "done" } }
      ]
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
    const jsonMatch = responseV1.match(/```json\n([\s\S]*?)\n```/) || responseV1.match(/```json([\s\S]*?)```/); // Robust match
    if (jsonMatch) {
        try {
            const rawJson = jsonMatch[1].trim();
            const parsed = JSON.parse(rawJson);
            const actions = parsed.actions || (parsed.action ? [parsed] : []); // Support legacy single action or new array

            finalResponse = responseV1.replace(jsonMatch[0], '').trim();

            for (const action of actions) {
                // Support both 'type' and 'action' formats for robustness
                const type = action.type || action.action;
                const data = action.data;

                if (type === 'create_task') {
                    await supabase.from('tasks').insert({ title: data.title, description: data.description, priority: data.priority || 1 });
                    finalResponse += `\n✅ Tarea creada: ${data.title}`;

                } else if (type === 'update_task') {
                    const { id_fragment, status } = data;
                    // Fuzzy match logic managed by Agent's extracted ID fragment
                    // Attempt to find task that matches id_fragment
                    let taskIdToUpdate = null;
                    let taskTitle = "";

                    // Try exact UUID
                    if (id_fragment.length > 10) {
                        const { data: t } = await supabase.from('tasks').select('id, title').eq('id', id_fragment).single();
                        if (t) { taskIdToUpdate = t.id; taskTitle = t.title; }
                    }

                    // Try partial ID match from pending list
                    if (!taskIdToUpdate) {
                        const match = pendingTasks?.find(t => t.id.startsWith(id_fragment) || t.title.toLowerCase().includes(id_fragment.toLowerCase()));
                        if (match) { taskIdToUpdate = match.id; taskTitle = match.title; }
                    }

                    if (taskIdToUpdate) {
                        await supabase.from('tasks').update({ status }).eq('id', taskIdToUpdate);
                        finalResponse += `\n🔄 Tarea actualizada: "${taskTitle}" -> ${status}`;
                    } else {
                        finalResponse += `\n⚠️ No encontré la tarea "${id_fragment}" para actualizar.`;
                    }

                } else if (type === 'save_link') {
                    const { url, category, notes } = data;
                    await supabase.from('brain_conversations').insert({
                        message: `Link guardado: ${url}`,
                        type: 'system',
                        metadata: { url, category, notes }
                    });
                    finalResponse += `\n🔗 Link guardado en ${category}`;
                }
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
    await notifyCustom(finalResponse);

    return finalResponse;
}
