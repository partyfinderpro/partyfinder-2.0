# 🛣️ THE HIGHWAY - CÓDIGO COMPLETO PARA ANTIGRAVITY
## Sistema de Feed Camaleónico VENUZ

**Fecha:** 2026-02-02
**Para:** Antigravity (Backend/Integration)

---

# 📁 ESTRUCTURA DE ARCHIVOS

```
venuz-con-bots/
├── types/
│   └── feed.ts
├── lib/
│   ├── algorithm/
│   │   └── intention-tracker.ts
│   ├── feed/
│   │   └── feed-mixer.ts
│   └── hooks/
│       └── use-feed-mixer.ts
├── components/
│   ├── feed/
│   │   └── feed-card.tsx
│   └── ui/
│       └── like-button.tsx
└── app/
    ├── feed/
    │   └── page.tsx
    └── api/
        └── feed/
            └── route.ts
```

---

# 📄 ARCHIVO 1: types/feed.ts

```typescript
// types/feed.ts
// ============================================
// VENUZ - THE HIGHWAY: Sistema de Feed Camaleónico
// ============================================

export type FeedMode = 'adult' | 'events' | 'mixed' | 'spicy';

export type ContentSource = 
  | 'reddit'
  | 'google_places'
  | 'ticketmaster'
  | 'eventbrite'
  | 'apify_instagram'
  | 'apify_tiktok'
  | 'sports';

export type ContentCategory = 
  | 'adult'
  | 'venue'
  | 'event'
  | 'sports'
  | 'lifestyle'
  | 'premium';

export interface FeedItem {
  id: string;
  source: ContentSource;
  category: ContentCategory;
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  
  // Ubicación (opcional)
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    venueName?: string;
    distance?: number; // km desde usuario
  };
  
  // Temporal
  createdAt: string;
  eventDate?: string; // Para eventos
  isToday?: boolean;
  
  // Engagement
  likes: number;
  saves: number;
  views: number;
  
  // Metadata
  externalUrl?: string;
  tags?: string[];
  isNSFW: boolean;
  isPremium: boolean;
  
  // Score calculado
  _score?: number;
}

export interface UserIntention {
  // Puntajes de intención (0-100)
  adultScore: number;
  eventScore: number;
  venueScore: number;
  sportsScore: number;
  
  // Historial de sesión
  totalLikes: number;
  totalScrollDepth: number;
  sessionDuration: number;
  
  // Categorías likeadas en esta sesión
  likedCategories: Record<ContentCategory, number>;
}

export interface UserContext {
  location: {
    latitude: number | null;
    longitude: number | null;
    isInPuertoVallarta: boolean;
    permissionGranted: boolean;
    lastUpdated: string | null;
  };
  
  temporal: {
    dayOfWeek: number;
    hourOfDay: number;
    isWeekend: boolean;
    isNightTime: boolean;
  };
  
  device: {
    isMobile: boolean;
    screenWidth: number;
  };
  
  preferences: {
    spicyMode: boolean;
    ageVerified: boolean;
    language: 'es' | 'en';
  };
}

export interface FeedDistribution {
  adult: number;
  venue: number;
  event: number;
  sports: number;
  premium: number;
}

export interface FeedMixerConfig {
  mode: FeedMode;
  distribution: FeedDistribution;
  userContext: UserContext;
  userIntention: UserIntention;
  maxAdultWithoutVerification: number;
  minDiversityRatio: number;
  localBoostMultiplier: number;
  todayEventBoost: number;
  weekendNightlifeBoost: number;
}

export interface LikeEvent {
  contentId: string;
  category: ContentCategory;
  source: ContentSource;
  timestamp: number;
  isNSFW: boolean;
}

export interface MixedFeed {
  items: FeedItem[];
  distribution: FeedDistribution;
  nextCursor?: string;
  debug?: {
    totalItems: number;
    byCategory: Record<ContentCategory, number>;
    appliedBoosts: string[];
  };
}
```

---

# 📄 ARCHIVO 2: lib/algorithm/intention-tracker.ts

```typescript
// lib/algorithm/intention-tracker.ts
// ============================================
// THE HIGHWAY: Sistema de Tracking de Intención
// Espía comportamental en tiempo real (sin login)
// ============================================

import { 
  UserIntention, 
  ContentCategory, 
  LikeEvent,
  FeedMode 
} from '@/types/feed';

const INTENTION_DECAY_RATE = 0.95;
const LIKE_WEIGHT = 10;
const SCROLL_WEIGHT = 0.5;
const MAX_SCORE = 100;
const MIN_SCORE = 0;
const STORAGE_KEY = 'venuz_intention';

export class IntentionTracker {
  private intention: UserIntention;
  private lastActivityTime: number;
  private listeners: Set<(intention: UserIntention) => void>;

  constructor() {
    this.intention = this.loadFromStorage() || this.getDefaultIntention();
    this.lastActivityTime = Date.now();
    this.listeners = new Set();
    
    if (typeof window !== 'undefined') {
      setInterval(() => this.applyDecay(), 30000);
    }
  }

  private getDefaultIntention(): UserIntention {
    return {
      adultScore: 50,
      eventScore: 50,
      venueScore: 50,
      sportsScore: 25,
      totalLikes: 0,
      totalScrollDepth: 0,
      sessionDuration: 0,
      likedCategories: {
        adult: 0,
        venue: 0,
        event: 0,
        sports: 0,
        lifestyle: 0,
        premium: 0,
      },
    };
  }

  private loadFromStorage(): UserIntention | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error loading intention from storage:', e);
    }
    return null;
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.intention));
    } catch (e) {
      console.warn('Error saving intention to storage:', e);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.intention));
  }

  subscribe(callback: (intention: UserIntention) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  recordLike(event: LikeEvent): void {
    this.lastActivityTime = Date.now();
    this.intention.totalLikes++;
    this.intention.likedCategories[event.category]++;
    
    switch (event.category) {
      case 'adult':
        this.intention.adultScore = this.clamp(this.intention.adultScore + LIKE_WEIGHT);
        this.intention.eventScore = this.clamp(this.intention.eventScore - LIKE_WEIGHT * 0.3);
        break;
      case 'event':
        this.intention.eventScore = this.clamp(this.intention.eventScore + LIKE_WEIGHT);
        this.intention.adultScore = this.clamp(this.intention.adultScore - LIKE_WEIGHT * 0.5);
        break;
      case 'venue':
        this.intention.venueScore = this.clamp(this.intention.venueScore + LIKE_WEIGHT);
        this.intention.eventScore = this.clamp(this.intention.eventScore + LIKE_WEIGHT * 0.3);
        break;
      case 'sports':
        this.intention.sportsScore = this.clamp(this.intention.sportsScore + LIKE_WEIGHT);
        this.intention.venueScore = this.clamp(this.intention.venueScore + LIKE_WEIGHT * 0.2);
        break;
      case 'premium':
        this.intention.adultScore = this.clamp(this.intention.adultScore + LIKE_WEIGHT * 0.5);
        this.intention.eventScore = this.clamp(this.intention.eventScore + LIKE_WEIGHT * 0.5);
        break;
    }
    
    this.saveToStorage();
    this.notifyListeners();
    
    console.log('[IntentionTracker] Like recorded:', {
      category: event.category,
      newScores: {
        adult: this.intention.adultScore,
        event: this.intention.eventScore,
        venue: this.intention.venueScore,
      }
    });
  }

  recordViewTime(category: ContentCategory, seconds: number): void {
    const points = seconds * SCROLL_WEIGHT;
    
    switch (category) {
      case 'adult':
        this.intention.adultScore = this.clamp(this.intention.adultScore + points);
        break;
      case 'event':
      case 'venue':
        this.intention.eventScore = this.clamp(this.intention.eventScore + points);
        this.intention.venueScore = this.clamp(this.intention.venueScore + points);
        break;
      case 'sports':
        this.intention.sportsScore = this.clamp(this.intention.sportsScore + points);
        break;
    }
    
    this.intention.totalScrollDepth++;
    this.saveToStorage();
  }

  private applyDecay(): void {
    const now = Date.now();
    const minutesInactive = (now - this.lastActivityTime) / 60000;
    
    if (minutesInactive > 1) {
      this.intention.adultScore = this.decayTowards(this.intention.adultScore, 50);
      this.intention.eventScore = this.decayTowards(this.intention.eventScore, 50);
      this.intention.venueScore = this.decayTowards(this.intention.venueScore, 50);
      this.intention.sportsScore = this.decayTowards(this.intention.sportsScore, 25);
      this.saveToStorage();
    }
  }

  private decayTowards(current: number, target: number): number {
    const diff = target - current;
    return current + diff * (1 - INTENTION_DECAY_RATE);
  }

  private clamp(value: number): number {
    return Math.max(MIN_SCORE, Math.min(MAX_SCORE, value));
  }

  getIntention(): UserIntention {
    return { ...this.intention };
  }

  getDominantMode(): FeedMode {
    const { adultScore, eventScore, venueScore } = this.intention;
    
    if (adultScore > 70 && adultScore > eventScore + 20) {
      return 'adult';
    }
    
    if (eventScore > 60 || venueScore > 60) {
      return 'events';
    }
    
    return 'mixed';
  }

  getRecommendedDistribution(): {
    adult: number;
    venue: number;
    event: number;
    sports: number;
    premium: number;
  } {
    const total = 
      this.intention.adultScore + 
      this.intention.eventScore + 
      this.intention.venueScore + 
      this.intention.sportsScore;
    
    if (total === 0) {
      return { adult: 40, venue: 25, event: 25, sports: 5, premium: 5 };
    }
    
    const adult = Math.round((this.intention.adultScore / total) * 100);
    const event = Math.round((this.intention.eventScore / total) * 100);
    const venue = Math.round((this.intention.venueScore / total) * 100);
    const sports = Math.round((this.intention.sportsScore / total) * 100);
    const premium = 10;
    
    const sum = adult + event + venue + sports + premium;
    const adjustment = (100 - sum) / 4;
    
    return {
      adult: Math.max(5, adult + adjustment),
      venue: Math.max(5, venue + adjustment),
      event: Math.max(5, event + adjustment),
      sports: Math.max(5, sports + adjustment),
      premium,
    };
  }

  reset(): void {
    this.intention = this.getDefaultIntention();
    this.saveToStorage();
    this.notifyListeners();
  }

  initializeWithMode(mode: FeedMode): void {
    switch (mode) {
      case 'adult':
        this.intention.adultScore = 80;
        this.intention.eventScore = 30;
        this.intention.venueScore = 30;
        break;
      case 'events':
        this.intention.adultScore = 20;
        this.intention.eventScore = 80;
        this.intention.venueScore = 70;
        break;
      case 'spicy':
        this.intention.adultScore = 90;
        this.intention.eventScore = 40;
        this.intention.venueScore = 40;
        break;
      case 'mixed':
      default:
        break;
    }
    
    this.saveToStorage();
    this.notifyListeners();
  }
}

let trackerInstance: IntentionTracker | null = null;

export function getIntentionTracker(): IntentionTracker {
  if (!trackerInstance) {
    trackerInstance = new IntentionTracker();
  }
  return trackerInstance;
}
```

---

# 📄 ARCHIVO 3: lib/feed/feed-mixer.ts

```typescript
// lib/feed/feed-mixer.ts
// ============================================
// THE HIGHWAY: FeedMixer
// El algoritmo que mezcla contenido según intención
// ============================================

import {
  FeedItem,
  FeedMode,
  FeedDistribution,
  UserContext,
  UserIntention,
  MixedFeed,
  ContentCategory,
  FeedMixerConfig,
} from '@/types/feed';

const BASE_DISTRIBUTIONS: Record<FeedMode, FeedDistribution> = {
  adult: {
    adult: 70,
    venue: 10,
    event: 10,
    sports: 5,
    premium: 5,
  },
  events: {
    adult: 10,
    venue: 40,
    event: 40,
    sports: 5,
    premium: 5,
  },
  mixed: {
    adult: 40,
    venue: 25,
    event: 20,
    sports: 10,
    premium: 5,
  },
  spicy: {
    adult: 60,
    venue: 15,
    event: 10,
    sports: 5,
    premium: 10,
  },
};

const PV_BOUNDS = {
  north: 20.75,
  south: 20.55,
  east: -105.15,
  west: -105.35,
};

export class FeedMixer {
  private config: FeedMixerConfig;
  
  constructor(config: Partial<FeedMixerConfig> = {}) {
    this.config = {
      mode: config.mode || 'mixed',
      distribution: config.distribution || BASE_DISTRIBUTIONS.mixed,
      userContext: config.userContext || this.getDefaultContext(),
      userIntention: config.userIntention || this.getDefaultIntention(),
      maxAdultWithoutVerification: config.maxAdultWithoutVerification || 30,
      minDiversityRatio: config.minDiversityRatio || 0.1,
      localBoostMultiplier: config.localBoostMultiplier || 2.5,
      todayEventBoost: config.todayEventBoost || 3.0,
      weekendNightlifeBoost: config.weekendNightlifeBoost || 1.5,
    };
  }

  private getDefaultContext(): UserContext {
    return {
      location: {
        latitude: null,
        longitude: null,
        isInPuertoVallarta: false,
        permissionGranted: false,
        lastUpdated: null,
      },
      temporal: {
        dayOfWeek: new Date().getDay(),
        hourOfDay: new Date().getHours(),
        isWeekend: [0, 5, 6].includes(new Date().getDay()),
        isNightTime: this.isNightTime(),
      },
      device: {
        isMobile: typeof window !== 'undefined' && window.innerWidth < 768,
        screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
      },
      preferences: {
        spicyMode: false,
        ageVerified: false,
        language: 'es',
      },
    };
  }

  private getDefaultIntention(): UserIntention {
    return {
      adultScore: 50,
      eventScore: 50,
      venueScore: 50,
      sportsScore: 25,
      totalLikes: 0,
      totalScrollDepth: 0,
      sessionDuration: 0,
      likedCategories: {
        adult: 0,
        venue: 0,
        event: 0,
        sports: 0,
        lifestyle: 0,
        premium: 0,
      },
    };
  }

  private isNightTime(): boolean {
    const hour = new Date().getHours();
    return hour >= 20 || hour <= 4;
  }

  setMode(mode: FeedMode): void {
    this.config.mode = mode;
    this.config.distribution = { ...BASE_DISTRIBUTIONS[mode] };
  }

  updateContext(context: Partial<UserContext>): void {
    this.config.userContext = { ...this.config.userContext, ...context };
    
    if (context.location?.latitude && context.location?.longitude) {
      this.config.userContext.location.isInPuertoVallarta = this.isInPuertoVallarta(
        context.location.latitude,
        context.location.longitude
      );
    }
  }

  updateIntention(intention: UserIntention): void {
    this.config.userIntention = intention;
    this.recalculateDistribution();
  }

  private isInPuertoVallarta(lat: number, lng: number): boolean {
    return (
      lat <= PV_BOUNDS.north &&
      lat >= PV_BOUNDS.south &&
      lng <= PV_BOUNDS.east &&
      lng >= PV_BOUNDS.west
    );
  }

  private recalculateDistribution(): void {
    const intention = this.config.userIntention;
    const baseDistribution = BASE_DISTRIBUTIONS[this.config.mode];
    
    const totalLikedCategories = Object.values(intention.likedCategories)
      .reduce((a, b) => a + b, 0);
    
    if (totalLikedCategories === 0) {
      this.config.distribution = { ...baseDistribution };
      return;
    }
    
    const behaviorWeight = Math.min(0.5, totalLikedCategories * 0.05);
    const baseWeight = 1 - behaviorWeight;
    
    const newDistribution: FeedDistribution = {
      adult: Math.round(
        baseDistribution.adult * baseWeight +
        (intention.adultScore * behaviorWeight)
      ),
      venue: Math.round(
        baseDistribution.venue * baseWeight +
        (intention.venueScore * behaviorWeight)
      ),
      event: Math.round(
        baseDistribution.event * baseWeight +
        (intention.eventScore * behaviorWeight)
      ),
      sports: Math.round(
        baseDistribution.sports * baseWeight +
        (intention.sportsScore * 0.5 * behaviorWeight)
      ),
      premium: baseDistribution.premium,
    };
    
    const total = Object.values(newDistribution).reduce((a, b) => a + b, 0);
    if (total !== 100) {
      const factor = 100 / total;
      Object.keys(newDistribution).forEach(key => {
        newDistribution[key as keyof FeedDistribution] = Math.round(
          newDistribution[key as keyof FeedDistribution] * factor
        );
      });
    }
    
    if (!this.config.userContext.preferences.ageVerified) {
      if (newDistribution.adult > this.config.maxAdultWithoutVerification) {
        const excess = newDistribution.adult - this.config.maxAdultWithoutVerification;
        newDistribution.adult = this.config.maxAdultWithoutVerification;
        newDistribution.venue += Math.round(excess / 2);
        newDistribution.event += Math.round(excess / 2);
      }
    }
    
    this.config.distribution = newDistribution;
  }

  private calculateItemScore(item: FeedItem): number {
    let score = 50;
    const ctx = this.config.userContext;
    const intention = this.config.userIntention;
    
    if (ctx.location.isInPuertoVallarta && item.location) {
      const distance = this.calculateDistance(
        ctx.location.latitude!,
        ctx.location.longitude!,
        item.location.latitude,
        item.location.longitude
      );
      
      if (distance < 0.5) score += 40 * this.config.localBoostMultiplier;
      else if (distance < 1) score += 30 * this.config.localBoostMultiplier;
      else if (distance < 2) score += 20 * this.config.localBoostMultiplier;
      else if (distance < 5) score += 10;
    }
    
    const hoursOld = (Date.now() - new Date(item.createdAt).getTime()) / 3600000;
    if (hoursOld < 6) score += 30;
    else if (hoursOld < 24) score += 20;
    else if (hoursOld < 72) score += 10;
    
    if (item.isToday || item.eventDate === new Date().toISOString().split('T')[0]) {
      score *= this.config.todayEventBoost;
    }
    
    if (ctx.temporal.isWeekend && ctx.temporal.isNightTime) {
      if (item.category === 'venue' || item.category === 'event') {
        score *= this.config.weekendNightlifeBoost;
      }
    }
    
    score += Math.min(20, item.likes / 10);
    
    const categoryScore = intention.likedCategories[item.category] || 0;
    score += categoryScore * 2;
    
    if (item.isPremium) {
      score += 15;
    }
    
    return score;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  mix(items: FeedItem[]): MixedFeed {
    const distribution = this.config.distribution;
    const totalItems = items.length;
    
    const buckets: Record<ContentCategory, FeedItem[]> = {
      adult: [],
      venue: [],
      event: [],
      sports: [],
      lifestyle: [],
      premium: [],
    };
    
    items.forEach(item => {
      buckets[item.category].push(item);
    });
    
    Object.values(buckets).forEach(bucket => {
      bucket.forEach(item => {
        item._score = this.calculateItemScore(item);
      });
      bucket.sort((a, b) => (b._score || 0) - (a._score || 0));
    });
    
    const targetCounts: Record<ContentCategory, number> = {
      adult: Math.round((distribution.adult / 100) * totalItems),
      venue: Math.round((distribution.venue / 100) * totalItems),
      event: Math.round((distribution.event / 100) * totalItems),
      sports: Math.round((distribution.sports / 100) * totalItems),
      lifestyle: 0,
      premium: Math.round((distribution.premium / 100) * totalItems),
    };
    
    const selectedItems: FeedItem[] = [];
    const appliedBoosts: string[] = [];
    
    Object.entries(targetCounts).forEach(([category, count]) => {
      const bucket = buckets[category as ContentCategory];
      const selected = bucket.slice(0, count);
      selectedItems.push(...selected);
      
      if (selected.length > 0) {
        appliedBoosts.push(`${category}: ${selected.length}/${count} items`);
      }
    });
    
    const mixedItems = this.intelligentShuffle(selectedItems);
    
    if (this.config.userContext.location.isInPuertoVallarta) {
      this.injectLocalContent(mixedItems, buckets.venue, buckets.event);
      appliedBoosts.push('LOCAL_INJECTION: Inyectando contenido cercano');
    }
    
    return {
      items: mixedItems,
      distribution,
      debug: {
        totalItems: mixedItems.length,
        byCategory: this.countByCategory(mixedItems),
        appliedBoosts,
      },
    };
  }

  private intelligentShuffle(items: FeedItem[]): FeedItem[] {
    const shuffled: FeedItem[] = [];
    const remaining = [...items];
    let lastCategory: ContentCategory | null = null;
    
    while (remaining.length > 0) {
      let selectedIndex = -1;
      
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].category !== lastCategory) {
          selectedIndex = i;
          break;
        }
      }
      
      if (selectedIndex === -1) {
        selectedIndex = 0;
      }
      
      const selected = remaining.splice(selectedIndex, 1)[0];
      shuffled.push(selected);
      lastCategory = selected.category;
    }
    
    return shuffled;
  }

  private injectLocalContent(
    mixedItems: FeedItem[],
    venues: FeedItem[],
    events: FeedItem[]
  ): void {
    const localContent = [...venues, ...events]
      .filter(item => item.location)
      .sort((a, b) => (b._score || 0) - (a._score || 0));
    
    if (localContent.length === 0) return;
    
    const injectionInterval = 5;
    let localIndex = 0;
    
    for (let i = injectionInterval; i < mixedItems.length; i += injectionInterval + 1) {
      if (localIndex < localContent.length) {
        const localItem = localContent[localIndex];
        if (!mixedItems.find(m => m.id === localItem.id)) {
          mixedItems.splice(i, 0, localItem);
          localIndex++;
        }
      }
    }
  }

  private countByCategory(items: FeedItem[]): Record<ContentCategory, number> {
    const counts: Record<ContentCategory, number> = {
      adult: 0,
      venue: 0,
      event: 0,
      sports: 0,
      lifestyle: 0,
      premium: 0,
    };
    
    items.forEach(item => {
      counts[item.category]++;
    });
    
    return counts;
  }

  getDistribution(): FeedDistribution {
    return { ...this.config.distribution };
  }

  getConfig(): FeedMixerConfig {
    return { ...this.config };
  }
}

export function createFeedMixer(
  mode: FeedMode = 'mixed',
  userContext?: Partial<UserContext>,
  userIntention?: UserIntention
): FeedMixer {
  const mixer = new FeedMixer({
    mode,
    userContext: userContext as UserContext,
    userIntention,
  });
  
  return mixer;
}
```

---

# 📄 ARCHIVO 4: lib/hooks/use-feed-mixer.ts

```typescript
// lib/hooks/use-feed-mixer.ts
// ============================================
// THE HIGHWAY: Hook de React para el FeedMixer
// ============================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FeedMixer, createFeedMixer } from '@/lib/feed/feed-mixer';
import { 
  getIntentionTracker, 
  IntentionTracker 
} from '@/lib/algorithm/intention-tracker';
import {
  FeedItem,
  FeedMode,
  FeedDistribution,
  UserContext,
  UserIntention,
  MixedFeed,
  ContentCategory,
  LikeEvent,
} from '@/types/feed';

interface UseFeedMixerOptions {
  initialMode?: FeedMode;
  autoRequestLocation?: boolean;
  debug?: boolean;
}

interface UseFeedMixerReturn {
  mixedFeed: MixedFeed | null;
  distribution: FeedDistribution;
  mode: FeedMode;
  isLoading: boolean;
  userContext: UserContext;
  userIntention: UserIntention;
  mixFeed: (items: FeedItem[]) => MixedFeed;
  recordLike: (item: FeedItem) => void;
  setMode: (mode: FeedMode) => void;
  requestLocation: () => Promise<void>;
  toggleSpicyMode: () => void;
  debugInfo: {
    lastMixTime: number;
    totalMixes: number;
    appliedBoosts: string[];
  } | null;
}

export function useFeedMixer(
  options: UseFeedMixerOptions = {}
): UseFeedMixerReturn {
  const {
    initialMode = 'mixed',
    autoRequestLocation = false,
    debug = false,
  } = options;

  const mixerRef = useRef<FeedMixer | null>(null);
  const trackerRef = useRef<IntentionTracker | null>(null);

  const [mixedFeed, setMixedFeed] = useState<MixedFeed | null>(null);
  const [distribution, setDistribution] = useState<FeedDistribution>({
    adult: 40,
    venue: 25,
    event: 20,
    sports: 10,
    premium: 5,
  });
  const [mode, setModeState] = useState<FeedMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext>({
    location: {
      latitude: null,
      longitude: null,
      isInPuertoVallarta: false,
      permissionGranted: false,
      lastUpdated: null,
    },
    temporal: {
      dayOfWeek: new Date().getDay(),
      hourOfDay: new Date().getHours(),
      isWeekend: [0, 5, 6].includes(new Date().getDay()),
      isNightTime: new Date().getHours() >= 20 || new Date().getHours() <= 4,
    },
    device: {
      isMobile: false,
      screenWidth: 1024,
    },
    preferences: {
      spicyMode: false,
      ageVerified: false,
      language: 'es',
    },
  });
  const [userIntention, setUserIntention] = useState<UserIntention>({
    adultScore: 50,
    eventScore: 50,
    venueScore: 50,
    sportsScore: 25,
    totalLikes: 0,
    totalScrollDepth: 0,
    sessionDuration: 0,
    likedCategories: {
      adult: 0,
      venue: 0,
      event: 0,
      sports: 0,
      lifestyle: 0,
      premium: 0,
    },
  });
  const [debugInfo, setDebugInfo] = useState<{
    lastMixTime: number;
    totalMixes: number;
    appliedBoosts: string[];
  } | null>(debug ? { lastMixTime: 0, totalMixes: 0, appliedBoosts: [] } : null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    trackerRef.current = getIntentionTracker();
    
    const urlParams = new URLSearchParams(window.location.search);
    const urlMode = urlParams.get('mode') as FeedMode | null;
    const effectiveMode = urlMode || initialMode;
    
    trackerRef.current.initializeWithMode(effectiveMode);
    mixerRef.current = createFeedMixer(effectiveMode);
    
    const unsubscribe = trackerRef.current.subscribe((intention) => {
      setUserIntention(intention);
      
      if (mixerRef.current) {
        mixerRef.current.updateIntention(intention);
        setDistribution(mixerRef.current.getDistribution());
      }
    });
    
    setUserContext(prev => ({
      ...prev,
      device: {
        isMobile: window.innerWidth < 768,
        screenWidth: window.innerWidth,
      },
    }));
    
    if (autoRequestLocation) {
      requestLocationInternal();
    }
    
    setModeState(effectiveMode);
    
    return () => {
      unsubscribe();
    };
  }, [initialMode, autoRequestLocation]);

  const requestLocationInternal = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      console.warn('Geolocation not available');
      return;
    }
    
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          const newLocation = {
            latitude,
            longitude,
            isInPuertoVallarta: isInPuertoVallarta(latitude, longitude),
            permissionGranted: true,
            lastUpdated: new Date().toISOString(),
          };
          
          setUserContext(prev => ({
            ...prev,
            location: newLocation,
          }));
          
          if (mixerRef.current) {
            mixerRef.current.updateContext({ location: newLocation });
            setDistribution(mixerRef.current.getDistribution());
          }
          
          if (debug) {
            console.log('[FeedMixer] Location updated:', newLocation);
          }
          
          resolve();
        },
        (error) => {
          console.warn('Error getting location:', error);
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  };

  const isInPuertoVallarta = (lat: number, lng: number): boolean => {
    return (
      lat <= 20.75 &&
      lat >= 20.55 &&
      lng <= -105.15 &&
      lng >= -105.35
    );
  };

  const mixFeed = useCallback((items: FeedItem[]): MixedFeed => {
    if (!mixerRef.current) {
      mixerRef.current = createFeedMixer(mode);
    }
    
    const startTime = performance.now();
    const result = mixerRef.current.mix(items);
    const endTime = performance.now();
    
    setMixedFeed(result);
    setDistribution(result.distribution);
    
    if (debug) {
      setDebugInfo(prev => ({
        lastMixTime: endTime - startTime,
        totalMixes: (prev?.totalMixes || 0) + 1,
        appliedBoosts: result.debug?.appliedBoosts || [],
      }));
      
      console.log('[FeedMixer] Mixed feed:', {
        inputItems: items.length,
        outputItems: result.items.length,
        distribution: result.distribution,
        mixTime: `${(endTime - startTime).toFixed(2)}ms`,
      });
    }
    
    return result;
  }, [mode, debug]);

  const recordLike = useCallback((item: FeedItem) => {
    if (!trackerRef.current) return;
    
    const likeEvent: LikeEvent = {
      contentId: item.id,
      category: item.category,
      source: item.source,
      timestamp: Date.now(),
      isNSFW: item.isNSFW,
    };
    
    trackerRef.current.recordLike(likeEvent);
    
    if (debug) {
      console.log('[FeedMixer] Like recorded:', likeEvent);
    }
  }, [debug]);

  const setMode = useCallback((newMode: FeedMode) => {
    setModeState(newMode);
    
    if (mixerRef.current) {
      mixerRef.current.setMode(newMode);
      setDistribution(mixerRef.current.getDistribution());
    }
    
    if (trackerRef.current) {
      trackerRef.current.initializeWithMode(newMode);
    }
    
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', newMode);
      window.history.replaceState({}, '', url.toString());
    }
    
    if (debug) {
      console.log('[FeedMixer] Mode changed to:', newMode);
    }
  }, [debug]);

  const toggleSpicyMode = useCallback(() => {
    setUserContext(prev => {
      const newSpicy = !prev.preferences.spicyMode;
      
      if (mixerRef.current) {
        mixerRef.current.updateContext({
          ...prev,
          preferences: {
            ...prev.preferences,
            spicyMode: newSpicy,
          },
        });
        
        if (newSpicy) {
          setMode('spicy');
        } else {
          setMode('mixed');
        }
      }
      
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          spicyMode: newSpicy,
        },
      };
    });
  }, [setMode]);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    await requestLocationInternal();
    setIsLoading(false);
  }, []);

  return {
    mixedFeed,
    distribution,
    mode,
    isLoading,
    userContext,
    userIntention,
    mixFeed,
    recordLike,
    setMode,
    requestLocation,
    toggleSpicyMode,
    debugInfo,
  };
}

export function useLikeTracker() {
  const trackerRef = useRef<IntentionTracker | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      trackerRef.current = getIntentionTracker();
    }
  }, []);
  
  const recordLike = useCallback((
    contentId: string,
    category: ContentCategory,
    isNSFW: boolean = false
  ) => {
    if (!trackerRef.current) return;
    
    trackerRef.current.recordLike({
      contentId,
      category,
      source: 'reddit',
      timestamp: Date.now(),
      isNSFW,
    });
  }, []);
  
  return { recordLike };
}
```

---

# 📄 ARCHIVO 5: components/ui/like-button.tsx

```typescript
// components/ui/like-button.tsx
// ============================================
// THE HIGHWAY: Botón de Like "Juicy" con Animación Explosiva
// ============================================

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLikeTracker } from '@/lib/hooks/use-feed-mixer';
import { ContentCategory } from '@/types/feed';

interface LikeButtonProps {
  contentId: string;
  category: ContentCategory;
  initialLiked?: boolean;
  initialCount?: number;
  isNSFW?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'minimal' | 'floating';
  showCount?: boolean;
  onLike?: (liked: boolean) => void;
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
}

const PARTICLE_COLORS = [
  '#FF1493',
  '#FF69B4',
  '#FFB6C1',
  '#FF6B6B',
  '#FFA500',
  '#FFD700',
];

const SIZE_CONFIG = {
  sm: { button: 'w-8 h-8', icon: 16, particles: 6 },
  md: { button: 'w-10 h-10', icon: 20, particles: 8 },
  lg: { button: 'w-14 h-14', icon: 28, particles: 12 },
  xl: { button: 'w-20 h-20', icon: 40, particles: 16 },
};

export function LikeButton({
  contentId,
  category,
  initialLiked = false,
  initialCount = 0,
  isNSFW = false,
  size = 'lg',
  variant = 'default',
  showCount = true,
  onLike,
  className,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const { recordLike } = useLikeTracker();
  const config = SIZE_CONFIG[size];

  const generateParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const particleCount = config.particles;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (360 / particleCount) * i;
      const distance = 30 + Math.random() * 40;
      
      newParticles.push({
        id: i,
        x: Math.cos((angle * Math.PI) / 180) * distance,
        y: Math.sin((angle * Math.PI) / 180) * distance,
        scale: 0.4 + Math.random() * 0.6,
        rotation: Math.random() * 360,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      });
    }
    
    return newParticles;
  }, [config.particles]);

  const handleClick = useCallback(() => {
    const newLiked = !liked;
    setLiked(newLiked);
    setCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    
    if (newLiked) {
      setIsAnimating(true);
      setParticles(generateParticles());
      recordLike(contentId, category, isNSFW);
      
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      setTimeout(() => {
        setParticles([]);
        setIsAnimating(false);
      }, 700);
    }
    
    onLike?.(newLiked);
  }, [liked, contentId, category, isNSFW, generateParticles, recordLike, onLike]);

  const buttonStyles = {
    default: cn(
      'relative flex items-center justify-center rounded-full',
      'bg-black/60 backdrop-blur-sm border-2',
      'transition-all duration-200 ease-out',
      'hover:scale-110 active:scale-95',
      'focus:outline-none focus:ring-2 focus:ring-pink-500/50',
      liked 
        ? 'border-pink-500 shadow-lg shadow-pink-500/30' 
        : 'border-white/20 hover:border-white/40',
      config.button
    ),
    minimal: cn(
      'relative flex items-center justify-center',
      'transition-all duration-200 ease-out',
      'hover:scale-125 active:scale-90',
      config.button
    ),
    floating: cn(
      'relative flex items-center justify-center rounded-full',
      'bg-gradient-to-br from-pink-500 to-orange-500',
      'shadow-xl shadow-pink-500/40',
      'transition-all duration-200 ease-out',
      'hover:scale-110 hover:shadow-2xl hover:shadow-pink-500/50',
      'active:scale-95',
      config.button
    ),
  };

  return (
    <div className={cn('relative inline-flex flex-col items-center gap-1', className)}>
      <motion.button
        ref={buttonRef}
        onClick={handleClick}
        className={buttonStyles[variant]}
        whileTap={{ scale: 0.9 }}
        aria-label={liked ? 'Unlike' : 'Like'}
      >
        <motion.div
          animate={isAnimating ? {
            scale: [1, 1.5, 0.8, 1.2, 1],
            rotate: [0, -10, 10, -5, 0],
          } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Heart
            size={config.icon}
            className={cn(
              'transition-all duration-200',
              liked 
                ? 'fill-pink-500 text-pink-500 drop-shadow-glow' 
                : 'text-white/80'
            )}
            strokeWidth={liked ? 0 : 2}
          />
        </motion.div>

        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute pointer-events-none"
              initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
              animate={{ 
                x: particle.x, 
                y: particle.y, 
                scale: particle.scale, 
                opacity: 0,
                rotate: particle.rotation 
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Heart
                size={config.icon * 0.4}
                style={{ color: particle.color, fill: particle.color }}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {liked && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-pink-500"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6, repeat: 0 }}
          />
        )}
      </motion.button>

      {showCount && (
        <motion.span
          key={count}
          initial={{ y: -5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            'text-xs font-medium tabular-nums',
            liked ? 'text-pink-400' : 'text-white/60'
          )}
        >
          {formatCount(count)}
        </motion.span>
      )}
    </div>
  );
}

function formatCount(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 10000) return `${(num / 1000).toFixed(1)}k`;
  if (num < 1000000) return `${Math.floor(num / 1000)}k`;
  return `${(num / 1000000).toFixed(1)}M`;
}

export function DoubleTapLike({
  contentId,
  category,
  isNSFW = false,
  children,
  onLike,
}: {
  contentId: string;
  category: ContentCategory;
  isNSFW?: boolean;
  children: React.ReactNode;
  onLike?: () => void;
}) {
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);
  const { recordLike } = useLikeTracker();

  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      setShowHeart(true);
      recordLike(contentId, category, isNSFW);
      onLike?.();
      
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
      
      setTimeout(() => setShowHeart(false), 1000);
    }
    
    lastTap.current = now;
  }, [contentId, category, isNSFW, recordLike, onLike]);

  return (
    <div className="relative cursor-pointer select-none" onClick={handleTap}>
      {children}
      
      <AnimatePresence>
        {showHeart && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Heart size={80} className="fill-white text-white drop-shadow-2xl" strokeWidth={0} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// CSS para globals.css:
// .drop-shadow-glow { filter: drop-shadow(0 0 8px rgb(236 72 153 / 0.7)); }
```

---

# 📄 ARCHIVO 6: components/feed/feed-card.tsx

```typescript
// components/feed/feed-card.tsx
// ============================================
// THE HIGHWAY: Card de Feed con Like Integrado
// ============================================

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Share2, 
  Bookmark,
  ExternalLink,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LikeButton, DoubleTapLike } from '@/components/ui/like-button';
import { FeedItem, ContentCategory } from '@/types/feed';

interface FeedCardProps {
  item: FeedItem;
  index?: number;
  onView?: (item: FeedItem, viewTime: number) => void;
  onLike?: (item: FeedItem) => void;
  onSave?: (item: FeedItem) => void;
  className?: string;
}

const CATEGORY_COLORS: Record<ContentCategory, string> = {
  adult: 'from-pink-600 to-rose-700',
  venue: 'from-purple-600 to-indigo-700',
  event: 'from-orange-500 to-amber-600',
  sports: 'from-green-600 to-emerald-700',
  lifestyle: 'from-blue-500 to-cyan-600',
  premium: 'from-yellow-500 to-orange-500',
};

const CATEGORY_BADGES: Record<ContentCategory, string> = {
  adult: '🔥 Hot',
  venue: '📍 Venue',
  event: '🎉 Evento',
  sports: '⚽ Sports',
  lifestyle: '✨ Lifestyle',
  premium: '💎 Premium',
};

export function FeedCard({
  item,
  index = 0,
  onView,
  onLike,
  onSave,
  className,
}: FeedCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const viewStartTime = useRef<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            viewStartTime.current = Date.now();
          } else if (viewStartTime.current) {
            const viewTime = (Date.now() - viewStartTime.current) / 1000;
            onView?.(item, viewTime);
            viewStartTime.current = null;
          }
        });
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [item, onView]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: item.externalUrl || window.location.href,
        });
      } catch (e) {}
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.(item);
  };

  const handleLike = () => {
    onLike?.(item);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={cn(
        'relative w-full bg-black rounded-2xl overflow-hidden',
        'border border-white/10',
        'shadow-xl shadow-black/50',
        className
      )}
    >
      <DoubleTapLike
        contentId={item.id}
        category={item.category}
        isNSFW={item.isNSFW}
        onLike={handleLike}
      >
        <div className="relative aspect-[9/16] md:aspect-video w-full overflow-hidden">
          {item.videoUrl ? (
            <div className="relative w-full h-full">
              <video
                src={item.videoUrl}
                poster={item.thumbnailUrl || item.imageUrl}
                className="w-full h-full object-cover"
                loop
                muted
                playsInline
                autoPlay={isPlaying}
              />
              {!isPlaying && (
                <button
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30"
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                  </div>
                </button>
              )}
            </div>
          ) : (
            <img
              src={item.imageUrl || '/placeholder-venue.jpg'}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

          <div className="absolute top-3 left-3">
            <span className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold',
              'bg-gradient-to-r text-white shadow-lg',
              CATEGORY_COLORS[item.category]
            )}>
              {CATEGORY_BADGES[item.category]}
            </span>
          </div>

          {item.isPremium && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 rounded bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold">
                VIP
              </span>
            </div>
          )}

          {item.location?.distance && (
            <div className="absolute top-12 left-3">
              <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {item.location.distance < 1 
                  ? `${Math.round(item.location.distance * 1000)}m` 
                  : `${item.location.distance.toFixed(1)}km`
                }
              </span>
            </div>
          )}

          <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4">
            <LikeButton
              contentId={item.id}
              category={item.category}
              initialCount={item.likes}
              isNSFW={item.isNSFW}
              size="xl"
              variant="default"
              onLike={handleLike}
            />

            <button
              onClick={handleSave}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                'bg-black/60 backdrop-blur-sm border border-white/20',
                'transition-all hover:scale-110',
                isSaved && 'border-yellow-500 bg-yellow-500/20'
              )}
            >
              <Bookmark 
                className={cn(
                  'w-6 h-6',
                  isSaved ? 'fill-yellow-500 text-yellow-500' : 'text-white'
                )} 
              />
            </button>

            <button
              onClick={handleShare}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-sm border border-white/20 transition-all hover:scale-110"
            >
              <Share2 className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </DoubleTapLike>

      <div className="p-4 space-y-3">
        <h3 className="text-lg font-bold text-white line-clamp-2">
          {item.title}
        </h3>

        {item.description && (
          <p className="text-sm text-white/70 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
          {item.location?.venueName && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {item.location.venueName}
            </span>
          )}

          {item.eventDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatEventDate(item.eventDate)}
            </span>
          )}

          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(item.createdAt)}
          </span>
        </div>

        {item.externalUrl && (
          <a
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full',
              'bg-gradient-to-r text-white text-sm font-medium',
              'transition-all hover:scale-105 hover:shadow-lg',
              CATEGORY_COLORS[item.category]
            )}
          >
            Ver más
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === tomorrow.toDateString()) return 'Mañana';

  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'ahora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  
  return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}

export function FeedGrid({
  items,
  onView,
  onLike,
  onSave,
}: {
  items: FeedItem[];
  onView?: (item: FeedItem, viewTime: number) => void;
  onLike?: (item: FeedItem) => void;
  onSave?: (item: FeedItem) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {items.map((item, index) => (
        <FeedCard
          key={item.id}
          item={item}
          index={index}
          onView={onView}
          onLike={onLike}
          onSave={onSave}
        />
      ))}
    </div>
  );
}

export function FeedScroll({
  items,
  onView,
  onLike,
  onSave,
  onLoadMore,
  hasMore = true,
}: {
  items: FeedItem[];
  onView?: (item: FeedItem, viewTime: number) => void;
  onLike?: (item: FeedItem) => void;
  onSave?: (item: FeedItem) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  return (
    <div className="snap-y snap-mandatory h-screen overflow-y-scroll scrollbar-hide">
      {items.map((item, index) => (
        <div key={item.id} className="snap-start h-screen">
          <FeedCard
            item={item}
            index={index}
            onView={onView}
            onLike={onLike}
            onSave={onSave}
            className="h-full rounded-none"
          />
        </div>
      ))}
      
      {hasMore && (
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
```

---

# 📄 ARCHIVO 7: app/feed/page.tsx

```typescript
// app/feed/page.tsx
// ============================================
// THE HIGHWAY: Página Principal del Feed Camaleónico
// Acepta ?mode=adult o ?mode=events desde URL
// ============================================

'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Calendar, 
  Settings2,
  RefreshCw,
  Wifi,
  WifiOff,
  Grid3X3,
  Rows3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeedMixer } from '@/lib/hooks/use-feed-mixer';
import { FeedScroll, FeedGrid } from '@/components/feed/feed-card';
import { FeedItem, FeedMode } from '@/types/feed';

async function fetchFeedItems(): Promise<FeedItem[]> {
  const response = await fetch('/api/feed');
  if (!response.ok) throw new Error('Failed to fetch feed');
  return response.json();
}

function FeedPageContent() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get('mode') as FeedMode) || 'mixed';
  
  const {
    mixedFeed,
    distribution,
    mode,
    userContext,
    userIntention,
    mixFeed,
    recordLike,
    setMode,
    requestLocation,
    toggleSpicyMode,
    debugInfo,
  } = useFeedMixer({
    initialMode,
    autoRequestLocation: true,
    debug: process.env.NODE_ENV === 'development',
  });

  const [rawItems, setRawItems] = useState<FeedItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'scroll' | 'grid'>('scroll');
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    if (rawItems.length > 0) {
      mixFeed(rawItems);
    }
  }, [mode, userIntention.totalLikes]);

  const loadFeed = async () => {
    setIsRefreshing(true);
    try {
      const items = await fetchFeedItems();
      setRawItems(items);
      mixFeed(items);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLike = useCallback((item: FeedItem) => {
    recordLike(item);
  }, [recordLike]);

  const LocationBadge = () => (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
      userContext.location.isInPuertoVallarta
        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
        : 'bg-white/10 text-white/60 border border-white/20'
    )}>
      {userContext.location.permissionGranted ? (
        <>
          <Wifi className="w-3 h-3" />
          {userContext.location.isInPuertoVallarta ? '📍 En PV' : '🌎 Remoto'}
        </>
      ) : (
        <button onClick={requestLocation} className="flex items-center gap-1">
          <WifiOff className="w-3 h-3" />
          Activar GPS
        </button>
      )}
    </div>
  );

  const ModeSelector = () => (
    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-full">
      {[
        { m: 'mixed' as FeedMode, icon: RefreshCw, label: 'Mix' },
        { m: 'adult' as FeedMode, icon: Flame, label: '🔥 Hot' },
        { m: 'events' as FeedMode, icon: Calendar, label: '🎉 Events' },
      ].map(({ m, icon: Icon, label }) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all',
            mode === m
              ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );

  const DistributionBar = () => (
    <div className="space-y-1">
      <div className="w-full h-2 rounded-full overflow-hidden flex">
        <div className="h-full bg-pink-500" style={{ width: `${distribution.adult}%` }} />
        <div className="h-full bg-purple-500" style={{ width: `${distribution.venue}%` }} />
        <div className="h-full bg-orange-500" style={{ width: `${distribution.event}%` }} />
        <div className="h-full bg-green-500" style={{ width: `${distribution.sports}%` }} />
        <div className="h-full bg-yellow-500" style={{ width: `${distribution.premium}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-white/40">
        <span>🔥{distribution.adult}%</span>
        <span>📍{distribution.venue}%</span>
        <span>🎉{distribution.event}%</span>
        <span>⚽{distribution.sports}%</span>
        <span>💎{distribution.premium}%</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black via-black/90 to-transparent pb-4">
        <div className="container mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
              VENUZ
            </h1>
            <div className="flex items-center gap-2">
              <LocationBadge />
              <button
                onClick={toggleSpicyMode}
                className={cn(
                  'p-2.5 rounded-full transition-all',
                  userContext.preferences.spicyMode
                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50 animate-pulse'
                    : 'bg-white/10 text-white/60'
                )}
              >
                <Flame className="w-5 h-5" />
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="p-2 rounded-full bg-white/10 text-white/60"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <ModeSelector />
            <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
              <button
                onClick={() => setViewMode('scroll')}
                className={cn(
                  'p-2 rounded-full transition-all',
                  viewMode === 'scroll' ? 'bg-white/20 text-white' : 'text-white/40'
                )}
              >
                <Rows3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-full transition-all',
                  viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/40'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <DistributionBar />
        </div>
      </header>

      <AnimatePresence>
        {showDebug && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-40 z-40 w-64 bg-black/95 border border-pink-500/30 rounded-l-xl p-4 text-xs space-y-2"
          >
            <h3 className="font-bold text-pink-400">🔧 Debug</h3>
            <div className="text-white/70 space-y-1">
              <p>Mode: <span className="text-pink-400">{mode}</span></p>
              <p>Items: {mixedFeed?.items.length || 0}</p>
              <p>Likes: {userIntention.totalLikes}</p>
              <hr className="border-white/10 my-2" />
              <p className="text-white">Intention Scores:</p>
              <p>Adult: {userIntention.adultScore.toFixed(0)}</p>
              <p>Event: {userIntention.eventScore.toFixed(0)}</p>
              <p>Venue: {userIntention.venueScore.toFixed(0)}</p>
              <hr className="border-white/10 my-2" />
              <p>In PV: {userContext.location.isInPuertoVallarta ? '✅' : '❌'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-40">
        {isRefreshing && !mixedFeed ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mixedFeed && mixedFeed.items.length > 0 ? (
          viewMode === 'scroll' ? (
            <FeedScroll
              items={mixedFeed.items}
              onLike={handleLike}
              onLoadMore={loadFeed}
              hasMore={true}
            />
          ) : (
            <FeedGrid
              items={mixedFeed.items}
              onLike={handleLike}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-white/50">
            <p>No hay contenido</p>
            <button onClick={loadFeed} className="mt-4 px-6 py-2 bg-pink-500 rounded-full text-white">
              Reintentar
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FeedPageContent />
    </Suspense>
  );
}
```

---

# 📄 ARCHIVO 8: app/api/feed/route.ts

```typescript
// app/api/feed/route.ts
// ============================================
// THE HIGHWAY: API Endpoint para el Feed
// Conecta con Supabase y devuelve items crudos
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FeedItem, ContentCategory, ContentSource } from '@/types/feed';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const category = searchParams.get('category') as ContentCategory | null;
  
  try {
    const allItems: FeedItem[] = [];

    // === 1. VENUES (Google Places) ===
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + Math.floor(limit * 0.3));

    if (venues && !venuesError) {
      const venueItems: FeedItem[] = venues.map(v => ({
        id: `venue-${v.id}`,
        source: 'google_places' as ContentSource,
        category: 'venue' as ContentCategory,
        title: v.name,
        description: v.description || v.address,
        imageUrl: v.image_url || v.photos?.[0],
        thumbnailUrl: v.thumbnail_url,
        location: v.latitude && v.longitude ? {
          latitude: v.latitude,
          longitude: v.longitude,
          address: v.address,
          venueName: v.name,
        } : undefined,
        createdAt: v.created_at,
        likes: v.likes_count || 0,
        saves: v.saves_count || 0,
        views: v.views_count || 0,
        externalUrl: v.website || v.google_maps_url,
        tags: v.categories || [],
        isNSFW: v.is_adult || false,
        isPremium: v.is_premium || false,
      }));
      allItems.push(...venueItems);
    }

    // === 2. REDDIT POSTS (Adult Content) ===
    const { data: redditPosts, error: redditError } = await supabase
      .from('reddit_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + Math.floor(limit * 0.4));

    if (redditPosts && !redditError) {
      const redditItems: FeedItem[] = redditPosts.map(p => ({
        id: `reddit-${p.id}`,
        source: 'reddit' as ContentSource,
        category: 'adult' as ContentCategory,
        title: p.title,
        description: p.subreddit ? `r/${p.subreddit}` : undefined,
        imageUrl: p.image_url || p.thumbnail,
        videoUrl: p.video_url,
        thumbnailUrl: p.thumbnail,
        createdAt: p.created_at,
        likes: p.upvotes || 0,
        saves: 0,
        views: 0,
        externalUrl: p.permalink ? `https://reddit.com${p.permalink}` : undefined,
        tags: p.subreddit ? [p.subreddit] : [],
        isNSFW: true,
        isPremium: false,
      }));
      allItems.push(...redditItems);
    }

    // === 3. EVENTS (Ticketmaster/Eventbrite) ===
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .range(offset, offset + Math.floor(limit * 0.2));

    if (events && !eventsError) {
      const today = new Date().toISOString().split('T')[0];
      
      const eventItems: FeedItem[] = events.map(e => ({
        id: `event-${e.id}`,
        source: (e.source || 'ticketmaster') as ContentSource,
        category: 'event' as ContentCategory,
        title: e.name,
        description: e.description || e.venue_name,
        imageUrl: e.image_url,
        thumbnailUrl: e.thumbnail_url,
        location: e.latitude && e.longitude ? {
          latitude: e.latitude,
          longitude: e.longitude,
          address: e.address,
          venueName: e.venue_name,
        } : undefined,
        createdAt: e.created_at,
        eventDate: e.event_date,
        isToday: e.event_date === today,
        likes: e.likes_count || 0,
        saves: e.saves_count || 0,
        views: e.views_count || 0,
        externalUrl: e.ticket_url || e.external_url,
        tags: e.categories || [],
        isNSFW: false,
        isPremium: e.is_vip || false,
      }));
      allItems.push(...eventItems);
    }

    // === 4. PREMIUM SOCIAL (Apify) ===
    const { data: socialPosts, error: socialError } = await supabase
      .from('social_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + Math.floor(limit * 0.1));

    if (socialPosts && !socialError) {
      const socialItems: FeedItem[] = socialPosts.map(s => ({
        id: `social-${s.id}`,
        source: (s.platform === 'instagram' ? 'apify_instagram' : 'apify_tiktok') as ContentSource,
        category: 'premium' as ContentCategory,
        title: s.caption?.slice(0, 100) || s.username || 'Social Post',
        description: s.caption,
        imageUrl: s.image_url,
        videoUrl: s.video_url,
        thumbnailUrl: s.thumbnail_url,
        location: s.latitude && s.longitude ? {
          latitude: s.latitude,
          longitude: s.longitude,
          venueName: s.location_name,
        } : undefined,
        createdAt: s.created_at,
        likes: s.likes_count || 0,
        saves: s.saves_count || 0,
        views: s.views_count || 0,
        externalUrl: s.permalink,
        tags: s.hashtags || [],
        isNSFW: s.is_nsfw || false,
        isPremium: true,
      }));
      allItems.push(...socialItems);
    }

    // Filtrar por categoría si se especifica
    let filteredItems = allItems;
    if (category) {
      filteredItems = allItems.filter(item => item.category === category);
    }

    // Shuffle básico
    const shuffled = filteredItems.sort(() => Math.random() - 0.5);

    return NextResponse.json(shuffled);

  } catch (error) {
    console.error('Feed API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, itemId } = body;

    const [table, id] = itemId.split('-');
    
    const tableMap: Record<string, string> = {
      venue: 'venues',
      reddit: 'reddit_posts',
      event: 'events',
      social: 'social_posts',
    };

    const tableName = tableMap[table];
    if (!tableName) {
      return NextResponse.json({ error: 'Invalid item' }, { status: 400 });
    }

    if (action === 'like') {
      await supabase.rpc('increment_likes', { 
        table_name: tableName, 
        row_id: id 
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Feed POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to record interaction' },
      { status: 500 }
    );
  }
}
```

---

# 🛠️ INSTRUCCIONES DE INSTALACIÓN

## 1. Dependencias necesarias

```bash
npm install framer-motion lucide-react
```

## 2. Utilidad cn (si no existe)

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## 3. CSS adicional (globals.css)

```css
.drop-shadow-glow {
  filter: drop-shadow(0 0 8px rgb(236 72 153 / 0.7));
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

## 4. SQL para Supabase (función de likes)

```sql
CREATE OR REPLACE FUNCTION increment_likes(table_name TEXT, row_id UUID)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE %I SET likes_count = likes_count + 1 WHERE id = $1', table_name)
  USING row_id;
END;
$$ LANGUAGE plpgsql;
```

---

# 🔗 URLs DE ENTRADA PARA MARKETING

```
# Campañas adult (Twitter/Telegram):
https://venuz.com/feed?mode=adult

# SEO orgánico "antros vallarta":
https://venuz.com/feed?mode=events

# Default mixto:
https://venuz.com/feed

# Modo spicy manual:
https://venuz.com/feed?mode=spicy
```

---

# ✅ CHECKLIST DE INTEGRACIÓN

- [ ] Copiar `types/feed.ts`
- [ ] Copiar `lib/algorithm/intention-tracker.ts`
- [ ] Copiar `lib/feed/feed-mixer.ts`
- [ ] Copiar `lib/hooks/use-feed-mixer.ts`
- [ ] Copiar `components/ui/like-button.tsx`
- [ ] Copiar `components/feed/feed-card.tsx`
- [ ] Copiar `app/feed/page.tsx`
- [ ] Copiar `app/api/feed/route.ts`
- [ ] Instalar dependencias
- [ ] Agregar CSS
- [ ] Crear función SQL en Supabase
- [ ] Testear con `?mode=adult` y `?mode=events`

---

**¡THE HIGHWAY está listo para rodar!** 🛣️🔥
