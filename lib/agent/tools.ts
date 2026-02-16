// lib/agent/tools.ts

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase (Service Role for admin tasks)
const supabase = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export const writeFileTool = tool(async ({ path, content }) => {
    try {
        // SECURITY WARNING: Writing to local filesystem in production (Vercel) is ephemeral.
        // This is primarily for local development or temporary file processing.
        // For persistent storage, use Supabase Storage or a database.

        // Check environment
        if (process.env.NODE_ENV === 'production') {
            logger.warn('Attempted to write file in production environment', { path });
            return `WARNING: File writing in production is ephemeral and will be lost on redeploy. Path: ${path}`;
        }

        // Call internal API endpoint to handle file write (since this tool runs in Agent/Server context)
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp/write`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${process.env.MCP_SECRET}` // TODO: Add auth
            },
            body: JSON.stringify({ path, content })
        });

        if (!response.ok) {
            throw new Error(`Failed to write file: ${response.statusText}`);
        }

        const result = await response.json();
        return `Archivo escrito exitosamente: ${path}. ${result.message || ''}`;
    } catch (error: any) {
        logger.error('Error in write_file tool', { error });
        return `Error escribiendo archivo: ${error.message}`;
    }
}, {
    name: 'write_file',
    description: 'Escribe o sobrescribe un archivo en el proyecto (SOLO DESARROLLO LOCAL)',
    schema: z.object({
        path: z.string().describe('Ruta relativa del archivo, ej: app/venue/page.tsx'),
        content: z.string().describe('Contenido completo del archivo')
    })
});

export const executeSqlTool = tool(async ({ query }) => {
    try {
        // Only allow SELECT for safety by default, but user asked for "full access"
        // We will use Supabase generic query via RPC if available, or direct if exposed.
        // Supabase client-js doesn't support raw SQL directly easily without an RPC function.
        // Assuming 'exec_sql' RPC function exists for admin.

        /* 
           CREATE OR REPLACE FUNCTION exec_sql(query text)
           RETURNS jsonb
           LANGUAGE plpgsql
           SECURITY DEFINER
           AS $$
           DECLARE
             result jsonb;
           BEGIN
             EXECUTE query INTO result; -- This is very dangerous, use with caution!
             -- Or actually, typical generic implementation might need more complex handling for rows
             RETURN result;
           END;
           $$;
        */

        const { data, error } = await supabase.rpc('exec_sql', { query });

        if (error) {
            // Fallback: If RPC doesn't exist, we can't run raw SQL easily via JS client alone 
            // without postgres connection string.
            // But maybe we can try to infer simple operations? No, that's brittle.
            return `Error ejecutando SQL: ${error.message}. (Asegúrate de tener la función RPC 'exec_sql' creada)`;
        }

        return JSON.stringify(data, null, 2);
    } catch (error: any) {
        logger.error('Error in execute_sql tool', { error });
        return `Error ejecutando SQL: ${error.message}`;
    }
}, {
    name: 'execute_sql',
    description: 'Ejecuta una consulta SQL cruda en la base de datos (Requiere función RPC exec_sql)',
    schema: z.object({
        query: z.string().describe('Consulta SQL a ejecutar')
    })
});

export const gitCommitPushTool = tool(async ({ message }) => {
    // This is purely for local dev agents capable of running shell commands.
    // In Vercel, git is not available or credentials are not set up for push.
    return "Git commit/push no soportado en este entorno de ejecución (Vercel). Ejecutar localmente.";
}, {
    name: 'git_commit_push',
    description: 'Realiza commit y push de los cambios actuales',
    schema: z.object({
        message: z.string().describe('Mensaje del commit')
    })
});
