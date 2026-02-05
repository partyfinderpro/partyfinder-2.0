"use client";

import { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

// ============================================
// FIX #3: Iconos SVG Premium para VENUZ
// Reemplazan los emojis genéricos (🎸, 🍺)
// Estética Pink/Gold de VENUZ
// ============================================

// 🎵 CONCIERTO / EVENTO EN VIVO
export function ConcertIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="concert-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="50%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      {/* Stage lights */}
      <path
        d="M4 4L8 12M20 4L16 12M12 2V10"
        stroke="url(#concert-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Stage */}
      <rect
        x="2"
        y="14"
        width="20"
        height="8"
        rx="2"
        fill="url(#concert-gradient)"
        opacity="0.2"
      />
      {/* Music notes / crowd */}
      <circle cx="6" cy="17" r="1.5" fill="url(#concert-gradient)" />
      <circle cx="12" cy="16" r="2" fill="url(#concert-gradient)" />
      <circle cx="18" cy="17" r="1.5" fill="url(#concert-gradient)" />
      {/* Sound waves */}
      <path
        d="M9 10C9 10 10.5 8 12 8C13.5 8 15 10 15 10"
        stroke="url(#concert-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 🍸 BAR / NIGHTLIFE ESTÁTICA
export function BarIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="bar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      {/* Cocktail glass */}
      <path
        d="M8 2L4 10H20L16 2H8Z"
        stroke="url(#bar-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 10V18"
        stroke="url(#bar-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 22H16"
        stroke="url(#bar-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 18H15"
        stroke="url(#bar-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Liquid */}
      <path
        d="M6 7L18 7"
        stroke="url(#bar-gradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Garnish/olive */}
      <circle cx="14" cy="5" r="1.5" fill="url(#bar-gradient)" />
    </svg>
  );
}

// 💃 CLUB NOCTURNO
export function ClubIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="club-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F43F5E" />
        </linearGradient>
      </defs>
      {/* Disco ball */}
      <circle
        cx="12"
        cy="8"
        r="5"
        stroke="url(#club-gradient)"
        strokeWidth="2"
      />
      {/* Disco ball reflections */}
      <path d="M9 6L15 10M9 10L15 6" stroke="url(#club-gradient)" strokeWidth="1" opacity="0.5" />
      {/* String */}
      <path d="M12 3V1" stroke="url(#club-gradient)" strokeWidth="2" strokeLinecap="round" />
      {/* Light rays */}
      <path
        d="M4 16L8 12M20 16L16 12M12 13V18"
        stroke="url(#club-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Dance floor */}
      <rect
        x="4"
        y="18"
        width="16"
        height="4"
        rx="1"
        fill="url(#club-gradient)"
        opacity="0.3"
      />
      {/* Floor lights */}
      <circle cx="7" cy="20" r="1" fill="url(#club-gradient)" />
      <circle cx="12" cy="20" r="1" fill="url(#club-gradient)" />
      <circle cx="17" cy="20" r="1" fill="url(#club-gradient)" />
    </svg>
  );
}

// 💋 ESTOY SOLTERO
export function SolteroIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="soltero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
      </defs>
      {/* Silhouette */}
      <path
        d="M12 2C14.21 2 16 3.79 16 6C16 8.21 14.21 10 12 10C9.79 10 8 8.21 8 6C8 3.79 9.79 2 12 2Z"
        fill="url(#soltero-gradient)"
        opacity="0.8"
      />
      {/* Body */}
      <path
        d="M12 11C16 11 19 13 20 16L18 22H6L4 16C5 13 8 11 12 11Z"
        fill="url(#soltero-gradient)"
        opacity="0.6"
      />
      {/* Sparkle */}
      <path
        d="M19 4L20 6L22 5L20 6L21 8L20 6L18 7L20 6L19 4Z"
        fill="url(#soltero-gradient)"
      />
    </svg>
  );
}

// 🎰 CASINO
export function CasinoIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="casino-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      {/* Dice 1 */}
      <rect
        x="2"
        y="10"
        width="10"
        height="10"
        rx="2"
        stroke="url(#casino-gradient)"
        strokeWidth="2"
      />
      <circle cx="5" cy="13" r="1" fill="url(#casino-gradient)" />
      <circle cx="9" cy="17" r="1" fill="url(#casino-gradient)" />
      {/* Dice 2 */}
      <rect
        x="12"
        y="4"
        width="10"
        height="10"
        rx="2"
        stroke="url(#casino-gradient)"
        strokeWidth="2"
        transform="rotate(15 17 9)"
      />
      <circle cx="15" cy="7" r="1" fill="url(#casino-gradient)" />
      <circle cx="19" cy="7" r="1" fill="url(#casino-gradient)" />
      <circle cx="17" cy="11" r="1" fill="url(#casino-gradient)" />
    </svg>
  );
}

// 🎉 EVENTO / FIESTA
export function PartyIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="party-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="33%" stopColor="#8B5CF6" />
          <stop offset="66%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      {/* Party popper */}
      <path
        d="M3 21L10 14"
        stroke="url(#party-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 14L14 10L21 3"
        stroke="url(#party-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Confetti */}
      <circle cx="6" cy="6" r="1.5" fill="#EC4899" />
      <circle cx="18" cy="12" r="1.5" fill="#8B5CF6" />
      <circle cx="12" cy="4" r="1.5" fill="#F59E0B" />
      <rect x="15" y="6" width="2" height="2" fill="#10B981" transform="rotate(45 16 7)" />
      <rect x="8" y="10" width="2" height="2" fill="#3B82F6" transform="rotate(45 9 11)" />
      {/* Streamers */}
      <path
        d="M14 8C16 6 18 8 20 6"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 14C10 12 12 14 14 12"
        stroke="#EC4899"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 📍 UBICACIÓN / MAPA
export function LocationIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="location-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F43F5E" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
        fill="url(#location-gradient)"
        opacity="0.2"
        stroke="url(#location-gradient)"
        strokeWidth="2"
      />
      <circle cx="12" cy="9" r="3" fill="url(#location-gradient)" />
    </svg>
  );
}

// 🔥 DESTACADOS / HOT
export function HotIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="hot-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C12 2 8 6 8 10C8 12 9 14 10 15C9 14 8 12 8 10C8 8 9 6 10 5C10 7 11 9 12 10C13 9 14 7 14 5C15 6 16 8 16 10C16 12 15 14 14 15C15 14 16 12 16 10C16 6 12 2 12 2Z"
        fill="url(#hot-gradient)"
      />
      <path
        d="M12 22C15.866 22 19 18.866 19 15C19 11 16 8 12 8C8 8 5 11 5 15C5 18.866 8.134 22 12 22Z"
        fill="url(#hot-gradient)"
        opacity="0.8"
      />
      <ellipse cx="12" cy="17" rx="2" ry="3" fill="#FDE68A" opacity="0.8" />
    </svg>
  );
}

// ✨ PREMIUM / VIP
export function PremiumIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="premium-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      {/* Crown */}
      <path
        d="M2 17L5 8L9 12L12 4L15 12L19 8L22 17H2Z"
        fill="url(#premium-gradient)"
        stroke="url(#premium-gradient)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Base */}
      <rect
        x="2"
        y="17"
        width="20"
        height="3"
        rx="1"
        fill="url(#premium-gradient)"
      />
      {/* Jewels */}
      <circle cx="12" cy="10" r="1.5" fill="#FDE68A" />
      <circle cx="6" cy="13" r="1" fill="#FDE68A" />
      <circle cx="18" cy="13" r="1" fill="#FDE68A" />
    </svg>
  );
}

// 📸 LIVE / EN VIVO (para CamSoda, etc.)
export function LiveIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="live-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      {/* Camera body */}
      <rect
        x="2"
        y="6"
        width="14"
        height="12"
        rx="2"
        stroke="url(#live-gradient)"
        strokeWidth="2"
      />
      {/* Lens */}
      <path
        d="M16 10L22 7V17L16 14V10Z"
        fill="url(#live-gradient)"
      />
      {/* Recording dot */}
      <circle cx="6" cy="10" r="2" fill="url(#live-gradient)">
        <animate
          attributeName="opacity"
          values="1;0.3;1"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
      {/* LIVE text placeholder */}
      <rect x="8" y="14" width="6" height="2" rx="1" fill="url(#live-gradient)" opacity="0.6" />
    </svg>
  );
}

// Mapa de categorías a iconos
export const CATEGORY_ICONS: Record<string, React.FC<IconProps>> = {
  concierto: ConcertIcon,
  concert: ConcertIcon,
  evento: PartyIcon,
  event: PartyIcon,
  fiesta: PartyIcon,
  party: PartyIcon,
  bar: BarIcon,
  cantina: BarIcon,
  club: ClubIcon,
  nightclub: ClubIcon,
  disco: ClubIcon,
  soltero: SolteroIcon,
  escort: SolteroIcon,
  modelo: SolteroIcon,
  model: SolteroIcon,
  casino: CasinoIcon,
  live: LiveIcon,
  cam: LiveIcon,
  webcam: LiveIcon,
  'live-cams': LiveIcon,
  camsoda: LiveIcon,
  stripchat: LiveIcon,
  chaturbate: LiveIcon,
  premium: PremiumIcon,
  vip: PremiumIcon,
  destacado: HotIcon,
  hot: HotIcon,
  trending: HotIcon,
  hookup: HotIcon,
  'ai-porn': PremiumIcon,
  masaje: SolteroIcon,
  tabledance: ClubIcon,
  restaurante: BarIcon,
  beach: PartyIcon,
};

// Helper para obtener el icono de una categoría
export function getCategoryIcon(category: string): React.FC<IconProps> {
  const normalizedCategory = category.toLowerCase().trim();
  return CATEGORY_ICONS[normalizedCategory] || PartyIcon;
}
