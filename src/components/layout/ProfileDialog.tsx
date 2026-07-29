import { useState } from 'react'
import { Check, Pencil, Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProfile } from '@/contexts/ProfileContext'
import { useProfiles, useCreateProfile, useUpdateProfile } from '@/hooks/useProfiles'
import { useUserSettings } from '@/hooks/useUserSettings'
import { useLimitGate } from '@/hooks/usePlan'
import { LimitReachedDialog } from '@/components/plan/LimitReachedDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { profileNameSchema, firstError, LIMITS } from '@/lib/validation'
import { toast } from '@/hooks/useToast'
import type { FinancialProfile, FinancialProfileType } from '@/lib/database.types'

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#06b6d4']
const PROFILE_TYPES: FinancialProfileType[] = ['particular', 'autonomo', 'empresa']
const TYPE_PILL_CLASS: Record<FinancialProfileType, string> = {
  particular: 'bg-slate-100 text-slate-600',
  autonomo: 'bg-amber-100 text-amber-700',
  empresa: 'bg-indigo-100 text-indigo-700',
}

export function ProfileAvatar({ profile, size = 'sm' }: { profile: FinancialProfile; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', sz)}
      style={{ backgroundColor: profile.avatar_color }}
    >
      {profile.name.charAt(0).toUpperCase()}
    </span>
  )
}

function TypePill({ type }: { type: FinancialProfileType }) {
  const { t } = useTranslation('common')
  return (
    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', TYPE_PILL_CLASS[type])}>
      {t(`profile.type.${type}`)}
    </span>
  )
}

function TypeSelector({ value, onChange }: { value: FinancialProfileType; onChange: (t: FinancialProfileType) => void }) {
  const { t } = useTranslation('common')
  return (
    <div className="flex gap-1.5">
      {PROFILE_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
            value === type ? TYPE_PILL_CLASS[type] : 'bg-slate-50 text-slate-400 hover:bg-slate-100',
          )}
        >
          {t(`profile.type.${type}`)}
        </button>
      ))}
    </div>
  )
}

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Popup de perfiles: explica qué es un perfil financiero, permite cambiar
 * entre los existentes, renombrarlos/reclasificarlos y crear uno nuevo (con
 * gate de límite de plan).
 */
export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { t } = useTranslation('common')
  const { activeProfile, setActiveProfile } = useProfile()
  const { data: profiles = [] } = useProfiles()
  const { data: settings } = useUserSettings()
  const accountName = settings?.first_name?.trim() || t('sidebar.user_fallback')
  const createProfile = useCreateProfile()
  const updateProfile = useUpdateProfile()
  const profilesLimit = useLimitGate('profiles')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<FinancialProfileType>('particular')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<FinancialProfileType>('particular')
  const [showLimitDialog, setShowLimitDialog] = useState(false)

  function resetCreateState() {
    setCreating(false)
    setNewName('')
    setNewType('particular')
  }

  function startEdit(p: FinancialProfile) {
    setEditingId(p.id)
    setEditName(p.name)
    setEditType(p.type)
  }

  async function saveEdit() {
    const name = editName.trim()
    if (!name || !editingId) return
    if (firstError(profileNameSchema.safeParse(name))) {
      toast({ variant: 'destructive', title: t('errors.invalid_input') })
      return
    }
    await updateProfile.mutateAsync({ id: editingId, name, type: editType })
    setEditingId(null)
  }

  function handleNewProfileClick() {
    if (profilesLimit.limited) {
      onOpenChange(false)
      setShowLimitDialog(true)
      return
    }
    setCreating(true)
  }

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    if (profilesLimit.limited) {
      onOpenChange(false)
      setShowLimitDialog(true)
      return
    }
    if (firstError(profileNameSchema.safeParse(name))) {
      toast({ variant: 'destructive', title: t('errors.invalid_input') })
      return
    }
    const color = AVATAR_COLORS[profiles.length % AVATAR_COLORS.length]
    const result = await createProfile.mutateAsync({
      name,
      avatar_color: color,
      is_default: profiles.length === 0,
      type: newType,
    })
    setActiveProfile(result as FinancialProfile)
    resetCreateState()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { resetCreateState(); setEditingId(null) } }}>
        <DialogContent className="max-h-[90dvh] w-full overflow-y-auto sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="break-words">{t('profile.title')}</DialogTitle>
            <DialogDescription className="break-words">{t('profile.explainer')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            {profiles.map((p) =>
              editingId === p.id ? (
                <div key={p.id} className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    maxLength={LIMITS.profileName}
                  />
                  <TypeSelector value={editType} onChange={setEditType} />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" />
                      {t('actions.cancel')}
                    </Button>
                    <Button size="sm" onClick={saveEdit} disabled={!editName.trim() || updateProfile.isPending}>
                      <Check className="h-3.5 w-3.5" />
                      {t('actions.save')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center gap-1 rounded-xl border transition-colors',
                    activeProfile?.id === p.id ? 'border-[var(--brand-primary-3)] bg-[var(--brand-primary-3)]/10' : 'border-slate-200',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => { setActiveProfile(p); onOpenChange(false) }}
                    className={cn('flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left', activeProfile?.id !== p.id && 'hover:bg-slate-50')}
                  >
                    <ProfileAvatar profile={p.is_default ? { ...p, name: accountName } : p} size="md" />
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{p.is_default ? accountName : p.name}</span>
                    <TypePill type={p.type} />
                    {activeProfile?.id === p.id && <Check className="h-4 w-4 shrink-0 text-[var(--brand-primary-3)]" />}
                  </button>
                  {/* El perfil por defecto representa al titular de la cuenta: su
                      nombre solo se cambia desde Ajustes > Perfil, no aquí. */}
                  {!p.is_default && (
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      aria-label={t('profile.rename')}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ),
            )}
          </div>

          {creating ? (
            <div className="space-y-2 rounded-xl border border-slate-200 p-3">
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder={t('profile.new')}
                  maxLength={LIMITS.profileName}
                />
                <Button onClick={handleCreate} disabled={!newName.trim() || createProfile.isPending}>
                  {t('actions.add')}
                </Button>
              </div>
              <TypeSelector value={newType} onChange={setNewType} />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleNewProfileClick}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700"
            >
              <Plus className="h-4 w-4 shrink-0" />
              {t('profile.new')}
            </button>
          )}
        </DialogContent>
      </Dialog>

      {profilesLimit.limit != null && (
        <LimitReachedDialog
          open={showLimitDialog}
          onOpenChange={setShowLimitDialog}
          dimension="profiles"
          plan={profilesLimit.plan!}
          limit={profilesLimit.limit}
        />
      )}
    </>
  )
}
