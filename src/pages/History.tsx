import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, AlertTriangle, FilterX, Loader2 } from 'lucide-react'
import { useProfile } from '@/contexts/ProfileContext'
import { useAccounts } from '@/hooks/useAccounts'
import {
  useImportBatches,
  useReassignBatch,
  useDeleteBatch,
  REASSIGN_DUPLICATE_ERROR,
  type ImportBatchRow,
} from '@/hooks/useImportBatches'
import { accountTypeMeta } from '@/lib/accountTypes'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { toast } from '@/hooks/useToast'
import type { AccountType } from '@/lib/database.types'

interface HistoryFilters {
  entity?: string
  accountType?: AccountType
  accountId?: string // alias = una cuenta concreta
  dateFrom?: string
  dateTo?: string
}

const ALL = '__all__'

// `imported_at` es un timestamptz en UTC → lo mostramos en hora LOCAL del usuario.
function localDate(iso: string): string {
  const d = new Date(iso)
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return formatDate(ymd)
}
function localTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

type DeleteStep = 'first' | 'second'

export default function History() {
  const { t } = useTranslation('history')
  const { t: tc } = useTranslation('common')
  const { activeProfile } = useProfile()

  const { data: batches = [], isLoading } = useImportBatches(activeProfile?.id)
  // Incluye archivadas: el destino de reasignación puede ser cualquier cuenta viva
  // del perfil; y un lote puede apuntar a una cuenta ya archivada.
  const { data: accounts = [] } = useAccounts(activeProfile?.id, { includeArchived: true })
  const reassign = useReassignBatch()
  const deleteBatch = useDeleteBatch()

  const [filters, setFilters] = useState<HistoryFilters>({})

  // Reasignación
  const [editing, setEditing] = useState<ImportBatchRow | null>(null)
  const [targetAccountId, setTargetAccountId] = useState('')

  // Borrado en dos pasos
  const [deleting, setDeleting] = useState<ImportBatchRow | null>(null)
  const [deleteStep, setDeleteStep] = useState<DeleteStep>('first')

  const busy = reassign.isPending || deleteBatch.isPending

  // Opciones de filtro derivadas de los lotes cargados (solo lo relevante).
  const entityOptions = useMemo(
    () => [...new Set(batches.map(b => b.account?.entity).filter(Boolean) as string[])].sort(),
    [batches],
  )
  const typeOptions = useMemo(
    () => [...new Set(batches.map(b => b.account?.type).filter(Boolean) as AccountType[])],
    [batches],
  )
  const aliasOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of batches) if (b.account) map.set(b.account.id, b.account.name)
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [batches])

  const filtered = useMemo(
    () =>
      batches.filter(b => {
        if (filters.entity && b.account?.entity !== filters.entity) return false
        if (filters.accountType && b.account?.type !== filters.accountType) return false
        if (filters.accountId && b.account_id !== filters.accountId) return false
        const d = b.imported_at.slice(0, 10)
        if (filters.dateFrom && d < filters.dateFrom) return false
        if (filters.dateTo && d > filters.dateTo) return false
        return true
      }),
    [batches, filters],
  )

  const hasActiveFilters = !!(
    filters.entity || filters.accountType || filters.accountId || filters.dateFrom || filters.dateTo
  )

  function clearFilters() {
    setFilters({})
  }

  function openEdit(batch: ImportBatchRow) {
    setEditing(batch)
    setTargetAccountId('')
  }

  async function confirmReassign() {
    if (!editing || !activeProfile || !targetAccountId) return
    try {
      await reassign.mutateAsync({
        batchId: editing.id,
        fromAccountId: editing.account_id,
        toAccountId: targetAccountId,
        profileId: activeProfile.id,
      })
      toast({ variant: 'success', title: t('reassign_dialog.done_toast') })
      setEditing(null)
    } catch (err: any) {
      if (err?.message === REASSIGN_DUPLICATE_ERROR) {
        toast({ variant: 'destructive', title: t('reassign_dialog.duplicate_error') })
      } else {
        console.error('[History] reassign failed:', err)
        toast({ variant: 'destructive', title: tc('errors.save_failed'), description: err?.message })
      }
    }
  }

  function openDelete(batch: ImportBatchRow) {
    setDeleting(batch)
    setDeleteStep('first')
  }
  function closeDelete() {
    setDeleting(null)
    setDeleteStep('first')
  }

  async function confirmDelete() {
    if (!deleting || !activeProfile) return
    try {
      await deleteBatch.mutateAsync({
        batchId: deleting.id,
        accountId: deleting.account_id,
        profileId: activeProfile.id,
      })
      toast({ variant: 'success', title: t('delete_dialog.deleted_toast') })
    } catch (err: any) {
      console.error('[History] delete failed:', err)
      toast({ variant: 'destructive', title: tc('errors.delete_failed'), description: err?.message })
    }
    closeDelete()
  }

  // Cuentas destino para reasignar: activas del perfil, excluyendo la actual del lote.
  const reassignTargets = accounts.filter(a => a.is_active && a.id !== editing?.account_id)

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      {/* Header anclado (no hace scroll): título + filtros */}
      <div className="shrink-0 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">{t('title')}</h1>
          <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasActiveFilters}>
            <FilterX className="h-4 w-4" />
            {t('filters.clear')}
          </Button>
        </div>

        {/* Fila de filtros estilo Movimientos (selects en blanco + rango de fecha) */}
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          <Select
            value={filters.entity ?? ALL}
            onValueChange={v => setFilters(f => ({ ...f, entity: v === ALL ? undefined : v }))}
          >
            <SelectTrigger className="bg-card"><SelectValue placeholder={t('filters.all_entities')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('filters.all_entities')}</SelectItem>
              {entityOptions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            value={filters.accountType ?? ALL}
            onValueChange={v => setFilters(f => ({ ...f, accountType: v === ALL ? undefined : (v as AccountType) }))}
          >
            <SelectTrigger className="bg-card"><SelectValue placeholder={t('filters.all_types')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('filters.all_types')}</SelectItem>
              {typeOptions.map(ty => <SelectItem key={ty} value={ty}>{tc(`account_type.${ty}`)}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            value={filters.accountId ?? ALL}
            onValueChange={v => setFilters(f => ({ ...f, accountId: v === ALL ? undefined : v }))}
          >
            <SelectTrigger className="bg-card"><SelectValue placeholder={t('filters.all_aliases')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('filters.all_aliases')}</SelectItem>
              {aliasOptions.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
            </SelectContent>
          </Select>

          <DatePickerField
            value={filters.dateFrom}
            placeholder={t('filters.date_from')}
            onChange={v => setFilters(f => ({ ...f, dateFrom: v }))}
          />
          <DatePickerField
            value={filters.dateTo}
            placeholder={t('filters.date_to')}
            onChange={v => setFilters(f => ({ ...f, dateTo: v }))}
          />
        </div>
      </div>

      {/* Contenido con scroll propio */}
      <div className="mt-6 flex-1 min-h-0 overflow-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">{t('columns.date')}</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell whitespace-nowrap">{t('columns.time')}</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell whitespace-nowrap">{t('columns.type')}</th>
              <th className="px-4 py-3 text-left font-medium w-full">{t('columns.entity')}</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell whitespace-nowrap">{t('columns.period_from')}</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell whitespace-nowrap">{t('columns.period_to')}</th>
              <th className="px-4 py-3 text-right font-medium whitespace-nowrap">{t('columns.movements')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-4 w-10" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-4 w-16" /></td>
                  </tr>
                ))
              : filtered.map(b => {
                  const type = b.account?.type
                  const meta = type ? accountTypeMeta(type) : null
                  const TypeIcon = meta?.icon
                  return (
                    <tr key={b.id} className="border-t transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>{localDate(b.imported_at)}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{localTime(b.imported_at)}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground whitespace-nowrap">
                        {localTime(b.imported_at)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap">
                        {type && TypeIcon && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: `${meta!.color}1f`, color: meta!.color }}
                          >
                            <TypeIcon className="h-3 w-3" />
                            {tc(`account_type.${type}`)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold uppercase tracking-wide break-words">{b.account?.entity ?? '—'}</div>
                        {b.account && b.account.name.trim().toLowerCase() !== b.account.entity.trim().toLowerCase() && (
                          <div className="text-xs text-muted-foreground break-words">{b.account.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell whitespace-nowrap text-muted-foreground">
                        {b.date_from ? formatDate(b.date_from) : '—'}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell whitespace-nowrap text-muted-foreground">
                        {b.date_to ? formatDate(b.date_to) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{b.rows_imported}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            aria-label={tc('actions.edit')}
                            onClick={() => openEdit(b)}
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={tc('actions.delete')}
                            onClick={() => openDelete(b)}
                            className="rounded-lg p-1.5 text-[#CB6391] transition-colors hover:bg-rose-50 hover:text-[#b0466f]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p>{batches.length === 0 ? t('empty.none') : t('empty.no_results')}</p>
          </div>
        )}
      </div>

      {/* Diálogo Editar: reasignar el lote a otra cuenta */}
      <Dialog open={!!editing} onOpenChange={open => { if (!open && !busy) setEditing(null) }}>
        <DialogContent className="sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('reassign_dialog.title')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('reassign_dialog.description', {
                entity: editing?.account?.entity ?? '—',
                count: editing?.rows_imported ?? 0,
              })}
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('reassign_dialog.target_label')}</label>
              <Select value={targetAccountId} onValueChange={setTargetAccountId}>
                <SelectTrigger className="bg-card"><SelectValue placeholder={t('reassign_dialog.target_placeholder')} /></SelectTrigger>
                <SelectContent>
                  {reassignTargets.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {tc(`account_type.${a.type}`)} · {a.entity}{a.name.trim().toLowerCase() !== a.entity.trim().toLowerCase() ? ` · ${a.name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reassignTargets.length === 0 && (
                <p className="text-xs text-muted-foreground">{t('reassign_dialog.no_targets')}</p>
              )}
            </div>

            {reassign.isPending && (
              <p className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                {t('processing_note')}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>
              {tc('actions.cancel')}
            </Button>
            <Button onClick={confirmReassign} disabled={busy || !targetAccountId}>
              {reassign.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {reassign.isPending ? t('reassign_dialog.working') : t('reassign_dialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Eliminar en dos pasos (patrón de Cuentas) */}
      <Dialog open={!!deleting} onOpenChange={open => { if (!open && !busy) closeDelete() }}>
        <DialogContent className="sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
          {deleteStep === 'first' ? (
            <>
              <DialogHeader>
                <DialogTitle>{t('delete_dialog.title')}</DialogTitle>
              </DialogHeader>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-slate-700">
                {t('delete_dialog.warning', {
                  entity: deleting?.account?.entity ?? '—',
                  count: deleting?.rows_imported ?? 0,
                })}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDelete} disabled={busy}>
                  {tc('actions.cancel')}
                </Button>
                <Button variant="destructive" onClick={() => setDeleteStep('second')} disabled={busy}>
                  {tc('actions.delete')}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[#CB6391]">
                  <AlertTriangle className="h-5 w-5" />
                  {t('delete_dialog.confirm_title')}
                </DialogTitle>
              </DialogHeader>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-slate-700">
                {t('delete_dialog.confirm_warning')}
              </div>
              {deleteBatch.isPending && (
                <p className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  {t('processing_note')}
                </p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteStep('first')} disabled={busy}>
                  {tc('actions.back')}
                </Button>
                <Button variant="destructive" onClick={confirmDelete} disabled={busy}>
                  {deleteBatch.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {deleteBatch.isPending ? t('delete_dialog.working') : t('delete_dialog.confirm_action')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
