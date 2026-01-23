// lib/analytics.ts
// Sistema de analytics para tracking de eventos
// Código basado en análisis de Grok

import { supabase } from './supabase';

// Tipos de eventos que trackeamos
export type EventType =
    | 'view'           // Usuario ve un contenido
    | 'click'          // Click en un card
    | 'click_affiliate' // Click en link de afiliado (conversión potencial)
    | 'like'           // Like a contenido
    | 'unlike'         // Unlike
    | 'share'          // Compartir contenido
    | 'search'         // Búsqueda realizada
    | 'filter'         // Filtrado por categoría
    | 'modal_open'     // Modal interstitial abierto
    | 'modal_close'    // Modal cerrado
    | 'exit_warning'   // Warning de salida mostrado
    | 'exit_confirmed' // Usuario confirma salir a sitio externo
    | 'scroll_depth'   // Profundidad de scroll alcanzada
    | 'session_start'  // Inicio de sesión
    | 'session_end';   // Fin de sesión

interface AnalyticsEvent {
    event_type: EventType;
    content_id?: string;
    user_id?: string;
    metadata?: Record<string, any>;
    path?: string;
    referrer?: string;
    user_agent?: string;
    timestamp?: string;
}

// Cache para evitar duplicados rápidos
const recentEvents = new Map<string, number>();
const DEDUPE_WINDOW_MS = 1000; // 1 segundo

/**
 * Trackea un evento de analytics
 */
export async function trackEvent(
    event: EventType,
    contentId?: string,
    userId?: string,
    extra?: Record<string, any>
): Promise<void> {
    // Solo ejecutar en cliente
    if (typeof window === 'undefined') return;

    // Deduplicación: evitar eventos duplicados en ventana corta
    const eventKey = `${event}-${contentId || 'none'}`;
    const now = Date.now();
    const lastTime = recentEvents.get(eventKey);

    if (lastTime && now - lastTime < DEDUPE_WINDOW_MS) {
        return; // Evento duplicado, ignorar
    }
    recentEvents.set(eventKey, now);

    // Limpiar cache vieja
    if (recentEvents.size > 100) {
        const oldestAllowed = now - DEDUPE_WINDOW_MS * 10;
        recentEvents.forEach((time, key) => {
            if (time < oldestAllowed) recentEvents.delete(key);
        });
    }

    const eventData: AnalyticsEvent = {
        event_type: event,
        content_id: contentId || undefined,
        user_id: userId || undefined,
        metadata: {
            ...extra,
            screen_width: window.innerWidth,
            screen_height: window.innerHeight,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        path: window.location.pathname,
        referrer: document.referrer || undefined,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
    };

    try {
        // Insertar en tabla analytics_events
        const { error } = await supabase
            .from('analytics_events')
            .insert(eventData);

        if (error) {
            // Si la tabla no existe, loguear localmente
            console.log('[VENUZ Analytics]', event, contentId, extra);
        }
    } catch (error) {
        // Fallback: log local
        console.log('[VENUZ Analytics]', event, contentId, extra);
    }
}

/**
 * Trackea una vista de contenido
 */
export function trackView(contentId: string, userId?: string): void {
    trackEvent('view', contentId, userId);
}

/**
 * Trackea click en afiliado (conversión potencial)
 */
export function trackAffiliateClick(
    contentId: string,
    affiliateSource: string,
    affiliateUrl: string,
    userId?: string
): void {
    trackEvent('click_affiliate', contentId, userId, {
        affiliate_source: affiliateSource,
        affiliate_url: affiliateUrl,
    });
}

/**
 * Trackea apertura de modal interstitial
 */
export function trackModalOpen(contentId: string, userId?: string): void {
    trackEvent('modal_open', contentId, userId);
}

/**
 * Trackea confirmación de salida
 */
export function trackExitConfirmed(
    contentId: string,
    affiliateSource: string,
    userId?: string
): void {
    trackEvent('exit_confirmed', contentId, userId, {
        affiliate_source: affiliateSource,
    });
}

/**
 * Trackea búsqueda
 */
export function trackSearch(query: string, resultsCount: number, userId?: string): void {
    trackEvent('search', undefined, userId, {
        query,
        results_count: resultsCount,
    });
}

/**
 * Trackea filtrado por categoría
 */
export function trackFilter(category: string, userId?: string): void {
    trackEvent('filter', undefined, userId, {
        category,
    });
}

/**
 * Obtener estadísticas agregadas (para admin)
 */
export async function getAnalyticsSummary(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('analytics_events')
        .select('event_type, content_id, created_at')
        .gte('created_at', startDate.toISOString());

    if (error || !data) {
        return null;
    }

    // Agregar por tipo de evento
    const summary = data.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        totalEvents: data.length,
        byType: summary,
        period: `${days} días`,
    };
}

// SQL para crear la tabla (ejecutar en Supabase):
/*
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  content_id uuid REFERENCES public.content(id),
  user_id uuid REFERENCES auth.users(id),
  metadata jsonb,
  path text,
  referrer text,
  user_agent text,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_content_id ON public.analytics_events(content_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);

-- RLS: Solo admins pueden leer analytics
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read analytics" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Cualquiera puede insertar (para tracking anónimo)
CREATE POLICY "Anyone can insert analytics" ON public.analytics_events
  FOR INSERT WITH CHECK (true);
*/
