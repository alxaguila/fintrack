import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import { scorePassword, passwordChecks } from '@/lib/passwordStrength'
import { cn } from '@/lib/utils'

/**
 * Barra de fortaleza de contraseña + checklist de requisitos en vivo.
 *
 * - La barra (4 segmentos) usa la puntuación 0-4 de zxcvbn (asíncrono, debounced).
 * - El checklist deriva de regex locales (instantáneo).
 * Paleta de marca (rosa → ámbar → teal), sin semáforo verde/rojo.
 */

// score 0-4 → nº de segmentos rellenos (0 chars = 0 segmentos).
const SEGMENTS = 4

// Colores por nivel de fortaleza (índice = score 1..4; 0 = vacío/gris).
const LEVEL_COLOR = ['#e2e8f0', '#CB6391', '#CB6391', '#f59e0b', '#14B8A6']

export function PasswordStrengthBar({ password }: { password: string }) {
  const { t } = useTranslation('auth')
  const [score, setScore] = useState(0)

  // Puntúa con un pequeño debounce para no llamar a zxcvbn en cada tecla.
  useEffect(() => {
    if (!password) {
      setScore(0)
      return
    }
    let active = true
    const id = setTimeout(() => {
      scorePassword(password).then((s) => {
        if (active) setScore(s)
      })
    }, 150)
    return () => {
      active = false
      clearTimeout(id)
    }
  }, [password])

  if (!password) return null

  const checks = passwordChecks(password)
  const color = LEVEL_COLOR[score]
  // Nº de segmentos: score 1 y 2 muestran 1 y 2 respectivamente, etc.
  const filled = Math.min(score, SEGMENTS)

  const requirements: Array<[keyof typeof checks, string]> = [
    ['length', t('requirements.length')],
    ['upper', t('requirements.upper')],
    ['lower', t('requirements.lower')],
    ['number', t('requirements.number')],
  ]

  return (
    <div className="space-y-2">
      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ backgroundColor: i < filled ? color : '#e2e8f0' }}
          />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color: score === 0 ? '#94a3b8' : color }}>
        {t('strength.label')} {t(`strength.${score}`)}
      </p>
      <ul className="space-y-0.5">
        {requirements.map(([key, label]) => (
          <li
            key={key}
            className={cn(
              'flex items-center gap-1.5 text-xs',
              checks[key] ? 'text-slate-600' : 'text-slate-400',
            )}
          >
            {checks[key] ? (
              <Check className="h-3.5 w-3.5 text-teal-500" />
            ) : (
              <X className="h-3.5 w-3.5 text-slate-300" />
            )}
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}
