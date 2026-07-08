import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronsUpDown, Check, Search } from 'lucide-react'
import { categoryIcon, categoryLabel } from '@/lib/categoryIcons'
import { cn } from '@/lib/utils'
import type { Category, CategoryGroup, TransactionType } from '@/lib/database.types'

interface CategoryComboboxProps {
  type: TransactionType | ''
  groups: CategoryGroup[]
  categories: Category[]
  value: string                                  // id de subcategoría ('' = ninguna)
  onChange: (categoryId: string, groupId: string) => void
  placeholder?: string
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

/**
 * Selector único jerárquico y buscable de (sub)categoría. El propio campo es un
 * input: al hacer click ya se puede escribir para filtrar (sin segundo click).
 * La lista se despliega EN FLUJO dentro del diálogo (no portaleada), para que el
 * diálogo modal de Radix no bloquee el foco/scroll ni la recorte.
 *
 * Muestra la categoría como cabecera (con icono) y las subcategorías tabuladas
 * debajo. Con un único grupo (ingreso / no computable) omite las cabeceras y
 * lista las subcategorías al mismo nivel. La búsqueda filtra por subcategoría y
 * por categoría.
 */
export function CategoryCombobox({ type, groups, categories, value, onChange, placeholder = '—' }: CategoryComboboxProps) {
  const { t } = useTranslation('categories')
  const { t: tt } = useTranslation('transactions')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const typeGroups = useMemo(
    () => (type ? groups.filter(g => g.type === type) : groups),
    [groups, type],
  )
  const showHeaders = typeGroups.length > 1

  const selected = categories.find(c => c.id === value)
  const selectedColor = (selected ? groups.find(g => g.id === selected.group_id)?.color : undefined) ?? undefined
  const SelIcon = selected ? categoryIcon(selected.icon) : null

  const sections = useMemo(() => {
    const q = normalize(query.trim())
    return typeGroups
      .map(g => {
        const groupLabel = t(`category_group.${g.slug}`)
        const groupMatches = !!q && normalize(groupLabel).includes(q)
        const cats = categories
          .filter(c => c.group_id === g.id)
          .filter(c => !q || groupMatches || normalize(categoryLabel(c.slug)).includes(q))
        return { group: g, groupLabel, cats }
      })
      .filter(s => s.cats.length > 0)
  }, [typeGroups, categories, query, t])

  const firstMatch = sections[0]?.cats[0]

  function pick(c: Category) {
    onChange(c.id, c.group_id)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div>
      <div className="relative">
        {open || !selected || !SelIcon ? (
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        ) : (
          <SelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: selectedColor }} />
        )}
        <input
          ref={inputRef}
          value={open ? query : (selected ? categoryLabel(selected.slug) : '')}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { setOpen(true); setQuery('') }}
          onBlur={() => setOpen(false)}
          onKeyDown={e => {
            if (e.key === 'Escape') { e.preventDefault(); setOpen(false); inputRef.current?.blur() }
            else if (e.key === 'Enter' && firstMatch) { e.preventDefault(); pick(firstMatch) }
          }}
          placeholder={open ? tt('category_dialog.combobox_search') : placeholder}
          className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-9 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
        />
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {open && (
        // onMouseDown.preventDefault mantiene el foco en el input al pulsar la
        // lista (evita que el blur la cierre antes de registrar el click).
        <div
          className="mt-1 rounded-md border bg-popover shadow-lg"
          onMouseDown={e => e.preventDefault()}
        >
          <div className="max-h-60 overflow-y-auto p-1">
            {sections.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">{tt('category_dialog.combobox_empty')}</p>
            ) : (
              sections.map(({ group, groupLabel, cats }) => {
                const GIcon = categoryIcon(group.icon)
                return (
                  <div key={group.id}>
                    {showHeaders && (
                      <div className="flex items-center gap-2 px-2 pb-1 pt-2 text-xs font-semibold text-muted-foreground">
                        <GIcon className="h-3.5 w-3.5 shrink-0" style={{ color: group.color ?? undefined }} />
                        <span className="truncate">{groupLabel}</span>
                      </div>
                    )}
                    {cats.map(c => {
                      const CIcon = categoryIcon(c.icon)
                      const isSel = c.id === value
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => pick(c)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition-colors',
                            showHeaders ? 'pl-8' : 'pl-2',
                            isSel ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                          )}
                        >
                          <CIcon className="h-4 w-4 shrink-0" style={{ color: group.color ?? undefined }} />
                          <span className="min-w-0 flex-1 truncate">{categoryLabel(c.slug)}</span>
                          {isSel && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
