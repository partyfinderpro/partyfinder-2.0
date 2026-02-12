// lib/sce/health-monitor.ts
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }

  return createClient(url, key);
};

interface HealthCheckResult {
  source_id: string;
  status: 'ok' | 'warning' | 'failed' | 'unreachable';
  response_time_ms: number;
  http_status: number;
  error_message?: string;
}

/**
 * Verificar salud de una URL
 */
async function checkUrlHealth(url: string): Promise<Omit<HealthCheckResult, 'source_id'>> {
  const startTime = Date.now();

  try {
    const response = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: () => true, // Aceptar cualquier status
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VENUZ-SCE/1.0)',
      },
    });

    const responseTime = Date.now() - startTime;
    const httpStatus = response.status;

    let status: 'ok' | 'warning' | 'failed';

    if (httpStatus >= 200 && httpStatus < 300) {
      status = 'ok';
    } else if (httpStatus >= 300 && httpStatus < 400) {
      status = 'warning'; // Redirects
    } else {
      status = 'failed';
    }

    return {
      status,
      response_time_ms: responseTime,
      http_status: httpStatus,
    };

  } catch (error: any) {
    return {
      status: 'unreachable',
      response_time_ms: Date.now() - startTime,
      http_status: 0,
      error_message: error.message,
    };
  }
}

/**
 * Ejecutar health check en todas las fuentes activas
 */
export async function runHealthCheck() {
  console.log('🏥 Health Monitor - Iniciando');
  const supabase = getSupabase();

  const { data: sources } = await supabase
    .from('sce_sources')
    .select('*')
    .eq('is_active', true);

  if (!sources || sources.length === 0) {
    console.log('No hay fuentes activas para checkear');
    return;
  }

  console.log(`Checkeando ${sources.length} fuentes...`);

  let healthyCount = 0;
  let unhealthyCount = 0;

  for (const source of sources) {
    const result = await checkUrlHealth(source.url);

    // Guardar resultado
    await supabase.from('sce_health_checks').insert({
      source_id: source.id,
      status: result.status,
      response_time_ms: result.response_time_ms,
      http_status: result.http_status,
      error_message: result.error_message,
    });

    if (result.status === 'ok') {
      healthyCount++;
    } else {
      unhealthyCount++;

      // Crear alerta si está caída
      if (result.status === 'unreachable' || result.status === 'failed') {
        const title = `URL no responde: ${source.name}`;
        const message = `${source.url}\nStatus: ${result.http_status}\nError: ${result.error_message || 'N/A'}`;

        // Log locally
        console.error(`🚨 ALERT: ${title}\n${message}`);

        await supabase.from('sce_alerts').insert({
          type: 'url_failed',
          severity: result.status === 'unreachable' ? 'critical' : 'warning',
          title: title,
          message: message,
          source_id: source.id,
          is_read: false
        });
      }
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`✅ Health Check completado: ${healthyCount} sanas, ${unhealthyCount} con problemas`);

  return {
    total: sources.length,
    healthy: healthyCount,
    unhealthy: unhealthyCount,
  };
}
