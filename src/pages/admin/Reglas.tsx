import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { useAdminCommunityRules, COMMUNITY_VOTE_THRESHOLD } from '@/hooks/useCommunityRules'
import { useCategories } from '@/hooks/useCategories'
import { categoryIcon, categoryLabel } from '@/lib/categoryIcons'
import { Input } from '@/components/ui/input'
import { AdminHeader } from './AdminHeader'

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

/** Admin: reglas de clasificación votadas por la comunidad, de más a menos votadas. */
export default function Reglas() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { data: rules = [], isLoading } = useAdminCommunityRules()
  const { data: categories = [] } = useCategories()
  const [query, setQuery] = useState('')

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const q = normalize(query.trim())
  const filtered = q ? rules.filter((r) => normalize(r.merchant_key).includes(q)) : rules

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <AdminHeader title={t('rules.title')} />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          placeholder={t('rules.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <p className="text-sm text-slate-500">{t('rules.threshold_note', { count: COMMUNITY_VOTE_THRESHOLD })}</p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">{tc('actions.loading')}</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">{q ? t('rules.no_search_results') : t('rules.empty')}</p>
        ) : (
          filtered.map((r) => {
            const category = categoryById.get(r.category_id)
            const CatIcon = categoryIcon(category?.icon)
            const color = category?.group?.color ?? '#64748b'
            const active = r.votes >= COMMUNITY_VOTE_THRESHOLD
            return (
              <div
                key={`${r.merchant_key}-${r.category_id}`}
                className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm uppercase">{r.merchant_key}</p>
                </div>
                <span
                  className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${color}1f`, color }}
                >
                  <CatIcon className="h-3.5 w-3.5" />
                  {categoryLabel(category?.slug, category?.slug ?? '')}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                    active ? 'bg-teal-500/10 text-teal-600' : 'bg-slate-100 text-slate-600'
                  }`}
                  title={active ? t('rules.active') : t('rules.inactive')}
                >
                  {t('rules.votes', { count: r.votes })}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
