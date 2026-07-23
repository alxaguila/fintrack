import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Search } from 'lucide-react'
import i18n from '@/i18n'
import { useCategoryGroups, useCategories } from '@/hooks/useCategories'
import {
  useSaveCategoryGroup, useDeleteCategoryGroup, useSaveCategory, useDeleteCategory,
} from '@/hooks/useAdminCategories'
import { categoryGroupFormSchema, categoryFormSchema, fieldErrors } from '@/lib/validation'
import { categoryIcon } from '@/lib/categoryIcons'
import { IconPicker } from '@/components/admin/IconPicker'
import type { Category, CategoryGroup, CategoryType } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/useToast'
import { AdminHeader } from './AdminHeader'

const CAT_TYPES: CategoryType[] = ['gasto', 'ingreso', 'no_computable']

/** Etiqueta actual (idioma dado) resuelta desde i18n (bundle + traducciones BD). */
function currentLabel(keyType: 'group' | 'category', slug: string, lang: string): string {
  const prefix = keyType === 'group' ? 'category_group.' : 'category.'
  const v = i18n.getResource(lang, 'categories', prefix + slug)
  return typeof v === 'string' ? v : ''
}

function typeBadgeColor(type: CategoryType): string {
  if (type === 'ingreso') return '#14B8A6'
  if (type === 'gasto') return '#CB6391'
  return '#64748b'
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

/** Próximo sort_order al crear: añade el elemento nuevo al final de la lista. */
function nextSortOrder(list: { sort_order: number }[]): number {
  return list.length ? Math.max(...list.map((x) => x.sort_order)) + 10 : 10
}

export default function Categorias() {
  const { t } = useTranslation('admin')
  const { data: groups = [] } = useCategoryGroups()
  const { data: categories = [] } = useCategories()
  const [query, setQuery] = useState('')
  const lang = i18n.language?.slice(0, 2) || 'es'

  const q = normalize(query.trim())
  const matchesGroup = (g: CategoryGroup) =>
    !q || normalize(g.slug).includes(q) || normalize(currentLabel('group', g.slug, lang)).includes(q)
  const matchesCategory = (c: Category) =>
    !q || normalize(c.slug).includes(q) || normalize(currentLabel('category', c.slug, lang)).includes(q)

  const groupMatchCount = q ? groups.filter(matchesGroup).length : null
  const categoryMatchCount = q ? categories.filter(matchesCategory).length : null

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <AdminHeader title={t('categories.title')} />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          placeholder={t('categories.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="groups">
        <TabsList className="w-full">
          <TabsTrigger value="groups" className="flex-1">
            {t('categories.tab_groups')}{groupMatchCount !== null && ` (${groupMatchCount})`}
          </TabsTrigger>
          <TabsTrigger value="cats" className="flex-1">
            {t('categories.tab_categories')}{categoryMatchCount !== null && ` (${categoryMatchCount})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups">
          <GroupsPanel groups={groups.filter(matchesGroup)} searching={!!q} />
        </TabsContent>

        <TabsContent value="cats">
          <CategoriesPanel groups={groups} categories={categories.filter(matchesCategory)} searching={!!q} />
        </TabsContent>
      </Tabs>

      <HierarchyTree groups={groups} categories={categories} />
    </div>
  )
}

// ============================================================
// ÁRBOL DE JERARQUÍA (solo lectura, para ver de un vistazo grupo→subcategorías
// antes de decidir si reorganizar algo desde las pestañas de arriba)
// ============================================================
function HierarchyTree({ groups, categories }: { groups: CategoryGroup[]; categories: Category[] }) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const lang = i18n.language?.slice(0, 2) || 'es'

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-[15px] font-bold">{t('categories.hierarchy_title')}</h2>
        <p className="text-xs text-slate-500">{t('categories.hierarchy_hint')}</p>
      </div>

      <div className="space-y-4">
        {groups.map((g) => {
          const Icon = categoryIcon(g.icon)
          const color = g.color ?? '#64748b'
          const subcats = categories.filter((c) => c.group_id === g.id)
          return (
            <div key={g.id}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                <span className="font-medium text-slate-700">{currentLabel('group', g.slug, lang) || g.slug}</span>
                <span className="text-xs text-slate-400">· {tc(`transaction_type.${g.type}`)}</span>
              </div>

              {subcats.length === 0 ? (
                <p className="py-1 pl-6 text-xs text-slate-400">{t('categories.hierarchy_no_subcats')}</p>
              ) : (
                <div className="mt-1 space-y-1 pl-6">
                  {subcats.map((c) => {
                    const CatIcon = categoryIcon(c.icon)
                    return (
                      <div key={c.id} className="flex items-center gap-2 text-sm text-slate-500">
                        <CatIcon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                        <span className="truncate">{currentLabel('category', c.slug, lang) || c.slug}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// GRUPOS
// ============================================================
function GroupsPanel({ groups, searching }: { groups: CategoryGroup[]; searching: boolean }) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const lang = i18n.language?.slice(0, 2) || 'es'
  const saveM = useSaveCategoryGroup()
  const deleteM = useDeleteCategoryGroup()
  const [editing, setEditing] = useState<CategoryGroup | null | undefined>(undefined)
  const [toDelete, setToDelete] = useState<CategoryGroup | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" /> {t('categories.add_group')}</Button>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-slate-500">{searching ? t('categories.no_search_results') : t('categories.empty')}</p>
      ) : (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {groups.map((g) => {
          const Icon = categoryIcon(g.icon)
          return (
            <div
              key={g.id}
              role="button"
              tabIndex={0}
              onClick={() => setEditing(g)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(g) } }}
              className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${g.color ?? '#64748b'}1f`, color: g.color ?? '#64748b' }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words font-medium">{currentLabel('group', g.slug, lang) || g.slug}</p>
                <p className="truncate font-mono text-xs text-slate-400">{g.slug}</p>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: `${typeBadgeColor(g.type)}1f`, color: typeBadgeColor(g.type) }}
              >
                {tc(`transaction_type.${g.type}`)}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setToDelete(g) }}
                aria-label={tc('actions.delete')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#CB6391] hover:bg-[#CB6391]/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
      )}

      {editing !== undefined && (
        <GroupDialog
          group={editing}
          existingGroups={groups}
          saving={saveM.isPending}
          onClose={() => setEditing(undefined)}
          onSave={async (values) => {
            try {
              await saveM.mutateAsync(editing ? { id: editing.id, ...values } : values)
              toast({ title: t('categories.saved') })
              setEditing(undefined)
            } catch (err: any) {
              const dup = err?.code === '23505' || String(err?.message ?? '').includes('duplicate')
              toast({ title: dup ? t('categories.duplicate') : tc('errors.generic'), variant: 'destructive' })
            }
          }}
        />
      )}

      <ConfirmDelete
        open={!!toDelete}
        name={toDelete ? (currentLabel('group', toDelete.slug, lang) || toDelete.slug) : ''}
        pending={deleteM.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          try {
            await deleteM.mutateAsync(toDelete)
            toast({ title: t('categories.deleted') })
          } catch (err: any) {
            const inUse = err?.code === '23503' || String(err?.message ?? '').includes('foreign key')
            toast({ title: inUse ? t('categories.in_use') : tc('errors.generic'), variant: 'destructive' })
          } finally {
            setToDelete(null)
          }
        }}
      />
    </div>
  )
}

// ============================================================
// SUBCATEGORÍAS
// ============================================================
function CategoriesPanel({ groups, categories, searching }: { groups: CategoryGroup[]; categories: Category[]; searching: boolean }) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const lang = i18n.language?.slice(0, 2) || 'es'
  const saveM = useSaveCategory()
  const deleteM = useDeleteCategory()
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [editing, setEditing] = useState<Category | null | undefined>(undefined)
  const [toDelete, setToDelete] = useState<Category | null>(null)

  const filtered = useMemo(
    () => (groupFilter === 'all' ? categories : categories.filter((c) => c.group_id === groupFilter)),
    [categories, groupFilter],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('categories.all_groups')}</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>{currentLabel('group', g.slug, lang) || g.slug}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" /> {t('categories.add_category')}</Button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">{searching ? t('categories.no_search_results') : t('categories.empty')}</p>
      ) : (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {filtered.map((c) => {
          const Icon = categoryIcon(c.icon)
          const group = groups.find((g) => g.id === c.group_id)
          return (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => setEditing(c)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(c) } }}
              className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${group?.color ?? '#64748b'}1f`, color: group?.color ?? '#64748b' }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words font-medium">{currentLabel('category', c.slug, lang) || c.slug}</p>
                <p className="truncate font-mono text-xs text-slate-400">{c.slug}</p>
              </div>
              {group && (
                <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 sm:inline">
                  {currentLabel('group', group.slug, lang) || group.slug}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setToDelete(c) }}
                aria-label={tc('actions.delete')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#CB6391] hover:bg-[#CB6391]/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
      )}

      {editing !== undefined && (
        <CategoryDialog
          category={editing}
          groups={groups}
          existingCategories={categories}
          defaultGroupId={groupFilter !== 'all' ? groupFilter : groups[0]?.id}
          saving={saveM.isPending}
          onClose={() => setEditing(undefined)}
          onSave={async (values) => {
            try {
              await saveM.mutateAsync(editing ? { id: editing.id, ...values } : values)
              toast({ title: t('categories.saved') })
              setEditing(undefined)
            } catch (err: any) {
              const dup = err?.code === '23505' || String(err?.message ?? '').includes('duplicate')
              toast({ title: dup ? t('categories.duplicate') : tc('errors.generic'), variant: 'destructive' })
            }
          }}
        />
      )}

      <ConfirmDelete
        open={!!toDelete}
        name={toDelete ? (currentLabel('category', toDelete.slug, lang) || toDelete.slug) : ''}
        pending={deleteM.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          try {
            await deleteM.mutateAsync(toDelete)
            toast({ title: t('categories.deleted') })
          } catch (err: any) {
            const inUse = err?.code === '23503' || String(err?.message ?? '').includes('foreign key')
            toast({ title: inUse ? t('categories.in_use') : tc('errors.generic'), variant: 'destructive' })
          } finally {
            setToDelete(null)
          }
        }}
      />
    </div>
  )
}

// ============================================================
// Diálogos de formulario
// ============================================================
function LabelFields({
  labels, setLabels, errors,
}: {
  labels: { es: string; en: string }
  setLabels: (l: { es: string; en: string }) => void
  errors: Record<string, string>
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>{t('categories.label_es')}</Label>
        <Input value={labels.es} onChange={(e) => setLabels({ ...labels, es: e.target.value })} />
        {errors.label_es && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.label_es}`)}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>{t('categories.label_en')}</Label>
        <Input value={labels.en} onChange={(e) => setLabels({ ...labels, en: e.target.value })} />
        {errors.label_en && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.label_en}`)}</p>}
      </div>
    </div>
  )
}

function IconField({ icon, setIcon, error }: { icon: string; setIcon: (v: string) => void; error?: string }) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  return (
    <div className="space-y-1.5">
      <Label>{t('categories.icon')}</Label>
      <IconPicker value={icon} onChange={setIcon} />
      <p className="text-xs text-slate-400">{t('categories.icon_hint')}</p>
      {error && <p className="text-xs text-[#CB6391]">{tc(`errors.${error}`)}</p>}
    </div>
  )
}

function SlugField({ slug, setSlug, readOnly, error }: { slug: string; setSlug: (v: string) => void; readOnly: boolean; error?: string }) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  return (
    <div className="space-y-1.5">
      <Label>{t('categories.slug')}</Label>
      <Input value={slug} disabled={readOnly} onChange={(e) => setSlug(e.target.value)} className="font-mono" />
      <p className="text-xs text-slate-400">{readOnly ? t('categories.slug_locked') : t('categories.slug_hint')}</p>
      {error && <p className="text-xs text-[#CB6391]">{tc(`errors.${error}`)}</p>}
    </div>
  )
}

function GroupDialog({
  group, existingGroups, saving, onClose, onSave,
}: {
  group: CategoryGroup | null
  existingGroups: CategoryGroup[]
  saving: boolean
  onClose: () => void
  onSave: (v: { slug: string; type: CategoryType; icon: string | null; color: string | null; sort_order: number; labels: { es: string; en: string } }) => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const isEdit = !!group
  const [slug, setSlug] = useState(group?.slug ?? '')
  const [type, setType] = useState<CategoryType>(group?.type ?? 'gasto')
  const [icon, setIcon] = useState(group?.icon ?? '')
  const [color, setColor] = useState(group?.color ?? '#64748b')
  const [labels, setLabels] = useState(group
    ? { es: currentLabel('group', group.slug, 'es'), en: currentLabel('group', group.slug, 'en') }
    : { es: '', en: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Orden ya no es editable: al crear se añade al final; al editar se conserva.
  const sortOrder = group ? group.sort_order : nextSortOrder(existingGroups)

  function submit() {
    const values = { slug, type, icon, color, sort_order: sortOrder, label_es: labels.es, label_en: labels.en }
    const parsed = categoryGroupFormSchema.safeParse(values)
    setErrors(fieldErrors(parsed))
    if (!parsed.success) return
    onSave({
      slug: slug.trim(), type, icon: icon.trim() || null, color: color || null,
      sort_order: sortOrder, labels: { es: labels.es.trim(), en: labels.en.trim() },
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('categories.edit_group') : t('categories.new_group')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <SlugField slug={slug} setSlug={setSlug} readOnly={isEdit} error={errors.slug} />
          <LabelFields labels={labels} setLabels={setLabels} errors={errors} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('categories.type')}</Label>
              <Select value={type} onValueChange={(v) => setType(v as CategoryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAT_TYPES.map((ty) => <SelectItem key={ty} value={ty}>{tc(`transaction_type.${ty}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('categories.color')}</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 shrink-0 rounded-md border border-input" />
                <Input value={color} onChange={(e) => setColor(e.target.value)} className="font-mono" />
              </div>
              {errors.color && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.color}`)}</p>}
            </div>
          </div>
          <IconField icon={icon} setIcon={setIcon} error={errors.icon} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tc('actions.cancel')}</Button>
          <Button onClick={submit} disabled={saving}>{tc('actions.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CategoryDialog({
  category, groups, existingCategories, defaultGroupId, saving, onClose, onSave,
}: {
  category: Category | null
  groups: CategoryGroup[]
  existingCategories: Category[]
  defaultGroupId?: string
  saving: boolean
  onClose: () => void
  onSave: (v: { slug: string; group_id: string; icon: string | null; sort_order: number; labels: { es: string; en: string } }) => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const isEdit = !!category
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [groupId, setGroupId] = useState(category?.group_id ?? defaultGroupId ?? '')
  const [icon, setIcon] = useState(category?.icon ?? '')
  const [labels, setLabels] = useState(category
    ? { es: currentLabel('category', category.slug, 'es'), en: currentLabel('category', category.slug, 'en') }
    : { es: '', en: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Orden ya no es editable: al crear se añade al final; al editar se conserva.
  const sortOrder = category ? category.sort_order : nextSortOrder(existingCategories)

  function submit() {
    const values = { slug, group_id: groupId, icon, sort_order: sortOrder, label_es: labels.es, label_en: labels.en }
    const parsed = categoryFormSchema.safeParse(values)
    setErrors(fieldErrors(parsed))
    if (!parsed.success) return
    onSave({
      slug: slug.trim(), group_id: groupId, icon: icon.trim() || null,
      sort_order: sortOrder, labels: { es: labels.es.trim(), en: labels.en.trim() },
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('categories.edit_category') : t('categories.new_category')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <SlugField slug={slug} setSlug={setSlug} readOnly={isEdit} error={errors.slug} />
          <LabelFields labels={labels} setLabels={setLabels} errors={errors} />
          <div className="space-y-1.5">
            <Label>{t('categories.group')}</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger><SelectValue placeholder={t('categories.pick_group')} /></SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{currentLabel('group', g.slug, i18n.language?.slice(0, 2) || 'es') || g.slug}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.group_id && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.group_id}`)}</p>}
          </div>
          <IconField icon={icon} setIcon={setIcon} error={errors.icon} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tc('actions.cancel')}</Button>
          <Button onClick={submit} disabled={saving}>{tc('actions.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmDelete({
  open, name, pending, onCancel, onConfirm,
}: {
  open: boolean
  name: string
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t('categories.delete_title')}</DialogTitle>
          <DialogDescription>{t('categories.delete_body', { name })}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>{tc('actions.cancel')}</Button>
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>{tc('actions.delete')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
