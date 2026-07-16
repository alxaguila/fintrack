import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { categoryIcon } from '@/lib/categoryIcons'
import { LUCIDE_ICON_NAMES } from '@/lib/lucideCatalog'

const MAX_RESULTS = 120

/**
 * Selector visual de icono lucide: botón con preview del icono actual que abre
 * un popover con buscador + cuadrícula. Guarda el mismo nombre kebab-case que
 * ya usa categoryIcon() (categories.icon / category_groups.icon), así que no
 * cambia el formato de dato, solo la forma de elegirlo.
 */
export function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation('admin')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = q ? LUCIDE_ICON_NAMES.filter((n) => n.includes(q)) : LUCIDE_ICON_NAMES
    return all.slice(0, MAX_RESULTS)
  }, [query])

  const totalMatches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? LUCIDE_ICON_NAMES.filter((n) => n.includes(q)).length : LUCIDE_ICON_NAMES.length
  }, [query])

  const Preview = categoryIcon(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-slate-50"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Preview className="h-4 w-4" />
          </span>
          <span className="truncate text-slate-700">{value || t('categories.icon_none')}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 max-w-[90vw] p-0" align="start">
        <div className="space-y-3 p-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                autoFocus
                className="h-8 pl-8 text-sm"
                placeholder={t('categories.icon_search')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 px-2"
                onClick={() => { onChange(''); setOpen(false) }}
              >
                {t('categories.icon_clear')}
              </Button>
            )}
          </div>

          {results.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">{t('categories.icon_no_results')}</p>
          ) : (
            <>
              <div className="grid max-h-64 grid-cols-6 gap-1 overflow-y-auto">
                {results.map((name) => {
                  const Ico = categoryIcon(name)
                  const isSelected = name === value
                  return (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => { onChange(name); setOpen(false) }}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                        isSelected ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Ico className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
              <p className="text-center text-xs text-slate-400">
                {t('categories.icon_results', { shown: results.length, total: totalMatches })}
              </p>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
