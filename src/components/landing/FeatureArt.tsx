import { BRAND } from './brand'
import safeUrl from '@/assets/landing/feature-safe.webp'
import brainUrl from '@/assets/landing/feature-brain.webp'

// Ilustraciones de la sección de features de la landing.
// - Tarjeta 1: SVG a medida (flujo CSV→agregación→dashboard) con animación por reveal.
// - Tarjetas 2 y 3: imágenes aportadas (caja fuerte / cerebro), decorativas y lazy.
// Motion y guarda prefers-reduced-motion viven en Landing.tsx (.ftl-fnode / .ftl-fdraw
// / .ftl-fglow / .ftl-float), con fallback visible sin JS.

// Tarjeta 1 (clara): CSV → agregación → mini-dashboard.
export function CsvFlowArt() {
  return (
    <svg viewBox="0 0 300 96" width="100%" height="auto" aria-hidden="true" style={{ display: 'block', maxWidth: 340 }}>
      {/* Fichero CSV */}
      <g className="ftl-fnode">
        <rect x="12" y="20" width="46" height="56" rx="7" fill="#fff" stroke="#D5DBE1" strokeWidth="1.4" />
        <path d="M46 20v10h10" fill="none" stroke="#D5DBE1" strokeWidth="1.4" />
        <rect x="19" y="52" width="32" height="7" rx="2" fill={BRAND.blue} opacity="0.14" />
        <rect x="19" y="63" width="22" height="5" rx="2" fill={BRAND.ink} opacity="0.1" />
        <text x="35" y="45" textAnchor="middle" fontSize="11" fontWeight="700" fill={BRAND.blue} fontFamily="ui-monospace, monospace">CSV</text>
      </g>
      {/* Flecha 1 */}
      <path d="M64 48H96" fill="none" stroke={BRAND.blue} strokeWidth="1.6" strokeDasharray="4 5" strokeLinecap="round" opacity="0.7" />
      <path d="M93 43.5l5 4.5-5 4.5" fill="none" stroke={BRAND.blue} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Hub de agregación */}
      <g className="ftl-fnode" style={{ animationDelay: '.14s' }}>
        <rect x="104" y="26" width="44" height="44" rx="12" fill="#EAF4FA" stroke="#CFE4F1" strokeWidth="1.4" />
        <circle cx="126" cy="48" r="12" fill="none" stroke={BRAND.blue} strokeWidth="3.2" strokeDasharray="20 56" strokeLinecap="round" transform="rotate(-90 126 48)" />
        <circle cx="126" cy="48" r="12" fill="none" stroke="#38B0D6" strokeWidth="3.2" strokeDasharray="14 62" strokeDashoffset="-20" strokeLinecap="round" transform="rotate(-90 126 48)" />
        <circle cx="126" cy="48" r="4.5" fill="#fff" />
      </g>
      {/* Flecha 2 */}
      <path d="M156 48H188" fill="none" stroke={BRAND.blue} strokeWidth="1.6" strokeDasharray="4 5" strokeLinecap="round" opacity="0.7" />
      <path d="M185 43.5l5 4.5-5 4.5" fill="none" stroke={BRAND.blue} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Mini dashboard */}
      <g className="ftl-fnode" style={{ animationDelay: '.28s' }}>
        <rect x="196" y="16" width="98" height="64" rx="9" fill="#fff" stroke="#D5DBE1" strokeWidth="1.4" />
        <rect x="205" y="25" width="34" height="5" rx="2.5" fill={BRAND.ink} opacity="0.16" />
        <path className="ftl-fdraw" pathLength={1} style={{ animationDelay: '.42s' }} d="M205 62l14-9 12 5 14-13 12 4" fill="none" stroke={BRAND.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="252" y="40" width="34" height="6" rx="3" fill="#38B0D6" opacity="0.5" />
        <rect x="252" y="50" width="26" height="6" rx="3" fill={BRAND.accent} opacity="0.55" />
        <rect x="252" y="60" width="30" height="6" rx="3" fill={BRAND.blue} opacity="0.4" />
      </g>
    </svg>
  )
}

// Tarjeta 2 (oscura): caja fuerte — "nunca pedimos claves".
export function VaultArt() {
  return (
    <img
      className="ftl-float"
      src={safeUrl}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      style={{ display: 'block', width: 'auto', maxWidth: '100%', maxHeight: 240, objectFit: 'contain' }}
    />
  )
}

// Tarjeta 3 (oscura): cerebro-circuito — "clasificación automática".
export function BrainArt() {
  return (
    <img
      className="ftl-float"
      src={brainUrl}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      style={{ display: 'block', width: '100%', maxWidth: '100%', maxHeight: 230, objectFit: 'contain' }}
    />
  )
}
