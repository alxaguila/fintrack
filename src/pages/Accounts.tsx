import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Archive, Trash2, AlertTriangle } from 'lucide-react'
import { useProfile } from '@/contexts/ProfileContext'
import { useAccounts, useDeleteAccount, useUpdateAccount } from '@/hooks/useAccounts'
import { useBankEntities } from '@/hooks/useBankEntities'
import { useLimitGate } from '@/hooks/usePlan'
import { AccountFormDialog } from '@/components/accounts/AccountForm'
import { AccountCard } from '@/components/accounts/AccountCard'
import { LimitReachedDialog } from '@/components/plan/LimitReachedDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { FILTER_TYPES, ACCOUNT_SECTIONS, type AccountFilter } from '@/lib/accountTypes'
import type { Account, AccountType } from '@/lib/database.types'

type DeleteStep = 'choose' | 'confirm'

export default function Accounts() {
  const { t } = useTranslation('accounts')
  const { t: tc } = useTranslation('common')
  const { activeProfile } = useProfile()
  const { data: accounts = [] } = useAccounts(activeProfile?.id)
  const { data: entities = [] } = useBankEntities()
  const deleteAccount = useDeleteAccount()
  const updateAccount = useUpdateAccount()
  const accountsLimit = useLimitGate('accounts')
  const [showLimitDialog, setShowLimitDialog] = useState(false)

  // Mapa entidad (minúsculas) → logo, para que la tarjeta herede el logo del catálogo.
  const entityLogoByName = useMemo(() => {
    const m = new Map<string, string | null>()
    for (const e of entities) m.set(e.name.trim().toLowerCase(), e.logo_url)
    return m
  }, [entities])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [createType, setCreateType] = useState<AccountType | undefined>(undefined)
  const [filter, setFilter] = useState<AccountFilter>('all')

  const counts = useMemo(() => ({
    all: accounts.length,
    checking: accounts.filter(a => FILTER_TYPES.checking.includes(a.type)).length,
    savings: accounts.filter(a => FILTER_TYPES.savings.includes(a.type)).length,
    cards: accounts.filter(a => FILTER_TYPES.cards.includes(a.type)).length,
    securities: accounts.filter(a => FILTER_TYPES.securities.includes(a.type)).length,
  }), [accounts])

  const filterTabs: AccountFilter[] = ['all', 'checking', 'savings', 'cards', 'securities']

  // Secciones a mostrar: todas si el filtro es "all", si no solo la elegida.
  const shownSections = ACCOUNT_SECTIONS.filter(s => filter === 'all' || filter === s.key)

  // Diálogo de eliminación en dos pasos: elegir acción → reconfirmar borrado total
  const [target, setTarget] = useState<Account | null>(null)
  const [deleteStep, setDeleteStep] = useState<DeleteStep>('choose')
  const busy = deleteAccount.isPending || updateAccount.isPending

  function openCreate(defaultType?: AccountType) {
    if (accountsLimit.limited) {
      setShowLimitDialog(true)
      return
    }
    setEditing(null)
    setCreateType(defaultType)
    setDialogOpen(true)
  }

  function openEdit(account: Account) {
    setEditing(account)
    setDialogOpen(true)
  }

  function openDelete(account: Account) {
    setTarget(account)
    setDeleteStep('choose')
  }

  function closeDelete() {
    setTarget(null)
    setDeleteStep('choose')
  }

  async function handleArchive() {
    if (!target) return
    try {
      await updateAccount.mutateAsync({ id: target.id, is_active: false })
      toast({ variant: 'success', title: t('delete_dialog.archived_toast') })
    } catch (err: any) {
      console.error('[Accounts] archive failed:', err)
      toast({ title: tc('errors.save_failed'), description: err?.message, variant: 'destructive' })
    }
    closeDelete()
  }

  async function handleHardDelete() {
    if (!target || !activeProfile) return
    try {
      await deleteAccount.mutateAsync({ id: target.id, profileId: activeProfile.id })
      toast({ variant: 'success', title: t('delete_dialog.deleted_toast') })
    } catch (err: any) {
      console.error('[Accounts] delete failed:', err)
      toast({ title: tc('errors.delete_failed'), description: err?.message, variant: 'destructive' })
    }
    closeDelete()
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      {/* Header inmóvil: título + botón + filtros */}
      <div className="shrink-0 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">{t('title')}</h1>
          <Button onClick={() => openCreate()} disabled={!activeProfile}>
            <Plus className="h-4 w-4" /> {t('new_account')}
          </Button>
        </div>

        {/* Filtros por tipo (neutros): la pastilla activa va en oscuro */}
        <div className="flex flex-wrap gap-2">
          {filterTabs.map(key => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                filter === key
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              {t(`groups.${key}`)} <span className="opacity-60">{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Secciones con scroll vertical propio (el header de arriba queda fijo).
          Cada fila de tipo scrollea en horizontal mostrando ~4,5 tarjetas. */}
      <div className="mt-6 flex-1 space-y-8 overflow-y-auto pr-1">
        {shownSections.map(section => {
          const items = accounts.filter(a => FILTER_TYPES[section.key].includes(a.type))
          return (
            <section key={section.key} className="space-y-3">
              <h2 className="text-[15px] font-bold">
                {t(`groups.${section.key}`)}
                <span className="ml-2 font-medium text-slate-400">{items.length}</span>
              </h2>
              <div className="no-scrollbar grid grid-flow-col gap-4 overflow-x-auto pb-2
                              auto-cols-[85%] sm:auto-cols-[46%] lg:auto-cols-[31%] xl:auto-cols-[22%]">
                {items.map(account => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    entityLogoUrl={entityLogoByName.get(account.entity.trim().toLowerCase()) ?? null}
                    onEdit={openEdit}
                    onDelete={openDelete}
                  />
                ))}
                <AddAccountCard
                  label={t(`add_in.${section.key}`)}
                  disabled={!activeProfile}
                  onClick={() => openCreate(section.defaultType)}
                />
              </div>
            </section>
          )
        })}
      </div>

      {/* Create/Edit dialog (shared component) */}
      {activeProfile && (
        <AccountFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          profileId={activeProfile.id}
          editing={editing}
          defaultType={createType}
          sortOrder={accounts.length}
        />
      )}

      {/* Diálogo de eliminación: dos pasos */}
      <Dialog open={!!target} onOpenChange={open => { if (!open) closeDelete() }}>
        <DialogContent className="sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
          {deleteStep === 'choose' ? (
            <>
              <DialogHeader>
                <DialogTitle>{t('delete_dialog.title', { name: target?.name })}</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                {/* Archivar: oculta la cuenta pero conserva sus movimientos */}
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleArchive}
                  className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 p-4 text-left
                             transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  <Archive className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                  <span className="space-y-0.5">
                    <span className="block text-[15px] font-bold text-slate-900">{t('delete_dialog.archive')}</span>
                    <span className="block text-sm text-muted-foreground">{t('delete_dialog.archive_hint')}</span>
                  </span>
                </button>

                {/* Eliminar todo: pasa a la reconfirmación */}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setDeleteStep('confirm')}
                  className="flex w-full items-start gap-3 rounded-2xl border border-rose-200 p-4 text-left
                             transition-colors hover:bg-rose-50 disabled:opacity-50"
                >
                  <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-[#CB6391]" />
                  <span className="space-y-0.5">
                    <span className="block text-[15px] font-bold text-[#CB6391]">{t('delete_dialog.delete_all')}</span>
                    <span className="block text-sm text-muted-foreground">{t('delete_dialog.delete_all_hint')}</span>
                  </span>
                </button>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeDelete} disabled={busy}>
                  {tc('actions.cancel')}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[#CB6391]">
                  <AlertTriangle className="h-5 w-5" />
                  {t('delete_dialog.confirm_title', { name: target?.name })}
                </DialogTitle>
              </DialogHeader>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-slate-700">
                {t('delete_dialog.confirm_warning')}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteStep('choose')} disabled={busy}>
                  {tc('actions.cancel')}
                </Button>
                <Button variant="destructive" onClick={handleHardDelete} disabled={busy}>
                  {t('delete_dialog.confirm_action')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {accountsLimit.limit != null && (
        <LimitReachedDialog
          open={showLimitDialog}
          onOpenChange={setShowLimitDialog}
          dimension="accounts"
          plan={accountsLimit.plan!}
          limit={accountsLimit.limit}
        />
      )}
    </div>
  )
}

/** Tarjeta gris punteada de "añadir cuenta" al final de cada sección. */
function AddAccountCard({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-full min-h-[128px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300
                 bg-slate-100 p-5 text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-200 hover:text-slate-700
                 disabled:pointer-events-none disabled:opacity-50"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
        <Plus className="h-5 w-5" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
