// /lib/highway-v4.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { FEED_WEIGHTS } from './feed-config';


// Credenciales directas de Supabase como fallback
const SUPABASE_URL = 'https://jbrmziwosyeructvlvrq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_emVwFBH19Vn54SrEegsWxg_WKU9MaHR';

// Lazy initialization to avoid build-time errors
let _supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
    if (!_supabase) {
        _supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
        )
    }
    return _supabase
}

// =============================================
// TIPOS
// =============================================
export interface UserContext {
    city: string
    lat?: number
    lng?: number
    deviceId: string
    userId?: string
    sessionId: string
}

export interface FeedItem {
    id: string
    title: string
    category: string
    source?: string
    score: number
    image_url?: string
    description?: string
    quality_score?: number
    days_until_event?: number
    avg_time_spent?: number
    clicks_count?: number
    completion_rate?: number
    trending_score?: number
    [key: string]: any
}

// =============================================
// CLASE PRINCIPAL
// =============================================
export class HighwayAlgorithm {
    private context: UserContext
    private now: Date
    private ratios: Record<string, number> = {}
    private config: Record<string, any> = {}

    constructor(context: UserContext) {
        this.context = context
        this.now = new Date()
    }

    // =============================================
    // 1. CARGAR CONFIGURACIÓN DESDE DB
    // =============================================
    async loadConfig() {
        try {
            const { data } = await getSupabase()
                .from('algorithm_config')
                .select('config_key, config_value')

            if (data && data.length > 0) {
                data.forEach((row: any) => {
                    this.config[row.config_key] = row.config_value
                })
            }
        } catch (err) {
            console.error('[Highway] Error loading config:', err)
        }

        // Fallback a defaults si no hay config
        if (!this.config.base_ratios) {
            this.config.base_ratios = {
                eventos: 40,  // ⬆️ PRIORIDAD ALTA (Conciertos, fiestas, eventos)
                clubs: 20,    // 🟡 PRIORIDAD MEDIA (Antros)
                soltero: 15,  // 🟡 PRIORIDAD MEDIA (Monetización)
                shows: 15,    // 🟡 PRIORIDAD MEDIA
                bares: 5,     // ⬇️ PRIORIDAD BAJA (Google Places genérico)
                experiencias: 5 // ⬇️ PRIORIDAD BAJA
            }
        }
    }

    // =============================================
    // 2. CALCULAR RATIOS DINÁMICOS
    // =============================================
    async calculateRatios() {
        await this.loadConfig()

        // Empezar con base
        this.ratios = { ...this.config.base_ratios }

        // Aplicar modificador de HORA
        const hour = this.now.getHours()
        const timeSlot = this.getTimeSlot(hour)
        this.applyModifier(this.config.hour_modifiers?.[timeSlot])

        // Aplicar modificador de DÍA
        const day = this.getDayName()
        this.applyModifier(this.config.day_modifiers?.[day])

        // Aplicar modificador de CIUDAD
        try {
            const { data: city } = await getSupabase()
                .from('cities')
                .select('ratio_overrides')
                .eq('slug', this.context.city)
                .maybeSingle()

            if (city?.ratio_overrides) {
                this.applyModifier(city.ratio_overrides)
            }
        } catch (err) {
            console.warn('[Highway] City override failed:', err)
        }

        // Aplicar PREFERENCIAS DEL USUARIO (si tiene historial)
        await this.applyUserPreferences()

        // Normalizar a 100%
        this.normalize()

        return this.ratios
    }

    private getTimeSlot(hour: number): string {
        if (hour >= 6 && hour < 12) return 'morning'
        if (hour >= 12 && hour < 18) return 'afternoon'
        if (hour >= 18 && hour < 24) return 'evening'
        return 'latenight'
    }

    private getDayName(): string {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        return days[this.now.getDay()]
    }

    private applyModifier(modifier?: Record<string, number>) {
        if (!modifier) return
        for (const [key, value] of Object.entries(modifier)) {
            if (this.ratios[key] !== undefined) {
                this.ratios[key] = Math.max(0, this.ratios[key] + value)
            }
        }
    }

    private normalize() {
        const total = Object.values(this.ratios).reduce((a, b) => a + (b as number), 0)
        if (total === 0) return
        for (const key of Object.keys(this.ratios)) {
            this.ratios[key] = Math.round((this.ratios[key] / total) * 100)
        }
    }

    // =============================================
    // 3. PREFERENCIAS DEL USUARIO (últimos 7 días)
    // =============================================
    private async applyUserPreferences() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

        const { data: engagements } = await getSupabase()
            .from('user_engagement')
            .select('category_slug, time_spent, clicked')
            .eq('device_id', this.context.deviceId)
            .gte('created_at', sevenDaysAgo.toISOString())

        if (!engagements || engagements.length < 10) {
            // Cold start: forzar diversidad o mantener ratios base
            return
        }

        // Calcular engagement score por categoría
        const categoryScores: Record<string, number> = {}

        engagements.forEach((e: any) => {
            if (!e.category_slug) return
            if (!categoryScores[e.category_slug]) categoryScores[e.category_slug] = 0

            // Score = time_spent + click_bonus
            let score = Math.min((e.time_spent || 0) / 30, 1) // Max 1 punto por 30+ segundos
            if (e.clicked) score += 0.5
            categoryScores[e.category_slug] += score
        })

        // Aplicar boost suave (+5% por cada punto de score, max +15%)
        for (const [cat, score] of Object.entries(categoryScores)) {
            const boost = Math.min(Math.round(score * 2), 15)
            if (this.ratios[cat] !== undefined) {
                this.ratios[cat] += boost
            }
        }
    }

    // Mapeo de ratios de algoritmo a categorías de DB
    private categoryMap: Record<string, string> = {
        eventos: 'evento',
        clubs: 'club',
        bares: 'bar',
        soltero: 'soltero',
        shows: 'tabledance',
        experiencias: 'restaurante',
        webcams: 'webcam'
    }

    // =============================================
    // 4. OBTENER ITEMS POR CATEGORÍA (con cache)
    // =============================================
    public async getCategoryItems(algoCategory: string, count: number): Promise<FeedItem[]> {
        const dbCategory = this.categoryMap[algoCategory] || algoCategory
        const cacheKey = `${dbCategory}:${this.context.city}`

        // Intentar cache primero
        try {
            const { data: cached } = await getSupabase()
                .from('feed_cache')
                .select('items')
                .eq('cache_key', cacheKey)
                .gt('expires_at', new Date().toISOString())
                .maybeSingle()

            if (cached?.items) {
                // Cache hit - incrementar contador
                await getSupabase().rpc('increment_cache_hit', { key: cacheKey })
                const pool = (cached.items as any[]).map((item: any) => ({
                    ...item,
                    score: item.score || this.calculateItemScore(item)
                }))
                return this.weightedRandomSample(pool, count)
            }
        } catch (err) {
            console.warn('[Highway] Cache fetch failed:', err)
        }

        // Cache miss - query DB
        let query = getSupabase()
            .from('content')
            .select('*')
            .eq('category', dbCategory)
            .eq('active', true)
            .not('image_url', 'is', null) // 🔒 STRICT FILTER: No images = No show
            .neq('image_url', '')

        // Búsqueda por ciudad (opcional para soltero/webcams/tabledance)
        if (!['soltero', 'webcam', 'tabledance'].includes(dbCategory)) {
            query = query.filter('location', 'ilike', `%${this.context.city}%`)
        }

        const { data, error } = await query
            .order('quality_score', { ascending: false })
            .limit(100)

        if (error || !data) {
            console.error(`[Highway] Error loading ${dbCategory}:`, error)
            return []
        }

        const pool = data.map((item: any) => ({
            ...item as any,
            score: this.calculateItemScore(item)
        }))

        // Guardar en cache (4 horas para venues, 1 hora para eventos)
        try {
            const ttlHours = dbCategory === 'evento' ? 1 : 4
            await getSupabase().from('feed_cache').upsert({
                cache_key: cacheKey,
                city_slug: this.context.city,
                category_slug: dbCategory,
                items: pool,
                item_count: pool.length,
                expires_at: new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString()
            })
        } catch (err) {
            console.warn('[Highway] Cache upsert failed:', err)
        }


        return this.weightedRandomSample(pool, count)
    }

    // =============================================
    // 5. SCORE DE ITEM (para ranking)
    // =============================================
    private calculateItemScore(item: any): number {
        let score = 50 // Base

        // 🚨 PENALIZACIONES DE FUENTE (Anti-Spam)
        const lowQualitySources = ['predicthq', 'porndude', 'generic_scraper'];
        if (item.source_type === 'google_places' && !item.has_real_offer) {
            score += FEED_WEIGHTS.main_feed.google_places_penalty;
        } else if (item.source_site && lowQualitySources.some(s => item.source_site.toLowerCase().includes(s))) {
            score -= 20; // Penalización manual
        }

        // Popularidad (engagement histórico)
        if ((item.avg_time_spent || 0) > 20) score += 15
        if ((item.clicks_count || 0) > 100) score += 10
        if ((item.completion_rate || 0) > 0.5) score += 10

        // Calidad del contenido
        if (item.image_url) score += 20 // ⬆️ Boost crucial para imágenes reales
        else score -= 30; // ⬇️ Penalización si se coló sin imagen

        if ((item.description?.length || 0) > 100) score += 5
        if (item.quality_score) score += item.quality_score * 0.2

        // Temporalidad (para eventos)
        if (item.days_until_event !== undefined && item.days_until_event !== null) {
            if (item.days_until_event <= 1) score += 25  // Hoy/mañana = boost fuerte
            else if (item.days_until_event <= 3) score += 15
            else if (item.days_until_event <= 7) score += 5
            else if (item.days_until_event > 30) score -= 10 // Muy lejano = penalización
        }

        // Feed Boosts (Keywords)
        if (item.category === 'concierto') score += FEED_WEIGHTS.main_feed.concert_boost;
        if (item.category.includes('evento')) score += FEED_WEIGHTS.main_feed.event_boost;
        if (item.description?.toLowerCase().includes('2x1')) score += FEED_WEIGHTS.main_feed.offer_2x1_boost;
        if (item.description?.toLowerCase().includes('barra libre')) score += FEED_WEIGHTS.main_feed.barra_libre_boost;
        if (item.description?.toLowerCase().includes('ladies night')) score += FEED_WEIGHTS.main_feed.ladies_night_boost;

        // Trending (pico reciente de engagement)
        if ((item.trending_score || 0) > 0) score += item.trending_score * 0.3

        // 🔒 BOOST PARA CONTENIDO VERIFICADO/PREMIUM
        if (item.is_verified) score += 15;
        if (item.is_premium) score += 20;

        return Math.max(10, Math.min(score, 100)) // Min 10, Max 100
    }

    // =============================================
    // 6. SAMPLE ALEATORIO PONDERADO
    // =============================================
    private weightedRandomSample(pool: FeedItem[], count: number): FeedItem[] {
        if (pool.length <= count) return pool

        const result: FeedItem[] = []
        const available = [...pool]

        while (result.length < count && available.length > 0) {
            const totalWeight = available.reduce((sum, item) => sum + (item.score || 1), 0)
            let random = Math.random() * totalWeight

            for (let i = 0; i < available.length; i++) {
                random -= (available[i].score || 1)
                if (random <= 0) {
                    result.push(available[i])
                    available.splice(i, 1)
                    break
                }
            }
        }

        return result
    }

    // =============================================
    // 7. GENERAR FEED COMPLETO
    // =============================================
    async generateFeed(pageSize: number = 20): Promise<FeedItem[]> {
        await this.calculateRatios()

        const diversityRules = this.config.diversity_rules || {
            max_consecutive: 2,
            exploration_pct: 10,
            injection_every: 8
        }

        // Calcular cuántos items de cada categoría
        const itemCounts: Record<string, number> = {}
        for (const [category, percentage] of Object.entries(this.ratios)) {
            const count = Math.max(1, Math.round((percentage / 100) * pageSize))
            itemCounts[category] = count
        }

        // Obtener items de cada categoría
        const pools: FeedItem[][] = await Promise.all(
            Object.entries(itemCounts).map(([cat, count]) => this.getCategoryItems(cat, count))
        )

        const allItems: FeedItem[] = pools.flat()

        // Shuffle inteligente (evitar consecutivos de misma categoría)
        return this.intelligentShuffle(allItems, diversityRules.max_consecutive)
    }

    // =============================================
    // 8. SHUFFLE INTELIGENTE
    // =============================================
    private intelligentShuffle(items: FeedItem[], maxConsecutive: number): FeedItem[] {
        const result: FeedItem[] = []
        const remaining = [...items]
        let consecutiveCount = 0
        let lastCategory: string | null = null

        while (remaining.length > 0) {
            let candidates = remaining

            if (consecutiveCount >= maxConsecutive && lastCategory) {
                candidates = remaining.filter(i => i.category !== lastCategory)
                if (candidates.length === 0) candidates = remaining
            }

            const totalScore = candidates.reduce((sum, i) => sum + (i.score || 1), 0)
            let random = Math.random() * totalScore
            let selected: FeedItem | null = null

            for (const item of candidates) {
                random -= (item.score || 1)
                if (random <= 0) {
                    selected = item
                    break
                }
            }

            if (!selected) selected = candidates[0]

            if (selected.category === lastCategory) {
                consecutiveCount++
            } else {
                consecutiveCount = 1
                lastCategory = selected.category
            }

            result.push(selected)
            remaining.splice(remaining.indexOf(selected), 1)
        }

        return result
    }
}
