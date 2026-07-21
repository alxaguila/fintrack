import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { accountTypeMeta } from '@/lib/accountTypes'
import type { Account } from '@/lib/database.types'

// Colores del punto de frescura, igual criterio que en Posición Global (Home.tsx):
// <7 días verde · 7-15 ámbar · >15 o nunca rojo.
const FRESH_OK = '#16A34A'
const FRESH_WARN = '#E0A81E'
const FRESH_STALE = '#DC5B4B'
function freshColor(days: number | null): string {
  if (days == null) return FRESH_STALE
  if (days < 7) return FRESH_OK
  if (days <= 15) return FRESH_WARN
  return FRESH_STALE
}

interface AccountCardProps {
  account: Account
  /** Logo heredado de la entidad del catálogo (match por nombre). */
  entityLogoUrl?: string | null
  /** Días desde la última importación de esta cuenta (null = nunca importada). */
  daysSinceImport: number | null
  onEdit: (account: Account) => void
  onDelete: (account: Account) => void
}

export function AccountCard({ account, entityLogoUrl, daysSinceImport, onEdit, onDelete }: AccountCardProps) {
  const { t } = useTranslation('accounts')
  const { t: tc } = useTranslation('common')
  const [logoError, setLogoError] = useState(false)
  const { color: typeColor, icon: Icon } = accountTypeMeta(account.type)
  // El logo lo pone el admin por entidad; se conserva el propio de la cuenta si aún lo tuviera (legado).
  const logo = account.logo_url || entityLogoUrl || null
  const showLogo = !!logo && !logoError
  // Alias = nombre de la cuenta, salvo que sea igual a la entidad (entonces se deja en blanco).
  const alias = account.name.trim().toLowerCase() !== account.entity.trim().toLowerCase()
    ? account.name
    : ''

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(account)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit(account)
        }
      }}
      className="group relative flex h-full min-h-[128px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 pb-5 pt-6 text-left
                 shadow-[0_8px_20px_-6px_rgba(15,23,42,0.18)] transition-shadow hover:shadow-[0_14px_28px_-8px_rgba(15,23,42,0.28)]
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
    >
      {/* Banda de color: fina y con tono suavizado (alfa) para que no sea estridente */}
      <div className="absolute inset-x-0 top-0 z-20 h-1" style={{ backgroundColor: `${account.color}99` }} />

      {/* Logo del banco: tile cuadrado fijo arriba-derecha con esquinas redondeadas,
          imitando el icono de una app. El cuadrado es siempre el mismo (mismo espacio
          para todos) y object-cover rellena el tile recortando a los bordes redondeados.
          Va en posición absoluta → no altera el tamaño de la tarjeta. */}
      {showLogo && (
        <div className="pointer-events-none absolute right-4 top-5 z-0 h-11 w-11 overflow-hidden rounded-xl bg-white">
          <img
            src={logo!}
            alt={account.entity}
            onError={() => setLogoError(true)}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Sin logo: icono de agua en diagonal, abajo-derecha */}
      {!showLogo && (
        <Icon
          aria-hidden
          className="pointer-events-none absolute bottom-4 right-4 z-0 h-16 w-16 rotate-[18deg] text-slate-200"
          strokeWidth={1.1}
        />
      )}

      {/* Acciones: abajo-derecha (no chocan con el logo de arriba), visibles solo en hover/focus */}
      <div className="absolute bottom-3 right-3 z-30 flex gap-1 opacity-0 transition-opacity
                      group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label={tc('actions.edit')}
          onClick={e => { e.stopPropagation(); onEdit(account) }}
          className="rounded-lg bg-white/70 p-1.5 text-slate-500 backdrop-blur hover:bg-slate-100 hover:text-slate-700"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={tc('actions.delete')}
          onClick={e => { e.stopPropagation(); onDelete(account) }}
          className="rounded-lg bg-white/70 p-1.5 text-[#CB6391] backdrop-blur hover:bg-rose-50 hover:text-[#b0466f]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Contenido: 3 líneas → tipo · entidad · alias */}
      <div className="relative z-10 pr-16">
        {/* Línea 1: pastilla de tipo (color por tipo) */}
        <div>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${typeColor}1f`, color: typeColor }}
          >
            <Icon className="h-3 w-3" />
            {tc(`account_type.${account.type}`)}
          </span>
        </div>
        {/* Línea 2: entidad en mayúscula y negrita */}
        <p className="mt-2 text-[15px] font-bold uppercase tracking-wide text-slate-900 break-words">
          {account.entity}
        </p>
        {/* Línea 3: alias de la cuenta (en blanco si coincide con la entidad) */}
        <p className="mt-0.5 text-sm text-slate-500 break-words">
          {alias || ' '}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: freshColor(daysSinceImport) }} />
          {daysSinceImport == null
            ? t('never_updated')
            : daysSinceImport === 0
              ? t('updated_today')
              : t('updated_days_ago', { count: daysSinceImport })}
        </div>
      </div>
    </div>
  )
}
